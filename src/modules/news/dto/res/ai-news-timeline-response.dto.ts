import { ApiProperty } from "@nestjs/swagger";
import { AiNewsResponseDto } from "./ai-news-response.dto";

export class AiNewsTimelineResponseDto {
  @ApiProperty({ description: "당일 수집 및 분석된 총 뉴스 개수", example: 2 })
  totalCount: number;

  @ApiProperty({ description: "AI 뉴스 아이템 리스트", type: [AiNewsResponseDto] })
  items: AiNewsResponseDto[];
}
