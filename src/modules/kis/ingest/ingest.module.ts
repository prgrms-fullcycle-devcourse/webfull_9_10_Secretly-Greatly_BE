import { Module } from "@nestjs/common";
import { PriceModule } from "../price/price.module";
import { TickIngestService } from "./tickIngest.service";
import { DomesticPollerService } from "./domesticPoller.service";
import { OverseasIngestService } from "./overseasIngest.service";
import { OverseasPollerService } from "./overseasPoller.service";
import { MaintenanceService } from "./maintenance.service";

@Module({
  imports: [PriceModule],
  providers: [
    TickIngestService,
    DomesticPollerService,
    OverseasIngestService,
    OverseasPollerService,
    MaintenanceService,
  ],
  exports: [TickIngestService, OverseasIngestService],
})
export class IngestModule {}
