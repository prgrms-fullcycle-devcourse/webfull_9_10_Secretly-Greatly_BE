import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { KisAuthModule } from "../kisAuth/kisAuth.module";
import { KisDomesticPriceService } from "./kisDomesticPrice.service";
import { KisOverseasPriceService } from "./kisOverseasPrice.service";
import { KisIndexPriceService } from "./kisIndexPrice.service";
import { KisChartPriceService } from "./kisChartPrice.service";

@Module({
  imports: [HttpModule, KisAuthModule],
  providers: [KisDomesticPriceService, KisOverseasPriceService, KisIndexPriceService, KisChartPriceService],
  exports: [KisDomesticPriceService, KisOverseasPriceService, KisIndexPriceService, KisChartPriceService],
})
export class PriceModule {}
