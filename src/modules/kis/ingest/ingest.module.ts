import { Module } from "@nestjs/common";
import { PriceModule } from "../price/price.module";
import { TickIngestService } from "./tickIngest.service";
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
    TickIngestService,
    DomesticPollerService,
    OverseasIngestService,
    OverseasPollerService,
    MaintenanceService,
    IndexIngestService,
    IndexPollerService,
  ],
  exports: [TickIngestService, OverseasIngestService, QuoteModule],
})
export class IngestModule {}
