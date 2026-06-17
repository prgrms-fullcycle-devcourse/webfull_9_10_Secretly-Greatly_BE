import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AlertLevel, AlertType } from "@prisma/client";
import { ALERT_CONFIG } from "./constants";
import { StreamService } from "../stream/stream.service";

@Injectable()
export class AlertSchedulerService {
  private readonly logger = new Logger(AlertSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly streamService: StreamService,
  ) {}

  private calculateChangeRate(currentPrice: number, pastPrice: number): number {
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPriceAlerts() {
    this.logger.log("급변 알림 스케줄러 실행");

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
      },
    });

    for (const user of users) {
      await this.checkUserAlerts(user.id);
    }
  }

  private async checkUserAlerts(userId: string) {
    const [watchlists, positions] = await Promise.all([
      this.prisma.watchlist.findMany({
        where: { userId },
        select: { stockId: true },
      }),
      this.prisma.position.findMany({
        where: { userId },
        select: { stockId: true },
      }),
    ]);

    const stockIds = [...new Set([...watchlists.map((w) => w.stockId), ...positions.map((p) => p.stockId)])].slice(
      0,
      10,
    );

    this.logger.log(`[ALERT] user=${userId} stocks=${stockIds.length}`);

    for (const stockId of stockIds) {
      await this.checkStockAlert(userId, stockId);
    }
  }

  private async checkStockAlert(userId: string, stockId: number) {
    const latestBar = await this.prisma.minuteBar.findFirst({
      where: {
        userId,
        stockId,
      },
      orderBy: {
        capturedAt: "desc",
      },
    });

    if (!latestBar) {
      this.logger.log(`[ALERT] minuteBar 없음 user=${userId} stock=${stockId}`);
      return;
    }

    const stock = await this.prisma.stock.findUnique({
      where: {
        id: stockId,
      },
      select: {
        code: true,
        name: true,
      },
    });

    if (!stock) {
      return;
    }

    const currentTime = latestBar.capturedAt;

    const warnTargetTime = new Date(currentTime.getTime() - ALERT_CONFIG.WARN_WINDOW_MINUTES * 60 * 1000);

    const criticalTargetTime = new Date(currentTime.getTime() - ALERT_CONFIG.CRITICAL_WINDOW_MINUTES * 60 * 1000);

    const [warnBar, criticalBar] = await Promise.all([
      this.prisma.minuteBar.findFirst({
        where: {
          userId,
          stockId,
          capturedAt: {
            lte: warnTargetTime,
          },
        },
        orderBy: {
          capturedAt: "desc",
        },
      }),
      this.prisma.minuteBar.findFirst({
        where: {
          userId,
          stockId,
          capturedAt: {
            lte: criticalTargetTime,
          },
        },
        orderBy: {
          capturedAt: "desc",
        },
      }),
    ]);

    if (criticalBar) {
      const criticalChangeRate = this.calculateChangeRate(Number(latestBar.close), Number(criticalBar.close));

      this.logger.log(`[CRITICAL CHECK] user=${userId} stock=${stockId} rate=${criticalChangeRate.toFixed(2)}%`);

      if (Math.abs(criticalChangeRate) >= ALERT_CONFIG.CRITICAL_THRESHOLD_PERCENT) {
        await this.createAndEmitAlert({
          userId,
          stockId,
          stockCode: stock.code,
          stockName: stock.name,
          level: AlertLevel.CRITICAL,
          changeRate: criticalChangeRate,
        });

        return;
      }
    }

    if (warnBar) {
      const warnChangeRate = this.calculateChangeRate(Number(latestBar.close), Number(warnBar.close));

      this.logger.log(`[WARN CHECK] user=${userId} stock=${stockId} rate=${warnChangeRate.toFixed(2)}%`);

      if (Math.abs(warnChangeRate) >= ALERT_CONFIG.WARN_THRESHOLD_PERCENT) {
        await this.createAndEmitAlert({
          userId,
          stockId,
          stockCode: stock.code,
          stockName: stock.name,
          level: AlertLevel.WARN,
          changeRate: warnChangeRate,
        });
      }
    }
  }

  private async createAndEmitAlert(params: {
    userId: string;
    stockId: number;
    stockCode: string;
    stockName: string;
    level: AlertLevel;
    changeRate: number;
  }) {
    const { userId, stockId, stockCode, stockName, level, changeRate } = params;

    const recentAlert = await this.prisma.alertLog.findFirst({
      where: {
        userId,
        stockId,
        level,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
    });

    if (recentAlert) {
      this.logger.log(`[${level} SKIP] 최근 알림 존재 user=${userId} stock=${stockId}`);
      return;
    }

    const alertType = changeRate > 0 ? AlertType.PRICE_UP : AlertType.PRICE_DOWN;

    const message =
      changeRate > 0 ? `${stockName} +${changeRate.toFixed(2)}% 급등` : `${stockName} ${changeRate.toFixed(2)}% 급락`;

    await this.prisma.alertLog.create({
      data: {
        userId,
        stockId,
        level,
        changeRate,
        message,
        alertType,
      },
    });

    this.streamService.emitTerminalAlert({
      userId,
      stockCode,
      stockName,
      level,
      alertType,
      changeRate: Number(changeRate.toFixed(2)),
      message,
    });

    this.logger.log(`[${level} ALERT] ${stockCode} ${changeRate.toFixed(2)}%`);
  }
}
