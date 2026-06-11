import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export type StockSortField = "change" | "price" | "volume";
export type StockSortOrder = "asc" | "desc";
export type MarketFilter = "DOMESTIC" | "OVERSEAS" | "COIN";

export class GetStocksQueryDto {
  @IsOptional()
  @IsIn(["change", "price", "volume"], {
    message: "sort 파라미터는 'change', 'price', 'volume' 중 하나여야 합니다.",
  })
  sort?: StockSortField = "change";

  @IsOptional()
  @IsIn(["asc", "desc"], {
    message: "order 파라미터는 'asc', 'desc' 중 하나여야 합니다.",
  })
  order?: StockSortOrder = "desc";

  @IsOptional()
  @IsIn(["DOMESTIC", "OVERSEAS", "COIN"], {
    message: "market 파라미터는 'DOMESTIC', 'OVERSEAS', 'COIN' 중 하나여야 합니다.",
  })
  market?: MarketFilter;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;
}
