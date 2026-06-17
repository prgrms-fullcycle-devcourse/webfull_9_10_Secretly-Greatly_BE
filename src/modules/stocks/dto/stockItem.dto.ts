import { ApiProperty } from "@nestjs/swagger";

export class StockItemDto {
  @ApiProperty({ example: 31, description: "종목 ID" })
  stockId: number;

  @ApiProperty({ example: "AAPL", description: "종목 코드" })
  code: string;

  @ApiProperty({ example: "애플", description: "종목명" })
  name: string;

  @ApiProperty({ example: 195.2, description: "현재가 (현지 통화 — 국장 원화, 미장 달러)" })
  price: number;

  @ApiProperty({
    example: 253760,
    nullable: true,
    description: "원화 환산가 (미장은 KIS t_xprc, 국장은 price와 동일). 환산값 없으면 null",
  })
  priceKrw: number | null;

  @ApiProperty({ example: 1.25, description: "등락률 % (기호/화살표 없는 순수 실수)" })
  change: number;

  @ApiProperty({ example: 4219500, description: "거래량" })
  volume: number;

  @ApiProperty({ example: "OVERSEAS", description: "DOMESTIC/OVERSEAS/COIN" })
  market: string;
}

export class StockListDataDto {
  @ApiProperty({ example: "change", description: "정렬 기준" })
  sortedBy: string;

  @ApiProperty({ example: 50, description: "조회된 종목 수" })
  totalCount: number;

  @ApiProperty({ type: [StockItemDto] })
  items: StockItemDto[];
}
