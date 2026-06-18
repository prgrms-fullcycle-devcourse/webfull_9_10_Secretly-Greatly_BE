import { ApiProperty } from "@nestjs/swagger";

export class ChangeRateDto {
  @ApiProperty({ example: -1.53, description: "전일 종가 대비 등락률(%)", nullable: true })
  daily: number | null;

  @ApiProperty({ example: 0.2, description: "15분 전 대비 등락률(%). 데이터 없으면 null", nullable: true })
  m15: number | null;

  @ApiProperty({ example: -0.45, description: "30분 전 대비 등락률(%). 데이터 없으면 null", nullable: true })
  m30: number | null;
}

export class QuoteItemDto {
  @ApiProperty({ example: 1, description: "종목 ID" })
  stockId: number;

  @ApiProperty({ example: 390.33, description: "현재가 (native — 미장 USD / 국장 KRW)", nullable: true })
  price: number | null;

  @ApiProperty({
    example: 527000,
    description: "원화 환산가(t_xprc). native가 KRW면 price와 동일, 없으면 null",
    nullable: true,
  })
  priceKrw: number | null;

  @ApiProperty({ example: 21520000, description: "당일 누적 거래량", nullable: true })
  volume: number | null;

  @ApiProperty({ type: ChangeRateDto, description: "등락률(%) — daily/m15/m30" })
  changeRate: ChangeRateDto;
}

export class GetQuotesResponseDto {
  @ApiProperty({ type: [QuoteItemDto] })
  quotes: QuoteItemDto[];
}
