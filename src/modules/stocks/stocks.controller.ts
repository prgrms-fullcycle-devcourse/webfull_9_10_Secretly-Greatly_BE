import { Controller, Get, Header, HttpCode, HttpStatus, Query, Req, UseGuards } from "@nestjs/common";
import { StockItemFetchAll } from "./stocks.service";
import { GetStocksQueryDto } from "./dto/getStocksQuery.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";

@Controller("api/stocks")
@UseGuards(JwtAuthGuard)
export class StocksController {
  constructor(private readonly StockItemFetchAll: StockItemFetchAll) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Header("Content-Type", "application/json")
  async getAllStocks(@Req() req: { user: JwtPayload }, @Query() query: GetStocksQueryDto) {
    const userId = req.user.sub;
    const data = await this.StockItemFetchAll.findAll(userId, query);
    return {
      message: "조건에 부합하는 전체 종목 데이터 조회가 완료되었습니다.",
      data,
    };
  }
}
