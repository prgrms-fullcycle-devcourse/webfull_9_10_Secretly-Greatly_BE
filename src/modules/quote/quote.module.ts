import { Module } from "@nestjs/common";
import { QuoteCacheService } from "./quoteCache.service";
import { QuoteService } from "./quote.service";

@Module({
  providers: [QuoteCacheService, QuoteService],
  exports: [QuoteService],
})
export class QuoteModule {}
