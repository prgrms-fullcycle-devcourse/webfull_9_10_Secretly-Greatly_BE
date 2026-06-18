import { ApiResponseOptions } from "@nestjs/swagger";
import { HttpStatus } from "@nestjs/common";
import { StockSimulationResponseDto } from "../dto/res/stock-simulation-response.dto";

// 🟢 200 OK - 시뮬레이션 성공 연산 성공
export const SIMULATION_SUCCESS_RESPONSE: ApiResponseOptions = {
  status: HttpStatus.OK,
  description: "가상 추가 매수 시뮬레이션 7대 자산 지표 보정 연산이 완료되었습니다.",
  schema: {
    type: "object",
    properties: {
      statusCode: { type: "number", example: 200 },
      timestamp: { type: "string", example: "2026-06-15T18:40:12.142Z" },
      path: { type: "string", example: "/api/indicators" },
      message: { type: "string", example: "가상 추가 매수 시뮬레이션 7대 자산 지표 보정 연산이 완료되었습니다." },
      data: { $ref: `#/components/schemas/${StockSimulationResponseDto.name}` },
      error: { type: "object", nullable: true, example: null },
    },
  },
};

// 🛑 400 Bad Request - 유효성 검증 실패 (class-validator)
export const SIMULATION_VALIDATION_RESPONSE: ApiResponseOptions = {
  status: HttpStatus.BAD_REQUEST,
  description: "요청 데이터 유효성 검증에 실패했습니다. (금액/수량 누락 혹은 음수 입력)",
  schema: {
    type: "object",
    properties: {
      statusCode: { type: "number", example: 400 },
      timestamp: { type: "string", example: "2026-06-15T18:40:12.142Z" },
      path: { type: "string", example: "/api/indicators" },
      message: { type: "string", example: "currentAvgPrice must be a positive number" },
      data: { type: "object", nullable: true, example: null },
      error: { type: "string", example: "BadRequestException" },
    },
  },
};

// 🛑 404 Not Found - 보유 자산(Position) 데이터 누락 예외
export const SIMULATION_POSITION_NOT_FOUND_RESPONSE: ApiResponseOptions = {
  status: HttpStatus.NOT_FOUND,
  description: "해당 종목에 대한 사용자의 보유 자산(Position) 정보가 존재하지 않습니다.",
  schema: {
    type: "object",
    properties: {
      statusCode: { type: "number", example: 404 },
      timestamp: { type: "string", example: "2026-06-15T18:40:12.142Z" },
      path: { type: "string", example: "/api/indicators" },
      message: { type: "string", example: "해당 종목(NVDA)에 대한 보유 자산(Position) 데이터가 존재하지 않습니다." },
      data: { type: "object", nullable: true, example: null },
      error: { type: "string", example: "PositionNotFoundException" },
    },
  },
};
