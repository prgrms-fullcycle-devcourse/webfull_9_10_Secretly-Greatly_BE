import { Module } from "@nestjs/common";
import { PriceModule } from "../price/price.module";
import { TickIngestService } from "./tickIngest.service";
import { DomesticPollerService } from "./domesticPoller.service";
import { MaintenanceService } from "./maintenance.service";

@Module({
  imports: [PriceModule],
  providers: [TickIngestService, DomesticPollerService, MaintenanceService],
  exports: [TickIngestService],
})
export class IngestModule {}
