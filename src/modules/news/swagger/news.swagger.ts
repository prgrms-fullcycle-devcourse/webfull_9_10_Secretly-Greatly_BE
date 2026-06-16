import { HttpStatus } from "@nestjs/common";
import { AiNewsTimelineResponseDto } from "../dto/res/ai-news-timeline-response.dto";

export const NEWS_SWAGGER = {
  findAll: {
    summary: "AI 분석 뉴스 전체 타임라인 조회",
    description: "외부 인프라 서버로부터 가공 완료된 당일 AI 핵심 뉴스 타임라인 리스트를 패치합니다.",
    ok: {
      status: HttpStatus.OK,
      description: "AI 분석 뉴스 전체 타임라인 조회가 완료되었습니다.",
      type: AiNewsTimelineResponseDto,
    },
  },
};
