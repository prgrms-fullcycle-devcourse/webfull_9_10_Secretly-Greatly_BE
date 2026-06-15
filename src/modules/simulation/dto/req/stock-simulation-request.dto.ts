import { IsString, IsNumber, IsPositive } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class StockSimulationRequestDto {
  @ApiProperty({ description: "종목 코드 (위장 UI 대상)", example: "NVDA" })
  @IsString()
  code: string;

  @ApiProperty({ description: "기보유 자산 평단가", example: 100000.0 })
  @IsNumber()
  @IsPositive()
  currentAvgPrice: number;

  @ApiProperty({ description: "기보유 자산 수량", example: 1.0 })
  @IsNumber()
  @IsPositive()
  currentQuantity: number;

  @ApiProperty({ description: "가상 추가 매수 가격", example: 40000.0 })
  @IsNumber()
  @IsPositive()
  purchasePrice: number;

  @ApiProperty({ description: "가상 추가 매수 수량", example: 2.0 })
  @IsNumber()
  @IsPositive()
  purchaseQuantity: number;
}
