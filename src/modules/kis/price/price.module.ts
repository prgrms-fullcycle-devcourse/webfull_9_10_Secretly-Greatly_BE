import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { KisAuthModule } from "../kisAuth/kisAuth.module";
import { KisDomesticPriceService } from "./kisDomesticPrice.service";
import { KisOverseasPriceService } from "./kisOverseasPrice.service";

@Module({
  imports: [HttpModule, KisAuthModule],
  providers: [KisDomesticPriceService, KisOverseasPriceService],
  exports: [KisDomesticPriceService, KisOverseasPriceService],
})
export class PriceModule {}
