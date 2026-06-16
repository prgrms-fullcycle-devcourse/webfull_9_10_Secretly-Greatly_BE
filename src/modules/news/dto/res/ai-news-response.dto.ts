import { ApiProperty } from "@nestjs/swagger";

export class AiNewsResponseDto {
  @ApiProperty({ description: "뉴스 고유 ID", example: 1 })
  id: number;

  @ApiProperty({ description: "기사 제목", example: "기사제목" })
  title: string;

  @ApiProperty({ description: "분류 태그", example: "EARNINGS" })
  tag: string;

  @ApiProperty({ description: "출처 언론사 명칭", example: "언론사" })
  source: string;

  @ApiProperty({ description: "AI 요약본 텍스트", example: "ai 요약문" })
  summary: string;

  @ApiProperty({ description: "출처 원본 링크", example: "원본링크" })
  link: string;

  @ApiProperty({ description: "기사 발행 일시", example: "2026-06-05T15:40:15.000Z" })
  pub_date: string;
}
