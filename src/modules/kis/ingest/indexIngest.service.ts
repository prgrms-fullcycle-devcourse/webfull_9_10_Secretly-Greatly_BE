import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { KisIndexPriceService } from "../price/kisIndexPrice.service";
import { QuoteService, IngestedQuote } from "../../quote/quote.service";
import { TRACKED_INDICES } from "../price/kisIndexPrice.constant";

@Injectable()
export class IndexIngestService {
  private readonly logger = new Logger(IndexIngestService.name);

  // 지표 code -> stock_id 캐시 (앱 메모리). 지표는 6개 고정이라 한 번만 조회.
  private codeToStockId: Map<string, number> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly indexPrice: KisIndexPriceService,
    private readonly quoteService: QuoteService,
  ) {}

  /** 지표 code -> stock_id 매핑 로드 */
  private async getCodeMap(): Promise<Map<string, number>> {
    if (this.codeToStockId) return this.codeToStockId;
    const codes = TRACKED_INDICES.map((d) => d.code);
    const stocks = await this.prisma.stock.findMany({
      where: { assetType: "INDEX", code: { in: codes } },
      select: { id: true, code: true },
    });
    const map = new Map<string, number>();
    for (const s of stocks) map.set(s.code, s.id);
    // 누락된 지표 코드 경고 (시드 안 된 경우)
    for (const d of TRACKED_INDICES) {
      if (!map.has(d.code)) this.logger.warn(`지표 종목 미등록(asset_type=INDEX): ${d.code} — stocks 시드 확인 필요`);
    }
    this.codeToStockId = map;
    return map;
  }

  async ingestForUser(userId: string) {
    const quotes = await this.indexPrice.fetchAll(userId);
    if (quotes.length === 0) {
      this.logger.warn(`user=${userId} 지표 수집 결과 없음`);
      return;
    }

    const codeMap = await this.getCodeMap();
    const capturedAt = quotes[0].capturedAt;

    // ticks 적재용 + 캐시용을 함께 구성 (지표 code -> stock_id)
    const rows: { userId: string; stockId: number; capturedAt: Date; price: Prisma.Decimal; volume: bigint }[] = [];
    const cacheQuotes: IngestedQuote[] = [];

    for (const q of quotes) {
      const stockId = codeMap.get(q.code);
      if (!stockId) continue;

      const price = new Prisma.Decimal(q.value); // 지수값/환율을 price 컬럼에
      rows.push({ userId, stockId, capturedAt, price, volume: BigInt(0) }); // 지표는 volume 0
      cacheQuotes.push({
        stockId,
        price,
        volume: BigInt(0),
        change: q.change,
      });
    }

    if (rows.length === 0) return;

    // 종목과 동일한 ticks 테이블에 적재
    await this.prisma.withUser(userId, (tx) => tx.tick.createMany({ data: rows, skipDuplicates: true }));

    // 기존 quote 캐시 재사용 (현재값 조회용)
    await this.quoteService.cacheIngestedQuotes(userId, cacheQuotes, capturedAt);

    this.logger.log(`user=${userId} 지표 ${rows.length}건 적재`);
  }
}
