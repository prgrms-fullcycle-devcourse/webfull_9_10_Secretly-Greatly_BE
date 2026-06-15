import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { SimulationService } from "./simulation.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { StockSimulationRequestDto } from "./dto/req/stock-simulation-request.dto";
import { StockSimulationResponseDto } from "./dto/res/stock-simulation-response.dto";
import { CustomResponse } from "../../common/responses/custom.response";
import {
  SIMULATION_POSITION_NOT_FOUND_RESPONSE,
  SIMULATION_SUCCESS_RESPONSE,
  SIMULATION_VALIDATION_RESPONSE,
} from "../auth/swagger/simulation.swagger";

@ApiTags("Simulation (자산 시뮬레이션)")
@Controller("api/indicators")
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: StockSimulationRequestDto })
  @HttpCode(HttpStatus.OK)
  @ApiExtraModels(StockSimulationResponseDto)
  @ApiResponse(SIMULATION_SUCCESS_RESPONSE)
  @ApiResponse(SIMULATION_VALIDATION_RESPONSE)
  @ApiResponse(SIMULATION_POSITION_NOT_FOUND_RESPONSE)
  @ApiOperation({
    summary: "물타기/추가매수 평단가 시뮬레이션",
    description:
      "가상 추매 조건을 입력받아 7대 지표 보정 연산을 수행하고 결과를 DB에 저장한 뒤, 위장 로그와 함께 반환합니다.",
  })
  async runStockSimulation(
    @Req() req: any,
    @Body() body: StockSimulationRequestDto,
  ): Promise<CustomResponse<StockSimulationResponseDto>> {
    const userId = req.user.id;

    const data = await this.simulationService.calculateAndSaveSimulation(userId, body);

    return CustomResponse.success(data, "가상 추가 매수 시뮬레이션 7대 자산 연산이 완료되었습니다.");
  }
}
