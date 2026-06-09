import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "@nestjs-modules/ioredis";
import { AppController } from "./app.controller";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { StocksModule } from "./modules/stocks/stocks.module";

@Module({
  imports: [
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
  ],
  providers: [],
  controllers: [AppController],
})
export class AppModule {}
