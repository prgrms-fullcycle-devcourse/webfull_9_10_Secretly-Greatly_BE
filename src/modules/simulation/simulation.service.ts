import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StockSimulationRequestDto } from "./dto/req/stock-simulation-request.dto";
import { StockSimulationResponseDto } from "./dto/res/stock-simulation-response.dto";
import { AssetCodeNotFoundException } from "../../common/exceptions/asset-code-not-found.exception";
import { formatOptimizerLog } from "../../common/utils/formatter.util";
import { StatusBarIndicatorDataDto } from "./dto/res/market-indicator-statusbar-response.dto";
import { IndicatorType } from "@prisma/client";

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
  async getStatusBarIndicators(): Promise<StatusBarIndicatorDataDto> {
    const targets = [
      { key: IndicatorType.KOSPI, label: "KSP", id: "status.market.kospi" },
      { key: IndicatorType.NASDAQ_FUTURE, label: "NSQ", id: "status.market.nasdaq" },
      { key: IndicatorType.USD_KRW, label: "USDKRW", id: "status.market.exchange" },
      { key: IndicatorType.US_10Y_BOND, label: "US10Y", id: "status.market.bond10y" },
      { key: IndicatorType.VIX_INDEX, label: "VIX", id: "status.market.vix" },
    ] as const;

    const components = [];

    for (const target of targets) {
      const latestIndicator = await this.prisma.marketIndicator.findFirst({
        where: {
          indicatorType: target.key,
        },
        orderBy: {
          recordedAt: "desc",
        },
      });

      console.log(`📡 [지표 디버깅] ${target.key} 추출 결과 ->`, latestIndicator);

      const valueNum = latestIndicator ? Number(latestIndicator.value) : 0;
      const changeRateNum = latestIndicator && latestIndicator.changeRate ? latestIndicator.changeRate.toNumber() : 0;

      const decimalPlace = target.key === "US_10Y_BOND" ? 3 : 2;
      const formattedValue = valueNum.toFixed(decimalPlace);

      const formattedRate = changeRateNum >= 0 ? `${changeRateNum.toFixed(2)}` : `${changeRateNum.toFixed(2)}`;

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
