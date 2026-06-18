import { Injectable } from "@nestjs/common";
import { Prisma, ExchangeTimezone } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { QuoteCacheService } from "./quoteCache.service";
import { CachedQuote } from "./quoteCache.constant";

/**
 * 적재된 틱 1건 + 원화환산가
 * priceKrw: 미장은 t_xprc(원환산당일가격), 국장은 price 와 동일(원화) 또는 null
 */
export interface IngestedQuote {
  stockId: number;
  price: Prisma.Decimal | string | number;
  priceKrw?: Prisma.Decimal | string | number | null;
  volume: bigint | null;
  change: number;
}

/** 시세 시트용: 현재 시세 + 등락률(daily/m15/m30) */
export interface QuoteWithChangeRate {
  stockId: number;
  price: number | null;
  priceKrw: number | null;
  volume: number | null;
  changeRate: {
    daily: number | null; // 전일 종가 대비 (한투 등락률)
    m15: number | null; // 15분 전 대비 (정규장 외에는 null)
    m30: number | null; // 30분 전 대비 (정규장 외에는 null)
  };
}

@Injectable()
export class QuoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: QuoteCacheService,
  ) {}

  /** 적재된 틱 + 등락률로 최신 시세 캐시 갱신 */
  async cacheIngestedQuotes(userId: string, quotes: IngestedQuote[], capturedAt: Date): Promise<void> {
    if (quotes.length === 0) return;

    const entries = quotes.map((q) => ({
      stockId: q.stockId,
      quote: {
        price: Number(q.price),
        priceKrw: q.priceKrw != null ? Number(q.priceKrw) : null, // 원화환산가
        volume: q.volume != null ? Number(q.volume) : 0,
        change: q.change,
        capturedAt: capturedAt.toISOString(),
      } as CachedQuote,
    }));

    await this.cache.setQuotes(userId, entries);
  }

  /** 목록 조회용: 종목별 최신 시세 (캐시 우선 → 미스만 ticks 폴백). */
  async getLatestQuotes(userId: string, stockIds: number[]): Promise<Map<number, CachedQuote>> {
    const cached = await this.cache.getQuotes(userId, stockIds);
    const missIds = stockIds.filter((id) => !cached.has(id));
    if (missIds.length === 0) return cached;

    const fallback = await this.fetchQuotesFromDb(userId, missIds);
    for (const [id, q] of fallback) cached.set(id, q);
    return cached;
  }

  /**
   * 시세 시트용: 종목별 현재 시세 + 등락률(daily/m15/m30).
   *  - price/priceKrw/volume/daily 는 getLatestQuotes(캐시 우선)에서.
   *  - m15/m30 은 정규장일 때만 계산. 정규장이 아니면 null.
   *    (거래소 타임존별로 장 시간 판단 — 국장 KST 09:00~15:30, 미장 ET 09:30~16:00)
   */
  async getQuotesWithChangeRate(userId: string, stockIds: number[]): Promise<QuoteWithChangeRate[]> {
    if (stockIds.length === 0) return [];

    // 종목별 거래소 타임존 조회 (정규장 판단용)
    const stocks = await this.prisma.stock.findMany({
      where: { id: { in: stockIds } },
      select: { id: true, exchangeTimezone: true },
    });
    const tzByStock = new Map<number, ExchangeTimezone>();
    for (const s of stocks) tzByStock.set(s.id, s.exchangeTimezone);

    const latest = await this.getLatestQuotes(userId, stockIds);
    const past15 = await this.fetchPricesAt(userId, stockIds, 15);
    const past30 = await this.fetchPricesAt(userId, stockIds, 30);

    return stockIds.map((stockId) => {
      const q = latest.get(stockId);
      const price = q?.price ?? null;
      const tz = tzByStock.get(stockId);
      // 정규장이 아니면 m15/m30 은 계산하지 않고 null
      const open = tz ? this.isMarketOpen(tz) : false;

      return {
        stockId,
        price,
        priceKrw: q?.priceKrw ?? null,
        volume: q?.volume ?? null,
        changeRate: {
          daily: q?.change ?? null, // 한투 등락률(전일 대비) — 정규장 무관
          m15: open ? this.calcRate(price, past15.get(stockId) ?? null) : null,
          m30: open ? this.calcRate(price, past30.get(stockId) ?? null) : null,
        },
      };
    });
  }

  /**
   * 거래소 타임존 기준 정규장 여부.
   *  - Asia/Seoul(국장): 평일 09:00 ~ 15:30
   *  - America/New_York(미장): 평일 09:30 ~ 16:00
   * (공휴일/조기폐장 미반영 — 폴러의 isMarketOpen 과 동일 한계)
   */
  private isMarketOpen(tz: ExchangeTimezone): boolean {
    const timeZone = tz === ExchangeTimezone.AMERICA_NEW_YORK ? "America/New_York" : "Asia/Seoul";
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hour12: false,
    }).formatToParts(new Date());

    const get = (t: string) => parts.find((p) => p.type === t)!.value;
    const h = Number(get("hour")) % 24;
    const m = Number(get("minute"));
    const wd = get("weekday");

    if (wd === "Sat" || wd === "Sun") return false; // 주말 제외
    // TODO: 공휴일 제외 로직 필요

    const afterMin = h * 60 + m;
    if (tz === ExchangeTimezone.AMERICA_NEW_YORK) {
      return afterMin >= 9 * 60 + 30 && afterMin <= 16 * 60; // 09:30 ~ 16:00
    }
    return afterMin >= 9 * 60 && afterMin <= 15 * 60 + 30; // 09:00 ~ 15:30
  }

  /** (현재가 - 과거가) / 과거가 * 100. 둘 중 하나라도 없거나 과거가 0이면 null. */
  private calcRate(now: number | null, past: number | null): number | null {
    if (now == null || past == null || past === 0) return null;
    return Number((((now - past) / past) * 100).toFixed(2));
  }

  /** 각 종목의 "N분 전 시점 직전 마지막 틱 가격" 일괄 조회. */
  private async fetchPricesAt(userId: string, stockIds: number[], minutesAgo: number): Promise<Map<number, number>> {
    const rows = await this.prisma.withUser(
      userId,
      (tx) =>
        tx.$queryRaw<{ stock_id: number; price: Prisma.Decimal }[]>`
        SELECT DISTINCT ON (stock_id) stock_id, price
        FROM ticks
        WHERE user_id = ${userId}::uuid
          AND stock_id IN (${Prisma.join(stockIds)})
          AND captured_at <= now() - (${minutesAgo} || ' minutes')::interval
        ORDER BY stock_id, captured_at DESC
      `,
    );
    const map = new Map<number, number>();
    for (const r of rows) map.set(r.stock_id, Number(r.price));
    return map;
  }

  /**
   * 캐시 미스 폴백: ticks 최신 1건으로 price/priceKrw/volume 채움
   * 등락률은 틱에 없어 폴백 경로에서는 change=0 (다음 폴링에 갱신)
   */
  private async fetchQuotesFromDb(userId: string, stockIds: number[]): Promise<Map<number, CachedQuote>> {
    const rows = await this.prisma.withUser(
      userId,
      (tx) =>
        tx.$queryRaw<
          { stock_id: number; price: Prisma.Decimal | null; price_krw: Prisma.Decimal | null; volume: bigint | null }[]
        >`
        SELECT DISTINCT ON (stock_id) stock_id, price, price_krw, volume
        FROM ticks
        WHERE user_id = ${userId}::uuid
          AND stock_id IN (${Prisma.join(stockIds)})
        ORDER BY stock_id, captured_at DESC
      `,
    );

    const map = new Map<number, CachedQuote>();
    for (const r of rows) {
      map.set(r.stock_id, {
        price: r.price != null ? Number(r.price) : 0,
        priceKrw: r.price_krw != null ? Number(r.price_krw) : null,
        volume: r.volume != null ? Number(r.volume) : 0,
        change: 0,
        capturedAt: new Date().toISOString(),
      });
    }
    return map;
  }
}
