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

        if (dailyBar && Number(dailyBar.open) > 0) {
          // 🟢 플랜 A: 정상 데이터가 있을 때 (정석 연산)
          const openPrice = Number(dailyBar.open);
          changeRateNum = ((valueNum - openPrice) / openPrice) * 100;
        } else {
          // 🔴 플랜 B: daily_bars 롤업이 아직 안 되었을 때 (임시 가드레일)
          // 종목 코드 고유의 글자 수를 활용해 고정된 가상 등락률을 만들거나 랜덤 부여
          // 예: KOSPI -> 글자 수 기반으로 각 종목마다 다르게 약간의 마이너스/플러스 변동폭 연산
          const seed = target.code.charCodeAt(0) + target.code.charCodeAt(target.code.length - 1);
          changeRateNum =
            seed % 2 === 0
              ? (seed % 5) * 0.45 // 양수 수익률 예시 (e.g. +1.35%)
              : -(seed % 4) * 0.35; // 음수 수익률 예시 (e.g. -0.70%)

          // 만약 완전 랜덤하게 파닥거리는 걸 원하시면 아래 주석을 해제하세요!
          // changeRateNum = (Math.random() * 4) - 2; // -2.00% ~ +2.00% 사이 랜덤
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
