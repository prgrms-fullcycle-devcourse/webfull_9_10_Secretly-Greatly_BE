import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StockSimulationRequestDto } from "./dto/req/stock-simulation-request.dto";
import { StockSimulationResponseDto } from "./dto/res/stock-simulation-response.dto";
import { PositionNotFoundException } from "../../common/exceptions/position-not-found.exception";
import { formatOptimizerLog } from "../../common/utils/formatter.util";

@Injectable()
export class SimulationService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateAndSaveSimulation(
    userId: string,
    body: StockSimulationRequestDto,
  ): Promise<StockSimulationResponseDto> {
    const { code, currentAvgPrice, currentQuantity, purchasePrice, purchaseQuantity } = body;

    const currentPrice = purchasePrice;

    // --- 7대 필수 자산 지표 도메인 연산 시작 ---

    // 1. 수정 총 매수 수량
    const calculatedQuantity = currentQuantity + purchaseQuantity;

    const currentTotalAmount = currentAvgPrice * currentQuantity;
    const purchaseTotalAmount = purchasePrice * purchaseQuantity;
    const totalInvestedAmount = currentTotalAmount + purchaseTotalAmount;

    // 2. 수정 평단가 - 소수점 2자리 반올림 보정
    const calculatedAvgPrice = Math.round((totalInvestedAmount / purchaseTotalAmount) * 100) / 100;

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

    if (!position) {
      throw new PositionNotFoundException(code);
    }

    await this.prisma.positionSimulation.create({
      data: {
        positionId: position.id,
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
}
