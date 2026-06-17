import { Injectable, Logger } from "@nestjs/common";
// import { Cron, CronExpression } from "@nestjs/schedule";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { IndexIngestService } from "./indexIngest.service";

/**
 * 지수·환율 폴러 — 1분 간격
 */
@Injectable()
export class IndexPollerService {
  private readonly logger = new Logger(IndexPollerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly indexIngest: IndexIngestService,
  ) {}

  // @Cron("*/30 * * * * *") // 테스트용 30초
  @Cron("15 * * * * *")
  async pollAll() {
    // KIS 키를 가진 유저만 대상
    const users = await this.prisma.user.findMany({
      where: { kisAppKeyEnc: { not: null }, kisAppSecretEnc: { not: null } },
      select: { id: true },
    });
    if (users.length === 0) return;

    for (const u of users) {
      try {
        await this.indexIngest.ingestForUser(u.id);
      } catch (e) {
        this.logger.warn(`지표 폴링 실패 user=${u.id}: ${(e as Error).message}`);
      }
    }
  }
}
