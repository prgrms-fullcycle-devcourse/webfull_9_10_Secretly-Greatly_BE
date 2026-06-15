import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../../common/prisma/prisma.service";

/**
 * 시세 파이프라인 유지보수 배치.
 *
 * [타임존 원칙]
 *  DB 세션 타임존에 의존하는 now()/current_date 를 '날것 그대로' 쓰지 않는다.
 *  거래일/파티션 경계와 관련된 모든 시각은 AT TIME ZONE 으로 기준을 명시한다.
 *   - 국장 거래일·파티션 경계: Asia/Seoul
 *   - (향후) 미장 거래일: America/New_York
 *  이렇게 해야 서버/DB 세션이 UTC 든 KST 든 결과가 흔들리지 않는다.
 *
 *  현재는 국장(KRX)만 구현. 미장 관련 코드는 주석으로 골격만 남겨둔다.
 */
@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  // 거래일/파티션 기준 타임존 (국장)
  private static readonly KST = "Asia/Seoul";

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // 매일 06:00(KST): 미래 파티션 미리 확보
  //   ensure_future_partitions() 내부가 이미 KST 경계로 파티션을 만든다.
  // ---------------------------------------------------------------------------
  //   @Cron("*/30 * * * * *") // 테스트용
  @Cron("0 0 6 * * *", { timeZone: MaintenanceService.KST })
  async ensurePartitions() {
    await this.prisma.$executeRawUnsafe("SELECT ensure_future_partitions()");
    this.logger.log("미래 파티션 확보 완료");
  }

  // ---------------------------------------------------------------------------
  // 매분: 직전 1분 틱 → 분봉 롤업
  //   분 단위 절단은 타임존과 무관하므로 now() 기반 UTC 구간으로 충분.
  //   date_trunc('minute', now()) 는 세션 TZ와 상관없이 같은 '분 경계'를 가리킨다
  // ---------------------------------------------------------------------------
  @Cron(CronExpression.EVERY_MINUTE)
  async rollupMinute() {
    await this.prisma.$executeRawUnsafe(
      `SELECT rollup_tick_to_minute(
         date_trunc('minute', now()) - interval '2 minute',
         date_trunc('minute', now()) - interval '1 minute')`,
    );
  }

  // ---------------------------------------------------------------------------
  // 평일 16:00(KST): 당일(한국 거래일) 분봉 → 일봉 롤업
  //
  //   주의: 현재 코드는 공휴일(평일 휴장)에도 실행 됨 → 분봉이 없어 빈 롤업으로 무해.
  //        정확한 휴장 제외가 필요하면 KRX 휴장일 달력으로 넘어가는 로직 추가.
  // ---------------------------------------------------------------------------
  @Cron("0 0 16 * * 1-5", { timeZone: MaintenanceService.KST })
  async rollupDailyKR() {
    await this.rollupDailyFor(MaintenanceService.KST);
    this.logger.log("국장 일봉 롤업 완료");
  }

  /**
   * 특정 거래소 타임존 기준으로 '그 타임존의 오늘 거래일' 분봉을 일봉으로 롤업.
   * 시장이 늘어나면 tz 만 바꿔 호출(미장: 'America/New_York').
   */
  private async rollupDailyFor(tz: string) {
    await this.prisma.$executeRawUnsafe(
      `SELECT rollup_minute_to_daily(
         ( (now() AT TIME ZONE $1)::date           )::timestamp AT TIME ZONE $1,
         ( (now() AT TIME ZONE $1)::date + 1        )::timestamp AT TIME ZONE $1
       )`,
      tz,
    );
  }

  // ---------------------------------------------------------------------------
  // (향후) 미장 일봉 롤업 — 현지 마감 후. 서머타임 때문에 KST 고정 시각이 변동하므로
  //   @Cron 의 timeZone 을 America/New_York 으로 두어 스케줄러가 DST 를 자동 반영.
  //   거래일 구간도 rollupDailyFor('America/New_York') 로 뉴욕 기준으로 계산됨.
  // ---------------------------------------------------------------------------
  // @Cron("0 0 16 * * 1-5", { timeZone: "America/New_York" })
  // async rollupDailyUS() {
  //   await this.rollupDailyFor("America/New_York");
  //   this.logger.log("미장 일봉 롤업 완료");
  // }

  // ---------------------------------------------------------------------------
  // 매일 06:30(KST): 리텐션 (틱 7일 / 분봉 1년)
  //
  //   참고: drop_old_partitions 는 timestamptz 경계 파싱 기준이라 일봉(date 경계)에는
  //         그대로 못 쓴다. 일봉은 장기 보관이므로 현재 리텐션 대상 아님.
  // ---------------------------------------------------------------------------
  @Cron("0 30 6 * * *", { timeZone: MaintenanceService.KST })
  async retention() {
    // 틱: 7일 지난 일 파티션
    await this.prisma.$executeRawUnsafe(
      `SELECT drop_old_partitions(
         'ticks',
         ((now() AT TIME ZONE 'Asia/Seoul')::date - 7)::timestamp AT TIME ZONE 'Asia/Seoul'
       )`,
    );
    // 분봉: 1년 지난 월 파티션 (컷오프를 KST 기준 월초로 정렬)
    await this.prisma.$executeRawUnsafe(
      `SELECT drop_old_partitions(
         'minute_bars',
         (date_trunc('month', (now() AT TIME ZONE 'Asia/Seoul')::date) - interval '1 year')
           ::date::timestamp AT TIME ZONE 'Asia/Seoul'
       )`,
    );
    this.logger.log("리텐션 정리 완료");
  }
}
