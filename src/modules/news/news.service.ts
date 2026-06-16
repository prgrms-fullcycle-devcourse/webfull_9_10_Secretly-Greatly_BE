import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AiNewsTimelineResponseDto } from "./dto/res/ai-news-timeline-response.dto"; // 👈 분리한 시간 유틸 임포트

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly newsServerUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.newsServerUrl = this.configService.get<string>("NEWS_SERVER_URL");
  }

  async fetchAiNewsTimeline(): Promise<AiNewsTimelineResponseDto> {
    this.logger.log("📡 [News Proxy Engine] 외부 AI 뉴스 렌더 인프라 타임라인 조회 트래픽 전송 시작");

    try {
      const response = await firstValueFrom(this.httpService.get(`${this.newsServerUrl}/api/v1/news-feed`));

      const externalItems = response.data?.items || [];

      const sanitizedItems = externalItems.map((item: any) => {
        const cleanSummary = item.summary ? item.summary.replace(/%/g, "") : "";

        return {
          id: item.id,
          title: item.title,
          tag: item.tag,
          source: item.source,
          summary: cleanSummary,
          link: item.link,
          pub_date: item.pub_date || new Date().toISOString(),
        };
      });

      return {
        totalCount: sanitizedItems.length,
        items: sanitizedItems,
      };
    } catch (error) {
      this.logger.error(
        `❌ [News Proxy Network Critical Error] 외부 뉴스 인프라 통신 지연 혹은 실패: ${error.message}`,
      );

      return {
        totalCount: 0,
        items: [],
      };
    }
  }
}
