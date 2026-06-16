import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateWatchlistRequestDto {
  @ApiProperty({ description: "등록할 주식 종목 고유 ID", example: 3 })
  @IsNotEmpty()
  @IsNumber()
  stockId: number;
}
