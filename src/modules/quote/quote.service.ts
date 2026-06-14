import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { QuoteCacheService } from "./quoteCache.service";
import { CachedQuote } from "./quoteCache.constant";

/**
 * 적재된 틱 1건
 */
export interface IngestedQuote {
  stockId: number;
  price: Prisma.Decimal | string | number;
  volume: bigint | null;
  change: number;
}

/**
 * 시세 도메인 서비스
 * - 캐시(QuoteCacheService)와 DB(Prisma)를 조율
 */
@Injectable()
export class QuoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: QuoteCacheService,
  ) {}

  /** 적재된 틱 + 등락률로 최신 시세 캐시 갱신. 국장/미장 ingest 가 틱 적재 직후 호출. */
  async cacheIngestedQuotes(userId: string, quotes: IngestedQuote[], capturedAt: Date): Promise<void> {
    if (quotes.length === 0) return;

    const entries = quotes.map((q) => ({
      stockId: q.stockId,
      quote: {
        price: Number(q.price),
        volume: q.volume != null ? Number(q.volume) : 0,
        change: q.change,
        capturedAt: capturedAt.toISOString(),
      } as CachedQuote,
    }));

    await this.cache.setQuotes(userId, entries);
  }

  /**
   * 목록 조회용: 종목별 최신 시세 (캐시 우선 → 미스만 ticks 폴백).
   * @returns stockId → CachedQuote. 캐시에도 틱에도 없으면 맵에 없음(호출측 0 처리).
   */
  async getLatestQuotes(userId: string, stockIds: number[]): Promise<Map<number, CachedQuote>> {
    const cached = await this.cache.getQuotes(userId, stockIds);
    const missIds = stockIds.filter((id) => !cached.has(id));
    if (missIds.length === 0) return cached;

    const fallback = await this.fetchQuotesFromDb(userId, missIds);
    for (const [id, q] of fallback) cached.set(id, q);
    return cached;
  }

  /**
   * 캐시 미스 폴백: ticks 최신 1건으로 price/volume 채움.
   * 단, 등락률은 틱에 없으므로 폴백 경로에서는 change=0.
   * (등락률은 한투 응답값이라 캐시에만 있음. 폴백은 캐시 만료 직후 등
   *  드문 경우이고, 다음 폴링(최대 30초)에 등락률 포함 값으로 다시 채워진다.)
   */
  private async fetchQuotesFromDb(userId: string, stockIds: number[]): Promise<Map<number, CachedQuote>> {
    const rows = await this.prisma.withUser(
      userId,
      (tx) =>
        tx.$queryRaw<{ stock_id: number; price: Prisma.Decimal | null; volume: bigint | null }[]>`
        SELECT DISTINCT ON (stock_id) stock_id, price, volume
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
        volume: r.volume != null ? Number(r.volume) : 0,
        change: null,
        capturedAt: new Date().toISOString(),
      });
    }
    return map;
  }
}
