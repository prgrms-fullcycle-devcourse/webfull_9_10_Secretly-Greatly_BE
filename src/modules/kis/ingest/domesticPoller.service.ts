// tick-poller.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { DomesticIngestService } from "./domesticIngest.service";

@Injectable()
export class DomesticPollerService {
  private readonly logger = new Logger(DomesticPollerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingest: DomesticIngestService,
  ) {}

  // 장중(평일 09~15시) 30초마다 폴링
  // @Cron("*/30 * * * * *") // 테스트용
  @Cron("*/30 * 9-15 * * 1-5", { timeZone: "Asia/Seoul" })
  async pollAll() {
    this.logger.log("🔥 크론 진입");
    if (!this.isMarketOpen()) {
      this.logger.log("장 운영 시간이 아닙니다.");
      return;
    }

    // KIS 키를 등록한 사용자만 대상
    const users = await this.prisma.user.findMany({
      where: { kisAppKeyEnc: { not: null } },
      select: { id: true },
    });

    this.logger.log(`국내 틱 폴링 시작: 대상 ${users.length}명`);

    for (const u of users) {
      // 사용자별 순차
      // TODO: 동시성 올리려면 향후 p-limit 등으로 제한된 병렬화 필요
      await this.ingest.ingestUserWatchlist(u.id).catch((e) => {
        this.logger.warn(`user=${u.id} 폴링 실패: ${(e as Error).message}`);
      });
    }
  }

  private isMarketOpen(): boolean {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hour12: false,
    }).formatToParts(new Date());

    const get = (t: string) => parts.find((p) => p.type === t)!.value;
    const h = Number(get("hour")) % 24; // "24"를 0으로 정규화
    const m = Number(get("minute"));
    const wd = get("weekday"); // "Mon" ~ "Sun"

    if (wd === "Sat" || wd === "Sun") return false; // 주말 제외
    // TODO: 공휴일 제외 로직 필요

    const afterMin = h * 60 + m;
    return afterMin >= 9 * 60 && afterMin <= 15 * 60 + 30; // 09:00 ~ 15:30
  }
}
