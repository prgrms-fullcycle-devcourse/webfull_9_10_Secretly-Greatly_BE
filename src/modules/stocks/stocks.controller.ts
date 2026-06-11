import { Controller, Get, Header, HttpCode, HttpStatus, Query } from "@nestjs/common";
import { StockItemFetchAll } from "./stocks.service";
import { GetStocksQueryDto } from "./dto/getStocksQuery.dto";

@Controller("api/stocks")
export class StocksController {
  constructor(private readonly StockItemFetchAll: StockItemFetchAll) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Header("Content-Type", "application/json")
  async getAllStocks(@Query() query: GetStocksQueryDto) {
    const data = await this.StockItemFetchAll.findAll(query);
    return {
      message: "조건에 부합하는 전체 종목 데이터 조회가 완료되었습니다.",
      data,
    };
  }
}
