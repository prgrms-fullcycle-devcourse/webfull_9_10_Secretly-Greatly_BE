import { ApiProperty } from "@nestjs/swagger";

export class StockSimulationResponseDto {
  @ApiProperty({ description: "종목 코드", example: "NVDA" })
  code: string;

  @ApiProperty({ description: "가상 현재가 (추매가와 동기화)", example: 45000.0 })
  currentPrice: number;

  @ApiProperty({ description: "7대 지표: 보정된 가상 수정 평단가", example: 60000.0 })
  calculatedAvgPrice: number;

  @ApiProperty({ description: "7대 지표: 보정된 총 보유 수량", example: 3.0 })
  calculatedQuantity: number;

  @ApiProperty({ description: "7대 지표: 보정된 총 가상 평가금액", example: 135000.0 })
  calculatedEvaluationAmount: number;

  @ApiProperty({ description: "7대 지표: 보정된 가상 평가손익", example: -45000.0 })
  calculatedEvaluationProfit: number;

  @ApiProperty({ description: "7대 지표: % 기호가 제거된 순수 소수점 수익률", example: -25.0 })
  calculatedRateOfReturn: number;

  @ApiProperty({
    description: "위장 UI 에디터용 터미널 최적화 로그 문자열",
    example:
      "[Optimizer Info] Asset 'NVDA' thread tuned. Expected AvgPrice: 60,000, Total Qty: 3.0, ReturnRatio: -25.00. Break-even threshold optimized.",
  })
  formattedLog: string;
}
