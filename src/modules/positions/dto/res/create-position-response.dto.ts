import { ApiProperty } from "@nestjs/swagger";

export class CreatePositionResponseDto {
  @ApiProperty({ description: "생성된 보유 종목 ID", example: 1 })
  positionId: number;

  @ApiProperty({ description: "종목 ID", example: 3 })
  stockId: number;

  @ApiProperty({ description: "종목명", example: "삼성전자" })
  stockName: string;

  @ApiProperty({ description: "평균 매수가", example: 70000 })
  averagePrice: number;

  @ApiProperty({ description: "보유 수량", example: 2 })
  quantity: number;

  @ApiProperty({ description: "시장 구분", example: "KR", enum: ["KR", "US", "CRYPTO", "INDEX"] })
  market: string;

  @ApiProperty({ description: "총 투자 금액", example: 140000 })
  totalInvestedAmount: number;
}
