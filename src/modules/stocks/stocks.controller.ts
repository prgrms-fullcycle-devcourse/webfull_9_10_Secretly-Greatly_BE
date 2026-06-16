import { Body, Controller, Get, Header, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { GetStocksQueryDto } from "./dto/getStocksQuery.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  STOCK_ITEM_FETCH_ALL_API_DESCRIPTION,
  STOCK_ITEM_FETCH_ALL_SUCCESS_API_RESPONSE,
  STOCK_ITEM_FETCH_ALL_VALIDATION_API_RESPONSE,
  STOCK_ITEM_FETCH_ALL_UNAUTHORIZED_API_RESPONSE,
} from "./swagger/stockItemFetchAll.swagger";
import { AuthenticatedRequest } from "../auth/interfaces/request.inerface";
import { WATCHLIST_SWAGGER } from "./swagger/wathclist.swagger";
import { CreateWatchlistRequestDto } from "./dto/req/create-watchlist-request.dto";
import { CustomResponse } from "../../common/responses/custom.response";
import { CreateWatchlistResponseDto } from "./dto/res/create-watchlist-response.dto";
import { StocksService } from "./stocks.service";

@ApiTags("Stocks")
@Controller("api/stocks")
@UseGuards(JwtAuthGuard)
export class StocksController {
  constructor(private readonly stockService: StocksService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Header("Content-Type", "application/json")
  @ApiCookieAuth("accessToken")
  @ApiOperation({
    summary: "전체 종목 목록 조회 (종목 추가/검색용)",
    description: STOCK_ITEM_FETCH_ALL_API_DESCRIPTION,
  })
  @ApiResponse(STOCK_ITEM_FETCH_ALL_SUCCESS_API_RESPONSE)
  @ApiResponse(STOCK_ITEM_FETCH_ALL_VALIDATION_API_RESPONSE)
  @ApiResponse(STOCK_ITEM_FETCH_ALL_UNAUTHORIZED_API_RESPONSE)
  async getAllStocks(@Req() req: AuthenticatedRequest, @Query() query: GetStocksQueryDto) {
    const userId = req.user.sub;
    const data = await this.stockService.findAll(userId, query);
    return {
      message: "조건에 부합하는 전체 종목 데이터 조회가 완료되었습니다.",
      data,
    };
  }

  @Post("/watchlist")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "즐겨찾기 등록", description: WATCHLIST_SWAGGER.create.description })
  @ApiResponse(WATCHLIST_SWAGGER.create.created)
  @ApiResponse(WATCHLIST_SWAGGER.create.badRequest)
  async createWatchlist(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateWatchlistRequestDto,
  ): Promise<CustomResponse<CreateWatchlistResponseDto>> {
    const userId = req.user.sub;
    const data = await this.stockService.addStockToWatchlist(userId, body);

    return CustomResponse.success(data, `관심 종목 [${data.stockName}]이(가) 성공적으로 생성되었습니다.`);
  }
}
