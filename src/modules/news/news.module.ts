import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { NewsService } from "./news.service";
import { NewsController } from "./news.controller";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
