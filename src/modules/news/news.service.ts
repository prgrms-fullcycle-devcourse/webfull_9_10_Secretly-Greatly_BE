import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AiNewsTimelineResponseDto, AiNewsItemDto } from "./dto/res/ai-news-response.dto";
import { AiNewsDetailResponseDto } from "./dto/res/ai-news-detail-response.dto";
import { getRemainingSecondsToMidnight } from "../../common/utils/date-formatter.util"; // 👈 분리한 시간 유틸 임포트
import { NewsNotFoundException } from "../../common/exceptions/news-not-found.exception"; // 👈 커스텀 에러 임포트

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

  async getDailyNewsTimeline(): Promise<AiNewsTimelineResponseDto> {
    this.logger.log(`🔄 [News Engine] 당일 한정 AI 뉴스 타임라인 픽업 개시`);
    try {
      const { data } = await firstValueFrom(this.httpService.get(`${this.newsServerUrl}/api/news`));

      const maskedItems: AiNewsItemDto[] = data.data.items.map((item: any) => ({
        ...item,
        aiOneLineSummary: item.aiOneLineSummary.replace(/%/g, ""),
        formattedComment: item.formattedComment.replace(/%/g, ""),
      }));

      const responseData: AiNewsTimelineResponseDto = {
        totalCount: maskedItems.length,
        items: maskedItems,
      };

      const ttl = getRemainingSecondsToMidnight();
      this.logger.log(`💾 [News Engine] 당일 캐시 만료 초 동기화 셋업: ${ttl}s`);

      return responseData;
    } catch (error) {
      this.logger.error(`🚨 [News Proxy Critical] 외부 타임라인 인프라 통신 장애`);
      throw error;
    }
  }

  async getDailyNewsDetail(newsId: number): Promise<AiNewsDetailResponseDto> {
    this.logger.log(`🔍 [News Engine] 뉴스 패킷 ID: ${newsId} 상세 리포트 추적`);
    try {
      const { data } = await firstValueFrom(this.httpService.get(`${this.newsServerUrl}/api/news/${newsId}`));

      const maskedSummaryPoints = data.data.aiSummaryPoints.map((point: string) => point.replace(/%/g, ""));

      return {
        ...data.data,
        aiSummaryPoints: maskedSummaryPoints,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new NewsNotFoundException(newsId);
      }
      throw error;
    }
  }
}
