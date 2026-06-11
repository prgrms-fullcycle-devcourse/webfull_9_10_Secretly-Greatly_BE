import { Module } from "@nestjs/common";
import { StocksController } from "./stocks.controller";
import { StockItemFetchAll } from "./stocks.service";
import { PrismaModule } from "../../common/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [StocksController],
  providers: [StockItemFetchAll],
})
export class StocksModule {}
