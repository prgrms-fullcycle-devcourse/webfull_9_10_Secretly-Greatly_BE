import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { StocksModule } from "./modules/stocks/stocks.module";

@Module({
  imports: [PrismaModule, AuthModule, StocksModule],
  providers: [],
  controllers: [AppController],
})
export class AppModule {}
