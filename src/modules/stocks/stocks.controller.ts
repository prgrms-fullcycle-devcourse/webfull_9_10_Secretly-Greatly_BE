import {
  Body,
  Controller,
  Delete,
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
  STOCK_CANDLES_LIMIT_QUERY,
  STOCK_CANDLES_SUCCESS_API_RESPONSE,
} from "./swagger/stockCandles.swagger";
import { STOCK_QUOTES_SUCCESS_API_RESPONSE } from "./swagger/stockquotes.swagger";
import { StocksService } from "./stocks.service";
import { QuoteService } from "../quote/quote.service";
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
import { DeleteWatchlistResponseDto } from "./dto/res/delete-watchlist-response.dto";
import { GetQuotesRequestDto } from "./dto/req/get-quotes-request.dto";
import { GetQuotesResponseDto } from "./dto/res/get-quotes-response.dto";

@ApiTags("Stocks")
@Controller("api/stocks")
export class StocksController {
  constructor(
    private readonly stockService: StocksService,
    private readonly quoteService: QuoteService,
  ) {}

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

  @Post("/quotes")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth("accessToken")
  @ApiOperation({
    summary: "종목 시세 조회 (시세 시트용)",
    description: "요청한 stockId 들의 현재 시세 + 등락률(전일/15분/30분 대비)을 반환합니다.",
  })
  @ApiResponse(STOCK_QUOTES_SUCCESS_API_RESPONSE)
  async getQuotes(
    @Req() req: AuthenticatedRequest,
    @Body() body: GetQuotesRequestDto,
  ): Promise<CustomResponse<GetQuotesResponseDto>> {
    const userId = req.user.sub;
    const quotes = await this.quoteService.getQuotesWithChangeRate(userId, body.stockIds);
    return CustomResponse.success({ quotes }, "요청한 종목의 시세 조회가 완료되었습니다.");
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
  @ApiQuery(STOCK_CANDLES_LIMIT_QUERY)
  @ApiResponse(STOCK_CANDLES_SUCCESS_API_RESPONSE)
  async getCandles(
    @Req() req: AuthenticatedRequest,
    @Param("stockId", ParseIntPipe) stockId: number,
    @Query() query: GetStockCandlesQueryDto,
  ) {
    return this.stockService.getCandles(req.user.sub, stockId, query);
  }

  @Delete("/watchlist/:watchlistId")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "즐겨찾기 종목 해제",
    description: "즐겨찾기 종목을 해제합니다.",
  })
  @ApiResponse(WATCHLIST_SWAGGER.delete.ok)
  @ApiResponse(WATCHLIST_SWAGGER.delete.notFound)
  async deleteWatchlist(
    @Req() req: AuthenticatedRequest,
    @Param("watchlistId", ParseIntPipe) watchlistId: number,
  ): Promise<CustomResponse<DeleteWatchlistResponseDto>> {
    const userId = req.user.sub;
    const data = await this.stockService.removeStockFromWatchlist(userId, watchlistId);

    return CustomResponse.success(data, "즐겨찾기가 해제되었습니다.");
  }
}
