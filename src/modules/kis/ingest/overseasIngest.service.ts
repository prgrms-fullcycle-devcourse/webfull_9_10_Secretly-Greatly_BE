import { Injectable, Logger } from "@nestjs/common";
import { Prisma, Exchange } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { KisOverseasPriceService, OverseasSymbolInput } from "../price/kisOverseasPrice.service";
import { KisOverseasMultiPriceItem } from "../price/dto/kisOverseasPrice.dto";
import { EXCHANGE_TO_EXCD } from "../price/kisPrice.constant";

// 현재 미장 정규장 거래소만 수집 대상
const OVERSEAS_EXCHANGES = [Exchange.NASDAQ, Exchange.NYSE];

@Injectable()
export class OverseasIngestService {
  private readonly logger = new Logger(OverseasIngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kisOverseasPriceService: KisOverseasPriceService,
  ) {}

  async ingestUserWatchlist(userId: string) {
    const items = await this.prisma.withUser(userId, (tx) =>
      tx.watchlist.findMany({
        where: { userId, stock: { exchange: { in: OVERSEAS_EXCHANGES } } },
        include: { stock: true },
      }),
    );
    if (items.length === 0) {
      this.logger.log(`user=${userId} 해외 종목 없음.`);
      return;
    }

    // excd(거래소 코드):code(종목 코드) key 생성 및 매핑 - 해외 종목 코드의 중복 가능성을 대비
    const excdSymbToStockId = new Map<string, number>();
    for (const it of items) {
      const excd = EXCHANGE_TO_EXCD[it.stock.exchange];
      if (!excd) continue; // 매핑 없는 거래소는 제외
      excdSymbToStockId.set(`${excd}:${it.stock.code}`, it.stockId);
    }

    const symbols: OverseasSymbolInput[] = items.map((it) => ({
      code: it.stock.code,
      exchange: it.stock.exchange,
    }));

    const quotes: KisOverseasMultiPriceItem[] = await this.kisOverseasPriceService.fetchMultiPrice(userId, symbols);

    const capturedAt = new Date();
    const skipped: { code: string; name: string }[] = [];
    const rows = quotes
      .map((q) => {
        const code = q.symb?.trim();
        if (!code) return null; // 빈 슬롯 pass

        const stockId = excdSymbToStockId.get(`${q.excd}:${code}`);
        if (!stockId) {
          skipped.push({ code, name: q.knam });
          return null;
        }
        return {
          userId,
          stockId,
          capturedAt,
          price: new Prisma.Decimal(q.last), // 현재가
          volume: BigInt(q.tvol || "0"), // 거래량
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (skipped.length > 0) {
      this.logger.warn(
        `user=${userId} 스킵된 해외 종목 ${skipped.length}건: ` + skipped.map((s) => `${s.code}(${s.name})`).join(", "),
      );
    }

    await this.prisma.withUser(userId, (tx) => tx.tick.createMany({ data: rows, skipDuplicates: true }));

    this.logger.log(`user=${userId} 해외 틱 ${rows.length}건 적재`);
  }
}
