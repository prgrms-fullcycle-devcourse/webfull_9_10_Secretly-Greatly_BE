import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export class GetStockCandlesQueryDto {
  @IsOptional()
  @IsIn(["1d", "1wk", "1mo"])
  interval?: "1d" | "1wk" | "1mo" = "1d";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 250;
}
