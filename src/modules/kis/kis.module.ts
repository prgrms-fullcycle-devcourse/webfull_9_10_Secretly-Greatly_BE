import { Module } from "@nestjs/common";
import { KisAuthModule } from "./kisAuth/kisAuth.module";
import { KisCredentialModule } from "./kisCredential/kisCredential.module";

@Module({
  imports: [KisAuthModule, KisCredentialModule],
  exports: [KisAuthModule],
})
export class KisModule {}
