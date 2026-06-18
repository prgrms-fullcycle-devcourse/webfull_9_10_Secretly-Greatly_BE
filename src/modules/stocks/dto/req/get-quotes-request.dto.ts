import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";
import { Type } from "class-transformer";

export class GetQuotesRequestDto {
  @ApiProperty({ example: [1, 2, 3], description: "시세를 받을 종목 stockId 배열", type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  stockIds: number[];
}
