import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { OverseasIngestService } from "./overseasIngest.service";

@Injectable()
export class OverseasPollerService {
  private readonly logger = new Logger(OverseasPollerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingest: OverseasIngestService,
  ) {}

  /**
   * 미국 정규장 시간(현지 09:30~16:00)에 30초마다 폴링
   *
   * @Cron 의 timeZone 을 America/New_York 으로 두면 NestJS 스케줄러가
   * 서머타임(EST/EDT)을 자동 반영한다.
   *
   * 크론은 넉넉히 9~16시로 걸고, 분 단위 경계(09:30 시작/16:00 종료)는
   * isMarketOpen()에서 판정한다.
   */
  // @Cron("*/30 * * * * *") // 테스트용
  @Cron("*/30 * 9-16 * * 1-5", { timeZone: "America/New_York" })
  async pollAll() {
    this.logger.log("🔥 해외 크론 진입");
    if (!this.isMarketOpen()) {
      this.logger.log("미국 장 운영 시간이 아닙니다.");
      return;
    }

    // KIS 키를 등록한 사용자만 대상
    const users = await this.prisma.user.findMany({
      where: { kisAppKeyEnc: { not: null } },
      select: { id: true },
    });

    this.logger.log(`해외 틱 폴링 시작: 대상 ${users.length}명`);

    for (const u of users) {
      await this.ingest.ingestUserWatchlist(u.id).catch((e) => {
        this.logger.warn(`user=${u.id} 해외 폴링 실패: ${(e as Error).message}`);
      });
    }
  }

  /**
   * 미국 정규장(현지 09:30~16:00, 월~금) 여부
   * America/New_York 으로 시·분·요일을 추출하므로 서머타임이 자동 반영된다.
   */
  private isMarketOpen(): boolean {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/New_York",
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
    // TODO: 미국 증시 공휴일(Independence Day, Thanksgiving 등) 제외 로직 필요
    // TODO: 조기 폐장일(반장, 현지 13:00 마감) 대응 필요

    const afterMin = h * 60 + m;
    return afterMin >= 9 * 60 + 30 && afterMin <= 16 * 60; // 09:30 ~ 16:00
  }
}
