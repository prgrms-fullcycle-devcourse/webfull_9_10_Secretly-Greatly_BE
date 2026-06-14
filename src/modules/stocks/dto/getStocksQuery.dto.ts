import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export type StockSortField = "change" | "price" | "volume";
export type StockSortOrder = "asc" | "desc";
export type MarketFilter = "DOMESTIC" | "OVERSEAS" | "COIN";

export class GetStocksQueryDto {
  @ApiPropertyOptional({ enum: ["change", "price", "volume"], default: "change", description: "정렬 기준" })
  @IsOptional()
  @IsIn(["change", "price", "volume"], {
    message: "sort 파라미터는 'change', 'price', 'volume' 중 하나여야 합니다.",
  })
  sort?: StockSortField = "change";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc", description: "정렬 방향" })
  @IsOptional()
  @IsIn(["asc", "desc"], {
    message: "order 파라미터는 'asc', 'desc' 중 하나여야 합니다.",
  })
  order?: StockSortOrder = "desc";

  @ApiPropertyOptional({ enum: ["DOMESTIC", "OVERSEAS", "COIN"], description: "시장 필터 (미지정 시 전체)" })
  @IsOptional()
  @IsIn(["DOMESTIC", "OVERSEAS", "COIN"], {
    message: "market 파라미터는 'DOMESTIC', 'OVERSEAS', 'COIN' 중 하나여야 합니다.",
  })
  market?: MarketFilter;

  @ApiPropertyOptional({ type: String, maxLength: 50, description: "종목명 또는 코드 부분 검색" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;
}
