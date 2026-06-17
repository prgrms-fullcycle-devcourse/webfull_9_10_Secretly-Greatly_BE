// TODO: tickIngest.service.ts → domesticIngest.service.ts 파일명 변경
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { KisDomesticPriceService } from "../price/kisDomesticPrice.service";
import { KisDomesticMultiPriceItem } from "../price/dto/kisDomesticPrice.dto";
import { QuoteService, IngestedQuote } from "../../quote/quote.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class TickIngestService {
  private readonly logger = new Logger(TickIngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kisDomesticPriceService: KisDomesticPriceService,
    private readonly quoteService: QuoteService,
  ) {}

  async ingestUserWatchlist(userId: string) {
    const items = await this.prisma.withUser(userId, (tx) =>
      // 현재 watchlist는 KIS Key가 있어야 한다는 전제가 있음.
      tx.watchlist.findMany({
        where: { userId },
        include: { stock: true },
      }),
    );
    if (items.length === 0) return;

    // 종목코드 → stockId 매핑
    const codeToStockId = new Map<string, number>();
    for (const it of items) codeToStockId.set(it.stock.code, it.stockId);

    let quotes: KisDomesticMultiPriceItem[];
    try {
      quotes = await this.kisDomesticPriceService.fetchMultiPrice(
        userId,
        items.map((it) => ({ code: it.stock.code, marketDivCode: "J" })),
      );
    } catch (e) {
      this.logger.warn(`user=${userId} 시세 조회 실패: ${(e as Error).message}`);
      return;
    }

    const capturedAt = new Date();
    const skipped: { code: string; name: string }[] = [];

    // 틱 적재용 행 + 캐시용 배열을 함께 구성
    const rows: {
      userId: string;
      stockId: number;
      capturedAt: Date;
      price: Prisma.Decimal;
      priceKrw: Prisma.Decimal | null; // ← 추가
      volume: bigint;
    }[] = [];
    const cacheQuotes: IngestedQuote[] = [];

    for (const q of quotes) {
      const code = q.inter_shrn_iscd?.trim();
      if (!code) continue; // 빈 슬롯 pass

      const stockId = codeToStockId.get(q.inter_shrn_iscd); // 단축 종목코드
      if (!stockId) {
        skipped.push({ code: q.inter_shrn_iscd, name: q.inter_kor_isnm });
        continue;
      }

      const volume = BigInt(q.acml_vol || "0");
      const price = new Prisma.Decimal(q.inter2_prpr);
      rows.push({ userId, stockId, capturedAt, price, priceKrw: price, volume });
      cacheQuotes.push({
        stockId,
        price,
        priceKrw: price,
        volume,
        change: Number(q.prdy_ctrt), // 전일 대비율(등락률)
      });
    }

    if (skipped.length > 0) {
      this.logger.warn(
        `user=${userId} 스킵된 종목 ${skipped.length}건: ` + skipped.map((s) => `${s.code}(${s.name})`).join(", "),
      );
    }

    await this.prisma.withUser(userId, (tx) => tx.tick.createMany({ data: rows, skipDuplicates: true }));

    await this.quoteService.cacheIngestedQuotes(userId, cacheQuotes, capturedAt);

    this.logger.log(`user=${userId} 틱 ${rows.length}건 적재`);
  }
}
