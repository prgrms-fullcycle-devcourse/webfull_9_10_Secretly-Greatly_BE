import { Injectable, Logger } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { quoteCacheKey, QUOTE_CACHE_TTL_SEC, CachedQuote } from "./quoteCache.constant";

/**
 * 시세 캐시 — Redis 저장소 전용
 */
@Injectable()
export class QuoteCacheService {
  private readonly logger = new Logger(QuoteCacheService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /** 여러 종목 최신 시세를 한 번에 기록 (pipeline) */
  async setQuotes(userId: string, quotes: { stockId: number; quote: CachedQuote }[]): Promise<void> {
    if (quotes.length === 0) return;
    const pipeline = this.redis.pipeline();
    for (const { stockId, quote } of quotes) {
      pipeline.set(quoteCacheKey(userId, stockId), JSON.stringify(quote), "EX", QUOTE_CACHE_TTL_SEC);
    }
    try {
      await pipeline.exec();
    } catch (e) {
      this.logger.warn(`시세 캐시 기록 실패 user=${userId}: ${(e as Error).message}`);
    }
  }

  /**
   * 여러 종목 최신 시세를 한 번에 조회 (mget).
   * @returns stockId → CachedQuote 맵. 캐시에 없거나(미스) 조회 실패 시 그 종목은 맵에 없다.
   *          (호출측 QuoteService 가 미스분만 DB 폴백)
   */
  async getQuotes(userId: string, stockIds: number[]): Promise<Map<number, CachedQuote>> {
    const result = new Map<number, CachedQuote>();
    if (stockIds.length === 0) return result;

    const keys = stockIds.map((id) => quoteCacheKey(userId, id));
    let values: (string | null)[];
    try {
      values = await this.redis.mget(keys);
    } catch (e) {
      this.logger.warn(`시세 캐시 조회 실패 user=${userId}: ${(e as Error).message}`);
      return result;
    }

    stockIds.forEach((stockId, i) => {
      const raw = values[i];
      if (raw) {
        try {
          result.set(stockId, JSON.parse(raw) as CachedQuote);
        } catch (e) {
          this.logger.warn(`시세 캐시 파싱 실패 user=${userId} stock=${stockId} — 미스 처리: ${(e as Error).message}`);
        }
      }
    });
    return result;
  }
}
