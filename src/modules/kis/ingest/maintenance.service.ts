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
 *   - 미장 거래일: America/New_York
 *  이렇게 해야 서버/DB 세션이 UTC 든 KST 든 결과가 흔들리지 않는다.
 *
 * [시장 격리]
 *  일봉 롤업은 거래소 타임존(p_timezone)으로 종목을 필터한다. 국장 롤업이
 *  미장 종목을, 미장 롤업이 국장 종목을 건드리지 않도록.
 *  rollup_minute_to_daily 는 (from, to, timezone) 3-인자 버전이어야 한다.
 *  (DB 마이그레이션에서 WHERE s.exchange_timezone = p_timezone 추가 필요)
 */
@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  // 거래일/파티션 기준 타임존
  private static readonly KST = "Asia/Seoul";
  private static readonly EST = "America/New_York";

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
  //   date_trunc('minute', now()) 는 세션 TZ와 상관없이 같은 '분 경계'를 가리킨다.
  //   국장/미장 틱 모두 한 함수로 처리됨(분봉은 거래소 무관).
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
  // [국장] 평일 16:00(KST): 당일(한국 거래일) 분봉 → 일봉 롤업
  //   주의: 공휴일(평일 휴장)에도 실행됨 → 분봉이 없어 빈 롤업으로 무해.
  //        정확한 휴장 제외가 필요하면 KRX 휴장일 달력 추가.
  // ---------------------------------------------------------------------------
  @Cron("0 0 16 * * 1-5", { timeZone: MaintenanceService.KST })
  async rollupDailyKR() {
    await this.rollupDailyFor(MaintenanceService.KST);
    this.logger.log("국장 일봉 롤업 완료");
  }

  // ---------------------------------------------------------------------------
  // [미장] 평일 16:15(America/New_York): 당일(뉴욕 거래일) 분봉 → 일봉 롤업
  //   - timeZone 을 America/New_York 으로 두어 스케줄러가 서머타임(EST/EDT) 자동 반영
  //   - 정규장 마감(16:00) 직후가 아니라 15분 버퍼를 둠
  //     (분봉 롤업이 1분 지연으로 돌아 마지막 분봉이 늦게 생기므로)
  //   주의: 미국 증시 공휴일/조기폐장(13:00)은 아직 미반영 → 휴장일 달력 후속 작업
  // ---------------------------------------------------------------------------
  @Cron("0 15 16 * * 1-5", { timeZone: MaintenanceService.EST })
  async rollupDailyUS() {
    await this.rollupDailyFor(MaintenanceService.EST);
    this.logger.log("미장 일봉 롤업 완료");
  }

  /**
   * 특정 거래소 타임존 기준으로 '그 타임존의 오늘 거래일' 분봉을 일봉으로 롤업.
   * 세 번째 인자(tz)가 거래소 필터로도 쓰여, 해당 시장 종목만 집계된다.
   */
  private async rollupDailyFor(tz: string) {
    await this.prisma.$executeRawUnsafe(
      `SELECT rollup_minute_to_daily(
         ( (now() AT TIME ZONE $1)::date     )::timestamp AT TIME ZONE $1,
         ( (now() AT TIME ZONE $1)::date + 1 )::timestamp AT TIME ZONE $1,
         $1
       )`,
      tz,
    );
  }

  // ---------------------------------------------------------------------------
  // 매일 06:30(KST): 리텐션 (틱 7일 / 분봉 1년)
  //
  //   리텐션은 파티션 경계(KST 통일) 기준이라 시장 구분이 필요 없다.
  //   틱·분봉 파티션은 모든 종목이 KST 경계로 한 테이블에 잘려 있어,
  //   국장/미장 따로 돌릴 것 없이 테이블별 cutoff 하나로 처리.
  //
  //   참고: drop_old_partitions 는 timestamptz 경계 파싱 기준이라 일봉(date 경계)에는
  //         그대로 쓸 수 없다. 일봉은 장기 보관이므로 현재 리텐션 대상이 아님.
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
