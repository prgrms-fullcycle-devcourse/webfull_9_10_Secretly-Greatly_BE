import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { KisDomesticPriceService } from "../price/kisDomesticPrice.service";
import { KisDomesticMultiPriceItem } from "../price/dto/kisDomesticPrice.dto";
import { QuoteService, IngestedQuote } from "../../quote/quote.service";
import { Prisma, Exchange, Stock } from "@prisma/client";

// 국장(domestic) 수집 대상 거래소
const DOMESTIC_EXCHANGES = [Exchange.KRX];

@Injectable()
export class TickIngestService {
  private readonly logger = new Logger(TickIngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kisDomesticPriceService: KisDomesticPriceService,
    private readonly quoteService: QuoteService,
  ) {}

  async ingestUserWatchlist(userId: string) {
    // watchlist + position 의 종목을 합쳐서(중복 제거) 수집
    const [watchItems, positionItems] = await this.prisma.withUser(userId, (tx) =>
      Promise.all([
        tx.watchlist.findMany({
          where: { userId, stock: { exchange: { in: DOMESTIC_EXCHANGES } } },
          include: { stock: true },
        }),
        tx.position.findMany({
          where: { userId, stock: { exchange: { in: DOMESTIC_EXCHANGES } } },
          include: { stock: true },
        }),
      ]),
    );

    // stockId 기준으로 종목 중복 제거 (watchlist ∪ position)
    const stockById = new Map<number, Stock>();
    for (const it of watchItems) stockById.set(it.stockId, it.stock);
    for (const it of positionItems) stockById.set(it.stockId, it.stock);

    if (stockById.size === 0) return;

    const stocks = [...stockById.values()];

    // 종목코드 → stockId 매핑
    const codeToStockId = new Map<string, number>();
    for (const s of stocks) codeToStockId.set(s.code, s.id);

    let quotes: KisDomesticMultiPriceItem[];
    try {
      quotes = await this.kisDomesticPriceService.fetchMultiPrice(
        userId,
        stocks.map((s) => ({ code: s.code, marketDivCode: "J" })),
      );
    } catch (e) {
      this.logger.warn(`user=${userId} 시세 조회 실패: ${(e as Error).message}`);
      return;
    }

    const capturedAt = new Date();
    const skipped: { code: string; name: string }[] = [];

    const rows: {
      userId: string;
      stockId: number;
      capturedAt: Date;
      price: Prisma.Decimal;
      priceKrw: Prisma.Decimal | null;
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

    this.logger.log(`user=${userId} 국내 틱 ${rows.length}건 적재`);
  }
}
