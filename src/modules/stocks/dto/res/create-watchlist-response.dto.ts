import { ApiProperty } from "@nestjs/swagger";

export class CreateWatchlistResponseDto {
  @ApiProperty({ description: "생성된 관심 종목 고유 ID", example: 104 })
  watchlistId: number;

  @ApiProperty({ description: "등록된 주식 종목의 실제 명칭", example: "삼성전자" })
  stockName: string;

  @ApiProperty({ description: "현재까지 유저가 누적 등록한 관심 종목 총 개수", example: 4 })
  totalRegisteredCount: number;
}
