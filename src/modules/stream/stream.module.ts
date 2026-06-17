import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { StreamGateway } from "./stream.gateway";
import { StreamService } from "./stream.service";
import { AlertSchedulerService } from "./alert-scheduler.service";

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [StreamGateway, StreamService, AlertSchedulerService],
  exports: [StreamService],
})
export class StreamModule {}
