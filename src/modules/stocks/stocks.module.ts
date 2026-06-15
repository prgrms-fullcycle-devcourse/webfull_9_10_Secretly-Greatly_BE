import { Module } from "@nestjs/common";
import { StocksController } from "./stocks.controller";
import { StockItemFetchAll } from "./stocks.service";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { QuoteModule } from "../quote/quote.module";

@Module({
  imports: [PrismaModule, QuoteModule],
  controllers: [StocksController],
  providers: [StockItemFetchAll],
})
export class StocksModule {}
