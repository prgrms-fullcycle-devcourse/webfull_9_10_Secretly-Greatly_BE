import { Injectable, Logger } from "@nestjs/common";
import { Prisma, Exchange, Stock } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { KisOverseasPriceService, OverseasSymbolInput } from "../price/kisOverseasPrice.service";
import { KisOverseasMultiPriceItem } from "../price/dto/kisOverseasPrice.dto";
import { EXCHANGE_TO_EXCD } from "../price/kisPrice.constant";
import { QuoteService, IngestedQuote } from "../../quote/quote.service";

// 현재 미장 정규장 거래소만 수집 대상
const OVERSEAS_EXCHANGES = [Exchange.NASDAQ, Exchange.NYSE];

@Injectable()
export class OverseasIngestService {
  private readonly logger = new Logger(OverseasIngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kisOverseasPriceService: KisOverseasPriceService,
    private readonly quoteService: QuoteService,
  ) {}

  async ingestUserWatchlist(userId: string) {
    // watchlist + position 의 종목을 합쳐서(중복 제거) 수집
    const [watchItems, positionItems] = await this.prisma.withUser(userId, (tx) =>
      Promise.all([
        tx.watchlist.findMany({
          where: { userId, stock: { exchange: { in: OVERSEAS_EXCHANGES } } },
          include: { stock: true },
        }),
        tx.position.findMany({
          where: { userId, stock: { exchange: { in: OVERSEAS_EXCHANGES } } },
          include: { stock: true },
        }),
      ]),
    );

    // stockId 기준으로 종목 중복 제거 (watchlist ∪ position)
    const stockById = new Map<number, Stock>();
    for (const it of watchItems) stockById.set(it.stockId, it.stock);
    for (const it of positionItems) stockById.set(it.stockId, it.stock);

    if (stockById.size === 0) {
      this.logger.log(`user=${userId} 해외 종목 없음.`);
      return;
    }

    const stocks = [...stockById.values()];

    // excd(거래소 코드):code(종목 코드) key 생성 및 매핑 - 해외 종목 코드의 중복 가능성 대비
    const excdSymbToStockId = new Map<string, number>();
    for (const s of stocks) {
      const excd = EXCHANGE_TO_EXCD[s.exchange];
      if (!excd) continue; // 매핑 없는 거래소는 제외
      excdSymbToStockId.set(`${excd}:${s.code}`, s.id);
    }

    const symbols: OverseasSymbolInput[] = stocks.map((s) => ({
      code: s.code,
      exchange: s.exchange,
    }));

    const quotes: KisOverseasMultiPriceItem[] = await this.kisOverseasPriceService.fetchMultiPrice(userId, symbols);

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
      const code = q.symb?.trim();
      if (!code) continue; // 빈 슬롯 pass

      const stockId = excdSymbToStockId.get(`${q.excd}:${code}`);
      if (!stockId) {
        skipped.push({ code, name: q.knam });
        continue;
      }

      const price = new Prisma.Decimal(q.last); // 현재가(달러)
      const priceKrw = q.t_xprc && Number(q.t_xprc) > 0 ? new Prisma.Decimal(q.t_xprc) : null; // 원화환산가
      const volume = BigInt(q.tvol || "0");

      rows.push({ userId, stockId, capturedAt, price, priceKrw, volume });
      cacheQuotes.push({
        stockId,
        price, // 현재가(달러)
        priceKrw, // 원화환산가
        volume,
        change: Number(q.rate), // 등락율
      });
    }

    if (skipped.length > 0) {
      this.logger.warn(
        `user=${userId} 스킵된 해외 종목 ${skipped.length}건: ` + skipped.map((s) => `${s.code}(${s.name})`).join(", "),
      );
    }

    await this.prisma.withUser(userId, (tx) => tx.tick.createMany({ data: rows, skipDuplicates: true }));

    await this.quoteService.cacheIngestedQuotes(userId, cacheQuotes, capturedAt);

    this.logger.log(`user=${userId} 해외 틱 ${rows.length}건 적재`);
  }
}
