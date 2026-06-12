import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { KisDomesticPriceService } from "../price/kisDomesticPrice.service";
import { KisDomesticMultiPriceItem } from "../price/dto/kisDomesticPrice.dto";

@Injectable()
export class TickIngestService {
  private readonly logger = new Logger(TickIngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kisDomesticPriceService: KisDomesticPriceService,
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
    const rows = quotes
      .map((q) => {
        const code = q.inter_shrn_iscd?.trim();

        if (!code) {
          // 빈 슬롯은 pass
          return null;
        }

        const stockId = codeToStockId.get(q.inter_shrn_iscd); // 단축 종목코드
        if (!stockId) {
          // 매핑되지 않는 응답 로깅 및 skip
          skipped.push({ code: q.inter_shrn_iscd, name: q.inter_kor_isnm });
          return null;
        }
        return {
          userId,
          stockId,
          capturedAt,
          price: q.inter2_prpr, // 현재가
          volume: BigInt(q.acml_vol || "0"),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (skipped.length > 0) {
      this.logger.warn(
        `user=${userId} 스킵된 종목 ${skipped.length}건: ` + skipped.map((s) => `${s.code}(${s.name})`).join(", "),
      );
    }
    await this.prisma.withUser(userId, (tx) => tx.tick.createMany({ data: rows, skipDuplicates: true }));

    this.logger.log(`user=${userId} 틱 ${rows.length}건 적재`);
  }
}
