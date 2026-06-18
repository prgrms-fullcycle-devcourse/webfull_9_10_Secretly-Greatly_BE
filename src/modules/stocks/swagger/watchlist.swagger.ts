import { HttpStatus } from "@nestjs/common";
import { CreateWatchlistResponseDto } from "../dto/res/create-watchlist-response.dto";
import { WatchlistResponseDto } from "../dto/res/watchlist-response.dto";

export const WATCHLIST_SWAGGER = {
  create: {
    summary: "관심 종목 가상 디렉토리 등록",
    description: "유저의 가상 디렉토리에 관심 종목을 파일 형태로 등록합니다. 최대 20개 한도 도달 시 등록이 거부됩니다.",
    created: {
      status: HttpStatus.CREATED,
      description: "관심 종목 파일이 가상 디렉토리에 성공적으로 생성되었습니다.",
      type: CreateWatchlistResponseDto,
    },
    badRequest: {
      status: HttpStatus.BAD_REQUEST,
      description: "가상 디스크 용량이 부족합니다 (최대 20개 한도 초과).",
      schema: {
        example: {
          statusCode: 400,
          timestamp: "2026-06-02T14:15:05.881Z",
          path: "/api/stocks/watchlist",
          message: "가상 디스크 용량이 부족합니다 (최대 20개).",
          error: "WatchlistCapacityExceededException",
          data: null,
        },
      },
    },
  },

  findAll: {
    summary: "조건별 관심 종목(즐겨찾기) 동적 정렬 조회",
    description:
      "인증 유저 및 익명 UUID 세션 유저의 즐겨찾기를 가져와 위장 정책(금융 기호 제거, 종목명 파일명 은폐, 다중 정렬)을 적용해 반환합니다.",
    ok: {
      status: HttpStatus.OK,
      description: "지정된 조건으로 필터링 및 컴파일된 관심 종목 목록을 반환합니다.",
      type: WatchlistResponseDto,
      schema: {
        example: {
          statusCode: 200,
          timestamp: "2026-06-18T16:05:00.000Z",
          path: "/api/stocks/watchlist",
          message: "지정된 조건으로 필터링된 즐겨찾기 목록을 반환합니다.",
          data: {
            currentTimeframe: "M15",
            currentSortBy: "FLUCTUATION",
            totalCount: 1,
            items: [
              {
                watchlistId: 101,
                stockId: 12, // 💡 추가: 상세 차트 조회 및 라우팅 브릿지용 종목 고유 ID
                displayFileName: "삼성전자.json", // 💡 변경: 종목 코드 대신 실제 종목명 기조로 파일명 마스킹 변환 예시 적용
                ticker: "005930",
                currentPrice: 77500,
                fluctuationRate: 1.35, // 💡 특수 기호(%, ▲)가 완전히 배제된 순수 실수
                volume: 12450000,
                displayOrder: 1,
              },
            ],
          },
        },
      },
    },
    queryParams: {
      timeframe: {
        name: "timeframe",
        required: false,
        description: "타임프레임 스위칭 조건 (기본값: M15)",
        enum: ["DAILY", "M15", "M30"],
      },
      sortBy: {
        name: "sortBy",
        required: false,
        description: "다중 정렬 필터 조건 (기본값: FLUCTUATION)",
        enum: ["FLUCTUATION", "PRICE", "VOLUME"],
      },
    },
  },
};
