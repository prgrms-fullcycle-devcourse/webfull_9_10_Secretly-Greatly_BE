import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export type CandleInterval = "1m" | "1d" | "1wk" | "1mo";

export class GetStockCandlesQueryDto {
  @IsOptional()
  @IsIn(["1m", "1d", "1wk", "1mo"])
  interval?: CandleInterval = "1m";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 250;
}
