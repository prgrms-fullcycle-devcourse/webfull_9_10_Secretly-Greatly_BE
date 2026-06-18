import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { SimulationService } from "./simulation.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { StockSimulationRequestDto } from "./dto/req/stock-simulation-request.dto";
import { StockSimulationResponseDto } from "./dto/res/stock-simulation-response.dto";
import { CustomResponse } from "../../common/responses/custom.response";
import {
  SIMULATION_POSITION_NOT_FOUND_RESPONSE,
  SIMULATION_SUCCESS_RESPONSE,
  SIMULATION_VALIDATION_RESPONSE,
} from "./swagger/simulation.swagger";
import { AuthenticatedRequest } from "../auth/interfaces/request.inerface";
import { StatusBarIndicatorDataDto } from "./dto/res/market-indicator-statusbar-response.dto";
import { INDICATOR_STATUSBAR_SUCCESS_RESPONSE } from "./swagger/indicator.swagger";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";

@ApiTags("Simulation & Indicators (자산 시뮬레이션 및 시장 지표)")
@Controller("api/indicators")
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: StockSimulationRequestDto })
  @HttpCode(HttpStatus.OK)
  @ApiExtraModels(StockSimulationResponseDto, StatusBarIndicatorDataDto)
  @ApiResponse(SIMULATION_SUCCESS_RESPONSE)
  @ApiResponse(SIMULATION_VALIDATION_RESPONSE)
  @ApiResponse(SIMULATION_POSITION_NOT_FOUND_RESPONSE)
  @ApiOperation({
    summary: "물타기/추가매수 평단가 시뮬레이션",
    description:
      "가상 추매 조건을 입력받아 7대 지표 보정 연산을 수행하고 결과를 DB에 저장한 뒤, 위장 로그와 함께 반환합니다.",
  })
  async runStockSimulation(
    @Req() req: AuthenticatedRequest,
    @Body() body: StockSimulationRequestDto,
  ): Promise<CustomResponse<StockSimulationResponseDto>> {
    const userId = req.user.sub;

    const data = await this.simulationService.calculateAndSaveSimulation(userId, body);

    return CustomResponse.success(data, "가상 추가 매수 시뮬레이션 7대 자산 연산이 완료되었습니다.");
  }

  @Get("/statusbar")
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "VSCode 상태 표시줄 위장 선행지표 조회",
    description:
      "유령 테이블을 제거하고 stocks 마스터(INDEX)와 유저별 ticks 데이터를 실시간 컴파일하여 한국투자증권 파이프라인 데이터를 가공합니다.",
  })
  @ApiResponse(INDICATOR_STATUSBAR_SUCCESS_RESPONSE)
  async getStatusBarIndicators(@Req() req: { user?: JwtPayload }): Promise<CustomResponse<StatusBarIndicatorDataDto>> {
    const userId = req.user?.sub ?? "00000000-0000-0000-0000-000000000000";
    const data = await this.simulationService.getStatusBarIndicators(userId);

    return CustomResponse.success(data, "VSCode 에디터 하단 상태 표시줄 위장 선행지표 캐시 조회가 완료되었습니다.");
  }
}
