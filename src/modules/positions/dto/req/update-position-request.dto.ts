import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class UpdatePositionRequestDto {
  @ApiPropertyOptional({
    example: 10,
    description: "보유 수량",
  })
  @IsOptional()
  @IsNumber()
  @Min(0.00000001)
  quantity?: number;

  @ApiPropertyOptional({
    example: 78000,
    description: "평균 매수가",
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  averagePrice?: number;
}
