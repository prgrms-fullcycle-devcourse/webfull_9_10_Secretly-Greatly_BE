import { Controller, Get, Header, HttpCode, HttpStatus, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth, ApiResponse } from "@nestjs/swagger";
import { StockItemFetchAll } from "./stocks.service";
import { GetStocksQueryDto } from "./dto/getStocksQuery.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  STOCK_ITEM_FETCH_ALL_API_DESCRIPTION,
  STOCK_ITEM_FETCH_ALL_SUCCESS_API_RESPONSE,
  STOCK_ITEM_FETCH_ALL_VALIDATION_API_RESPONSE,
  STOCK_ITEM_FETCH_ALL_UNAUTHORIZED_API_RESPONSE,
} from "./swagger/stockItemFetchAll.swagger";
import { AuthenticatedRequest } from "../auth/interfaces/request.inerface";

@ApiTags("Stocks")
@Controller("api/stocks")
@UseGuards(JwtAuthGuard)
export class StocksController {
  constructor(private readonly StockItemFetchAll: StockItemFetchAll) {}

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
    const data = await this.StockItemFetchAll.findAll(userId, query);
    return {
      message: "조건에 부합하는 전체 종목 데이터 조회가 완료되었습니다.",
      data,
    };
  }
}
