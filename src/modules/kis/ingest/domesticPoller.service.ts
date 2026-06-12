// tick-poller.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { TickIngestService } from "./tickIngest.service";

@Injectable()
export class DomesticPollerService {
  private readonly logger = new Logger(DomesticPollerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingest: TickIngestService,
  ) {}

  // 장중(평일 09~15시) 30초마다 폴링
  // @Cron("*/30 * * * * *") // 테스트용
  @Cron("*/30 * 9-15 * * 1-5", { timeZone: "Asia/Seoul" })
  async pollAll() {
    this.logger.log("🔥 크론 진입");
    if (!this.isMarketOpen()) return;

    // KIS 키를 등록한 사용자만 대상
    const users = await this.prisma.user.findMany({
      where: { kisAppKeyEnc: { not: null } },
      select: { id: true },
    });

    this.logger.log(`틱 폴링 시작: 대상 ${users.length}명`);

    for (const u of users) {
      // 사용자별 순차
      // TODO: 동시성 올리려면 향후 p-limit 등으로 제한된 병렬화 필요
      await this.ingest.ingestUserWatchlist(u.id).catch((e) => {
        this.logger.warn(`user=${u.id} 폴링 실패: ${(e as Error).message}`);
      });
    }
  }

  private isMarketOpen(): boolean {
    const now = new Date();
    const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const h = kst.getHours();
    const m = kst.getMinutes();
    const afterOpen = h > 9 || (h === 9 && m >= 0);
    const beforeClose = h < 15 || (h === 15 && m <= 30); // 15:30 마감
    return afterOpen && beforeClose;
  }
}
