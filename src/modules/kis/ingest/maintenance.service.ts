// kis/ingest/maintenance.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../../common/prisma/prisma.service";

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 매일 새벽 6시(KST): 미래 파티션 미리 확보
  // @Cron("*/30 * * * * *") // 테스트용
  @Cron("0 0 6 * * *", { timeZone: "Asia/Seoul" })
  async ensurePartitions() {
    await this.prisma.$executeRawUnsafe("SELECT ensure_future_partitions()");
    this.logger.log("미래 파티션 확보 완료");
  }

  // 매분: 직전 1분 틱 → 분봉 롤업
  @Cron(CronExpression.EVERY_MINUTE)
  async rollupMinute() {
    await this.prisma.$executeRawUnsafe(
      `SELECT rollup_tick_to_minute(
         date_trunc('minute', now()) - interval '2 minute',
         date_trunc('minute', now()) - interval '1 minute')`,
    );
  }

  // 평일 장 마감 후 16시(KST): 당일 분봉 → 일봉 롤업
  @Cron("0 0 16 * * 1-5", { timeZone: "Asia/Seoul" })
  async rollupDaily() {
    await this.prisma.$executeRawUnsafe(
      `SELECT rollup_minute_to_daily(current_date::timestamptz, (current_date+1)::timestamptz)`,
    );
    this.logger.log("일봉 롤업 완료");
  }

  // 매일 새벽 6시 30분(KST): 리텐션 (틱 7일 / 분봉 1년)
  @Cron("0 30 6 * * *", { timeZone: "Asia/Seoul" })
  async retention() {
    await this.prisma.$executeRawUnsafe(`SELECT drop_old_partitions('ticks', now() - interval '7 days')`);
    await this.prisma.$executeRawUnsafe(`SELECT drop_old_partitions('minute_bars', now() - interval '1 year')`);
    this.logger.log("리텐션 정리 완료");
  }
}
