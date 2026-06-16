import { ApiProperty } from "@nestjs/swagger";

export type NewsTagType = "MACRO" | "EARNINGS" | "INDUSTRY" | "REGULATION" | "ISSUE";

export class AiNewsItemDto {
  @ApiProperty({ description: "AI 분석 뉴스 고유 ID 패킷", example: 8509 })
  newsId: number;

  @ApiProperty({
    description: "5대 뉴스 주제 분류 태그",
    example: "EARNINGS",
    enum: ["MACRO", "EARNINGS", "INDUSTRY", "REGULATION", "ISSUE"],
  })
  tag: NewsTagType;

  @ApiProperty({ description: "출처 언론사 명칭", example: "연합인포맥스" })
  publisher: string;

  @ApiProperty({ description: "연동된 주식 종목 티커 (없을 경우 null)", example: "NVDA", nullable: true })
  ticker: string | null;

  @ApiProperty({
    description: "연동 종목의 실시간 현재가 (없을 경우 null, % 기호 필터링 버전)",
    example: 920.11,
    nullable: true,
  })
  tickerPrice: number | null;

  @ApiProperty({
    description: "OpenAI가 요약한 핵심 한 줄 요약 로그",
    example: "엔비디아 1분기 빅테크 인프라 대규모 추가 수주 계약 공식 발표 완료",
  })
  aiOneLineSummary: string;

  @ApiProperty({
    description: "에디터 화면에 소스 코드 주석 형태로 렌더링될 위장 코멘트",
    example: "// AI_SUMMARY: [NVDA] 글로벌 데이터센터 추가 수주 계약 공식 발표 완료 [Link: /src/utils/source_auth]",
  })
  formattedComment: string;

  @ApiProperty({
    description: "FE 단에서 [차트 보기] 버튼 활성화 여부를 동적 제어하기 위한 가이드 플래그",
    example: true,
  })
  hasStockChart: boolean;

  @ApiProperty({ description: "뉴스 패킷 생성 시간", example: "2026-06-15T15:40:15.000Z" })
  createdAt: Date;
}

export class AiNewsTimelineResponseDto {
  @ApiProperty({ description: "당일 유효한 AI 뉴스 총 개수 (자정 리셋 스냅샷)", example: 2 })
  totalCount: number;

  @ApiProperty({ description: "AI 분석 뉴스 타임라인 리스트 배열", type: [AiNewsItemDto] })
  items: AiNewsItemDto[];
}
