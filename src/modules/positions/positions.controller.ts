import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  Patch,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedRequest } from "../auth/interfaces/request.inerface";
import { CustomResponse } from "../../common/responses/custom.response";
import { CreatePositionRequestDto } from "./dto/req/create-position-request.dto";
import { UpdatePositionRequestDto } from "./dto/req/update-position-request.dto";
import { CreatePositionResponseDto } from "./dto/res/create-position-response.dto";
import { PositionsService } from "./positions.service";
import {
  POSITIONS_CREATE_API_DESCRIPTION,
  POSITIONS_CREATE_CONFLICT_API_RESPONSE,
  POSITIONS_CREATE_NOT_FOUND_API_RESPONSE,
  POSITIONS_CREATE_SUCCESS_API_RESPONSE,
  POSITIONS_CREATE_VALIDATION_API_RESPONSE,
  POSITIONS_DELETE_API_DESCRIPTION,
  POSITIONS_DELETE_NOT_FOUND_API_RESPONSE,
  POSITIONS_DELETE_SUCCESS_API_RESPONSE,
  POSITIONS_FETCH_ALL_API_DESCRIPTION,
  POSITIONS_FETCH_ALL_SUCCESS_API_RESPONSE,
  POSITIONS_UPDATE_API_DESCRIPTION,
  POSITIONS_UPDATE_FORBIDDEN_API_RESPONSE,
  POSITIONS_UPDATE_NOT_FOUND_API_RESPONSE,
  POSITIONS_UPDATE_SUCCESS_API_RESPONSE,
  POSITIONS_UPDATE_VALIDATION_API_RESPONSE,
  POSITIONS_UNAUTHORIZED_API_RESPONSE,
} from "./swagger/positions.swagger";

@ApiTags("Positions")
@Controller("api/positions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiCookieAuth("accessToken")
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "내 종목 일괄 추가",
    description: POSITIONS_CREATE_API_DESCRIPTION,
  })
  @ApiBody({
    type: [CreatePositionRequestDto],
    examples: {
      createPositions: {
        summary: "내 종목 일괄 추가 요청",
        value: [
          {
            stockId: 1,
            purchasePrice: 1000,
            purchaseQuantity: 2,
          },
          {
            stockId: 1,
            purchasePrice: 40000,
            purchaseQuantity: 4,
          },
          {
            stockId: 28,
            purchasePrice: 100000,
            purchaseQuantity: 3,
          },
        ],
      },
    },
  })
  @ApiResponse(POSITIONS_CREATE_SUCCESS_API_RESPONSE)
  @ApiResponse(POSITIONS_CREATE_VALIDATION_API_RESPONSE)
  @ApiResponse(POSITIONS_CREATE_NOT_FOUND_API_RESPONSE)
  @ApiResponse(POSITIONS_CREATE_CONFLICT_API_RESPONSE)
  @ApiResponse(POSITIONS_UNAUTHORIZED_API_RESPONSE)
  async createPositions(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreatePositionRequestDto[],
  ): Promise<CustomResponse<CreatePositionResponseDto[]>> {
    const userId = req.user.sub;
    const data = await this.positionsService.createPositions(userId, body);

    return CustomResponse.success(data, "내 종목이 성공적으로 추가되었습니다.");
  }

  @Get()
  @ApiOperation({
    summary: "내 종목 리스트 조회",
    description: POSITIONS_FETCH_ALL_API_DESCRIPTION,
  })
  @ApiResponse(POSITIONS_FETCH_ALL_SUCCESS_API_RESPONSE)
  @ApiResponse(POSITIONS_UNAUTHORIZED_API_RESPONSE)
  async getMyPositions(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const data = await this.positionsService.getMyPositions(userId);

    return CustomResponse.success(data, "내 종목 리스트 조회가 완료되었습니다.");
  }

  @Delete(":positionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "내 종목 삭제",
    description: POSITIONS_DELETE_API_DESCRIPTION,
  })
  @ApiResponse(POSITIONS_DELETE_SUCCESS_API_RESPONSE)
  @ApiResponse(POSITIONS_DELETE_NOT_FOUND_API_RESPONSE)
  @ApiResponse(POSITIONS_UNAUTHORIZED_API_RESPONSE)
  async deletePosition(@Req() req: AuthenticatedRequest, @Param("positionId", ParseIntPipe) positionId: number) {
    const userId = req.user.sub;
    const data = await this.positionsService.deletePosition(userId, positionId);

    return CustomResponse.success(data, "내 종목이 성공적으로 삭제되었습니다.");
  }
  @Patch(":positionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "내 종목 수정",
    description: POSITIONS_UPDATE_API_DESCRIPTION,
  })
  @ApiBody({
    type: UpdatePositionRequestDto,
    examples: {
      updatePosition: {
        summary: "내 종목 수정 요청",
        value: {
          averagePrice: 28000,
          quantity: 7,
        },
      },
    },
  })
  @ApiResponse(POSITIONS_UPDATE_SUCCESS_API_RESPONSE)
  @ApiResponse(POSITIONS_UPDATE_VALIDATION_API_RESPONSE)
  @ApiResponse(POSITIONS_UPDATE_NOT_FOUND_API_RESPONSE)
  @ApiResponse(POSITIONS_UPDATE_FORBIDDEN_API_RESPONSE)
  @ApiResponse(POSITIONS_UNAUTHORIZED_API_RESPONSE)
  async updatePosition(
    @Req() req: AuthenticatedRequest,
    @Param("positionId", ParseIntPipe) positionId: number,
    @Body() body: UpdatePositionRequestDto,
  ) {
    const userId = req.user.sub;

    const data = await this.positionsService.updatePosition(userId, positionId, body);

    return CustomResponse.success(data, "내 종목 수정에 성공했습니다.");
  }
}
