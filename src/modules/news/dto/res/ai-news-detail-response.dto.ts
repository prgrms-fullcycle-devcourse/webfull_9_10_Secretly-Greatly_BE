import { ApiProperty } from "@nestjs/swagger";

export class AiNewsDetailResponseDto {
  @ApiProperty({ description: "AI 분석 뉴스 고유 ID 패킷", example: 8509 })
  newsId: number;

  @ApiProperty({ description: "연동된 주식 종목 티커 (없을 경우 null)", example: "NVDA", nullable: true })
  ticker: string | null;

  @ApiProperty({
    description: "암호화 링크 구문 클릭 시 출력될 기사 위장 타이틀",
    example: "대규모 인프라 수주 계약 공식 가시화",
  })
  title: string;

  @ApiProperty({
    description: "OpenAI 파이프라인이 정제한 핵심 3줄 요약 리포트 데이터 풀",
    example: [
      "글로벌 빅테크 기업과의 3조원 규모 인프라 공급 체결.",
      "2분기 연속 어닝 서프라이즈 가시성 확보.",
      "생산 병목 해결로 하반기 성장 탄력.",
    ],
  })
  aiSummaryPoints: string[];

  @ApiProperty({
    description: "언론사 원문 아웃바운드 링크 URL",
    example: "https://www.bloomberg.com/news/articles/2026-06-04/nvidia-datacenter",
  })
  originalUrl: string;

  @ApiProperty({ description: "뉴스 패킷 생성 시간", example: "2026-06-15T16:40:15.000Z" })
  createdAt: Date;
}
