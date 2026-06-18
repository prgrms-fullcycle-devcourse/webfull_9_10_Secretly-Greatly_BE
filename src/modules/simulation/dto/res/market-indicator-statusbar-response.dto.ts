import { ApiProperty } from "@nestjs/swagger";

export class IndicatorComponentDto {
  @ApiProperty({ example: "status.market.kospi", description: "컴포넌트 고유 식별 ID" })
  componentId: string;

  @ApiProperty({ example: "KSP", description: "위장 지표 단축 레이블" })
  label: string;

  @ApiProperty({ example: "2684.50 (-0.42)", description: "보호색 마스킹이 적용된 현재가 및 등락률" })
  value: string;
}

export class StatusBarIndicatorDataDto {
  @ApiProperty({ example: 5, description: "총 선행지표 컴포넌트 개수" })
  totalComponents: number;

  @ApiProperty({
    example:
      "KSP 2684.50 (-0.42)  |  NSQ 18450.25 (1.15)  |  USDKRW 1375.40 (0.22)  |  US10Y 4.352 (-1.05)  |  VIX 14.85 (-3.12)",
    description: "VSCode 하단 툴바용 단일 라인 문자열 스트림",
  })
  singleLineStream: string;

  @ApiProperty({ type: [IndicatorComponentDto], description: "개별 지표 상세 컴포넌트 배열" })
  components: IndicatorComponentDto[];
}

export class MarketIndicatorStatusbarResponseDto {
  @ApiProperty({ example: 200, description: "HTTP 상태 코드" })
  statusCode: number;

  @ApiProperty({ example: "2026-06-17T17:58:00.000Z", description: "서버 응답 시각" })
  timestamp: string;

  @ApiProperty({ example: "/api/indicators/statusbar", description: "요청 API 엔드포인트 패스" })
  path: string;

  @ApiProperty({ example: "VSCode 에디터 하단 상태 표시줄(Status Bar) 위장 선행지표 캐시 조회가 완료되었습니다." })
  message: string;

  @ApiProperty({ type: StatusBarIndicatorDataDto })
  data: StatusBarIndicatorDataDto;

  @ApiProperty({ example: null, nullable: true })
  error: any;
}
