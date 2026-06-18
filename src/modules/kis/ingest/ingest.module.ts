import { Module } from "@nestjs/common";
import { PriceModule } from "../price/price.module";
import { DomesticIngestService } from "./domesticIngest.service";
import { DomesticPollerService } from "./domesticPoller.service";
import { OverseasIngestService } from "./overseasIngest.service";
import { OverseasPollerService } from "./overseasPoller.service";
import { MaintenanceService } from "./maintenance.service";
import { QuoteModule } from "../../quote/quote.module";
import { IndexIngestService } from "./indexIngest.service";
import { IndexPollerService } from "./indexPoller.service";

@Module({
  imports: [PriceModule, QuoteModule],
  providers: [
    DomesticIngestService,
    DomesticPollerService,
    OverseasIngestService,
    OverseasPollerService,
    MaintenanceService,
    IndexIngestService,
    IndexPollerService,
  ],
  exports: [DomesticIngestService, OverseasIngestService, QuoteModule],
})
export class IngestModule {}
