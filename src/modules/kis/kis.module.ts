import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { KisAuthModule } from "./kisAuth/kisAuth.module";
import { KisCredentialModule } from "./kisCredential/kisCredential.module";
import { PriceModule } from "./price/price.module";
import { IngestModule } from "./ingest/ingest.module";

@Module({
  imports: [HttpModule, KisAuthModule, KisCredentialModule, PriceModule, IngestModule],
  exports: [KisAuthModule],
})
export class KisModule {}
