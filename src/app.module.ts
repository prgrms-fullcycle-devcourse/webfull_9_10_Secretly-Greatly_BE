import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "@nestjs-modules/ioredis";
import { AppController } from "./app.controller";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { KisModule } from "./modules/kis/kis.module";
import { ChatModule } from "./modules/chat/chat.module";
import { StocksModule } from "./modules/stocks/stocks.module";
import { CryptoModule } from "./common/crypto/crypto.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "single",
        url: `redis://${config.get("REDIS_HOST") ?? "localhost"}:${config.get("REDIS_PORT") ?? 6379}`,
      }),
    }),
    PrismaModule,
    AuthModule,
    CryptoModule,
    KisModule,
    StocksModule,
    ChatModule,
  ],
  providers: [],
  controllers: [AppController],
})
export class AppModule {}
