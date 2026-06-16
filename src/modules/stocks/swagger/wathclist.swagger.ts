import { HttpStatus } from "@nestjs/common";
import { CreateWatchlistResponseDto } from "../dto/res/create-watchlist-response.dto";

export const WATCHLIST_SWAGGER = {
  create: {
    summary: "관심 종목 가상 디렉토리 등록",
    description: "유저의 가상 디렉토리에 관심 종목을 파일 형태로 등록합니다. 최대 10개 한도 도달 시 등록이 거부됩니다.",
    created: {
      status: HttpStatus.CREATED,
      description: "관심 종목 파일이 가상 디렉토리에 성공적으로 생성되었습니다.",
      type: CreateWatchlistResponseDto,
    },
    badRequest: {
      status: HttpStatus.BAD_REQUEST,
      description: "가상 디스크 용량이 부족합니다 (최대 10개 한도 초과).",
      schema: {
        example: {
          statusCode: 400,
          timestamp: "2026-06-02T14:15:05.881Z",
          path: "/api/stocks/watchlist",
          message: "가상 디스크 용량이 부족합니다 (최대 10개).",
          error: "WatchlistCapacityExceededException",
          data: null,
        },
      },
    },
  },
};
