import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../../common/prisma/prisma.module";
import { KisAuthService } from "./kisAuth.service";

@Module({
  imports: [ConfigModule, PrismaModule, HttpModule.register({ timeout: 5000 })],
  providers: [KisAuthService],
  exports: [KisAuthService],
})
export class KisAuthModule {}
