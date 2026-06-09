import { Module } from "@nestjs/common";
import { PrismaModule } from "../../../common/prisma/prisma.module";
import { AuthModule } from "../../auth/auth.module";
import { KisCredentialController } from "./kisCredential.controller";
import { KisCredentialService } from "./kisCredential.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [KisCredentialController],
  providers: [KisCredentialService],
})
export class KisCredentialModule {}
