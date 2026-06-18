import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StockSimulationRequestDto } from "./dto/req/stock-simulation-request.dto";
import { StockSimulationResponseDto } from "./dto/res/stock-simulation-response.dto";
import { AssetCodeNotFoundException } from "../../common/exceptions/asset-code-not-found.exception";
import { formatOptimizerLog } from "../../common/utils/formatter.util";
import { StatusBarIndicatorDataDto } from "./dto/res/market-indicator-statusbar-response.dto";

@Injectable()
export class SimulationService {
  constructor(private readonly prisma: PrismaService) {}

  // 물타기 시뮬레이션
  async calculateAndSaveSimulation(
    userId: string,
    body: StockSimulationRequestDto,
  ): Promise<StockSimulationResponseDto> {
    const { code, currentAvgPrice, currentQuantity, purchasePrice, purchaseQuantity } = body;

    const stock = await this.prisma.stock.findFirst({
      where: { code: code },
    });
    if (!stock) {
      throw new AssetCodeNotFoundException(code);
    }
    const currentPrice = purchasePrice;

    // --- 7대 필수 자산 지표 도메인 연산 시작 ---

    // 1. 수정 총 매수 수량
    const calculatedQuantity = currentQuantity + purchaseQuantity;

    const currentTotalAmount = currentAvgPrice * currentQuantity;
    const purchaseTotalAmount = purchasePrice * purchaseQuantity;
    const totalInvestedAmount = currentTotalAmount + purchaseTotalAmount;

    // 2. 수정 평단가 - 소수점 2자리 반올림 보정
    const calculatedAvgPrice = Math.round((totalInvestedAmount / calculatedQuantity) * 100) / 100;

    // 3. 가상 평가 금액
    const calculatedEvaluationAmount = currentPrice * calculatedQuantity;

    // 4. 가상 평가 손익
    const calculatedEvaluationProfit = calculatedEvaluationAmount - totalInvestedAmount;

    // 5. 순수 소수점 수익률
    const calculatedRateOfReturn = Math.round((calculatedEvaluationProfit / totalInvestedAmount) * 10000) / 100;

    const formattedLog = formatOptimizerLog(code, calculatedAvgPrice, calculatedQuantity, calculatedRateOfReturn);

    const position = await this.prisma.position.findFirst({
      where: {
        userId: userId,
        stock: { code: code },
      },
    });

    await this.prisma.positionSimulation.create({
      data: {
        userId: userId,
        stockId: stock.id,
        positionId: position?.id ?? null,
        buyPrice: purchasePrice,
        buyQuantity: purchaseQuantity,
        currentPrice: currentPrice,
        calculatedAvgPrice: calculatedAvgPrice,
        calculatedQuantity: calculatedQuantity,
        calculatedEvaluationAmount: calculatedEvaluationAmount,
        calculatedEvaluationProfit: calculatedEvaluationProfit,
        calculatedRateOfReturn: calculatedRateOfReturn,
        formattedLog: formattedLog,
      },
    });

    return {
      code,
      currentPrice,
      calculatedAvgPrice,
      calculatedQuantity,
      calculatedEvaluationAmount,
      calculatedEvaluationProfit,
      calculatedRateOfReturn,
      formattedLog,
    };
  }

  // 5대 선행지표
  async getStatusBarIndicators(userId: string): Promise<StatusBarIndicatorDataDto> {
    const targets = [
      { code: "KOSPI", label: "KSP", id: "status.market.kospi" },
      { code: "KOSDAQ", label: "KSD", id: "status.market.kosdaq" },
      { code: "NASDAQ", label: "NAS", id: "status.market.nasdaq" },
      { code: "NASDAQ100", label: "NDX", id: "status.market.nasdaq100" },
      { code: "SP500", label: "S&P", id: "status.market.sp500" },
    ] as const;

    const components = [];

    for (const target of targets) {
      const stockWithLatestTick = await this.prisma.stock.findFirst({
        where: {
          code: target.code,
          assetType: "INDEX",
        },
        include: {
          ticks: {
            where: { userId },
            orderBy: { capturedAt: "desc" },
            take: 1,
          },
        },
      });

      const latestTick = stockWithLatestTick?.ticks?.[0];
      const valueNum = latestTick ? Number(latestTick.price) : 0;

      let changeRateNum = 0;
      if (stockWithLatestTick && latestTick) {
        const dailyBar = await this.prisma.dailyBar.findFirst({
          where: {
            stockId: stockWithLatestTick.id,
            userId,
          },
          orderBy: { tradeDate: "desc" },
        });

        // (현재가 - 시가) / 시가 * 100
        const openPrice = dailyBar ? Number(dailyBar.open) : 0;
        if (openPrice > 0) {
          changeRateNum = ((valueNum - openPrice) / openPrice) * 100;
        }
      }

      const formattedValue = valueNum.toFixed(2);

      const formattedRate = changeRateNum > 0 ? `+${changeRateNum.toFixed(2)}%` : `${changeRateNum.toFixed(2)}%`;

      components.push({
        componentId: target.id,
        label: target.label,
        value: `${formattedValue} (${formattedRate})`,
      });
    }

    const singleLineStream = components.map((c) => `${c.label} ${c.value}`).join("  |  ");

    return {
      totalComponents: components.length,
      singleLineStream,
      components,
    };
  }
}
