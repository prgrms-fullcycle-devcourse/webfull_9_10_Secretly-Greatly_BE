import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsPositive } from "class-validator";

export class CreatePositionRequestDto {
  @ApiProperty({ description: "구매한 종목 고유 ID", example: 1 })
  @IsNumber()
  stockId: number;

  @ApiProperty({ description: "매수가", example: 1000 })
  @IsNumber()
  @IsPositive()
  purchasePrice: number;

  @ApiProperty({ description: "매수 수량", example: 2 })
  @IsNumber()
  @IsPositive()
  purchaseQuantity: number;
}
