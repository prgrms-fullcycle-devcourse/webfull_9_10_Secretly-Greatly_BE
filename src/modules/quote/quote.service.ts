import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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
