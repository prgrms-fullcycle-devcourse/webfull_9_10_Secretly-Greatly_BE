import { Module } from "@nestjs/common";
import { StocksController } from "./stocks.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { QuoteModule } from "../quote/quote.module";
import { StocksService } from "./stocks.service";

@Module({
  imports: [PrismaModule, QuoteModule],
  controllers: [StocksController],
  providers: [StocksService],
})
export class StocksModule {}
