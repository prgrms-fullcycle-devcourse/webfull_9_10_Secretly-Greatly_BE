import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { GetStocksQueryDto } from "./dto/getStocksQuery.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  STOCK_ITEM_FETCH_ALL_API_DESCRIPTION,
  STOCK_ITEM_FETCH_ALL_SUCCESS_API_RESPONSE,
  STOCK_ITEM_FETCH_ALL_VALIDATION_API_RESPONSE,
  STOCK_ITEM_FETCH_ALL_UNAUTHORIZED_API_RESPONSE,
} from "./swagger/stockItemFetchAll.swagger";
import {
  STOCK_CANDLES_API_DESCRIPTION,
  STOCK_CANDLES_INTERVAL_QUERY,
  STOCK_CANDLES_LIMIT_QUERY,
  STOCK_CANDLES_SUCCESS_API_RESPONSE,
} from "./swagger/stockCandles.swagger";
import { StocksService } from "./stocks.service";
import { AuthenticatedRequest } from "../auth/interfaces/request.inerface";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { CustomResponse } from "../../common/responses/custom.response";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { CreateWatchlistRequestDto } from "./dto/req/create-watchlist-request.dto";
import { CreateWatchlistResponseDto } from "./dto/res/create-watchlist-response.dto";
import { GetStockCandlesQueryDto } from "./dto/req/get-stock-candles-query.dto";
import { WATCHLIST_SWAGGER } from "./swagger/watchlist.swagger";
import { GetWatchlistQueryRequestDto } from "./dto/req/get-watchlist-query-request.dto";
import { WatchlistResponseDto } from "./dto/res/watchlist-response.dto";

@ApiTags("Stocks")
@Controller("api/stocks")
export class StocksController {
  constructor(private readonly stockService: StocksService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Header("Content-Type", "application/json")
  @ApiCookieAuth("accessToken")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "전체 종목 목록 조회 (종목 추가/검색용)",
    description: STOCK_ITEM_FETCH_ALL_API_DESCRIPTION,
  })
  @ApiResponse(STOCK_ITEM_FETCH_ALL_SUCCESS_API_RESPONSE)
  @ApiResponse(STOCK_ITEM_FETCH_ALL_VALIDATION_API_RESPONSE)
  @ApiResponse(STOCK_ITEM_FETCH_ALL_UNAUTHORIZED_API_RESPONSE)
  async getAllStocks(@Req() req: { user?: JwtPayload }, @Query() query: GetStocksQueryDto) {
    const userId = req.user?.sub ?? null;
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

  @Get("/watchlist")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: WATCHLIST_SWAGGER.findAll.summary,
    description: WATCHLIST_SWAGGER.findAll.description,
  })
  @ApiQuery(WATCHLIST_SWAGGER.findAll.queryParams.timeframe)
  @ApiQuery(WATCHLIST_SWAGGER.findAll.queryParams.sortBy)
  @ApiResponse(WATCHLIST_SWAGGER.findAll.ok)
  async getWatchlist(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetWatchlistQueryRequestDto,
  ): Promise<CustomResponse<WatchlistResponseDto>> {
    const userId = req.user.sub;
    const data = await this.stockService.getWatchlist(userId, query);

    return CustomResponse.success(data, "지정된 조건으로 필터링된 즐겨찾기 목록을 반환합니다.");
  }

  @Get(":stockId/candles")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth("accessToken")
  @ApiOperation({
    summary: "종목 캔들 차트 조회",
    description: STOCK_CANDLES_API_DESCRIPTION,
  })
  @ApiQuery(STOCK_CANDLES_INTERVAL_QUERY)
  @ApiQuery(STOCK_CANDLES_LIMIT_QUERY)
  @ApiResponse(STOCK_CANDLES_SUCCESS_API_RESPONSE)
  async getCandles(
    @Req() req: AuthenticatedRequest,
    @Param("stockId", ParseIntPipe) stockId: number,
    @Query() query: GetStockCandlesQueryDto,
  ) {
    return this.stockService.getCandles(req.user.sub, stockId, query);
  }
}
