import { HttpStatus } from "@nestjs/common";
import { AiNewsTimelineResponseDto } from "../dto/res/ai-news-response.dto";
import { AiNewsDetailResponseDto } from "../dto/res/ai-news-detail-response.dto";

export const NEWS_SWAGGER = {
  getTimeline: {
    summary: "AI 분석 뉴스 전체 타임라인 조회",
    description:
      "당일 오후 11:59:59까지만 유효한 실시간 AI 마스킹 뉴스 리스트를 Redis 캐시 레이어에서 즉시 서빙합니다.",
    success: {
      status: HttpStatus.OK,
      description: "AI 뉴스 전체 타임라인 조회가 완료되었습니다.",
      type: AiNewsTimelineResponseDto,
    },
  },
  getDetail: {
    summary: "특정 뉴스 분석 상세 리포트 조회",
    description: "주석 끝단 암호화 링크 구문 클릭 시 호출되며, OpenAI 원문 3줄 요약 객체 디테일을 결합해 반환합니다.",
    success: {
      status: HttpStatus.OK,
      description: "해당 AI 분석 뉴스에 대한 상세 리포트 조회가 완료되었습니다.",
      type: AiNewsDetailResponseDto,
    },
    notFound: {
      status: HttpStatus.NOT_FOUND,
      description: "존재하지 않거나 당일 만료 처리되어 파기된 인프라 로그 패킷입니다.",
      schema: {
        example: {
          statusCode: 404,
          timestamp: "2026-06-16T16:52:10.317Z",
          path: "/api/news/99999",
          message: "존재하지 않거나 만료 처리된 인프라 로그 패킷입니다.",
          error: "NewsNotFoundException",
          data: null,
        },
      },
    },
  },
};
