import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ChatModule } from "./modules/chat/chat.module";
import { StocksModule } from "./modules/stocks/stocks.module";

@Module({
  imports: [PrismaModule, AuthModule, StocksModule, ChatModule],
  providers: [],
  controllers: [AppController],
})
export class AppModule {}
