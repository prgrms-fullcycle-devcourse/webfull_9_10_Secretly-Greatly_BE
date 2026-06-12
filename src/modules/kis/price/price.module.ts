import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { KisAuthModule } from "../kisAuth/kisAuth.module";
import { KisDomesticPriceService } from "./kis-domestic-price.service";

@Module({
  imports: [HttpModule, KisAuthModule],
  providers: [KisDomesticPriceService],
  exports: [KisDomesticPriceService],
})
export class PriceModule {}
