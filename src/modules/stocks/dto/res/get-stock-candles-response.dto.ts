import { ApiProperty } from "@nestjs/swagger";
import { CandleItemDto } from "./candle-item.dto";

export class GetStockCandlesResponseDto {
  @ApiProperty({ type: [CandleItemDto] })
  candles: CandleItemDto[];
}
