import { Module } from "@nestjs/common";
import { StocksController } from "./stocks.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { QuoteModule } from "../quote/quote.module";
import { StocksService } from "./stocks.service";
import { AuthModule } from "../auth/auth.module";
import { PriceModule } from "../kis/price/price.module";

@Module({
  imports: [PrismaModule, QuoteModule, AuthModule, PriceModule],
  controllers: [StocksController],
  providers: [StocksService],
})
export class StocksModule {}
