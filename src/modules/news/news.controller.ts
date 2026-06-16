import { Controller, Get, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiExtraModels } from "@nestjs/swagger";
import { NewsService } from "./news.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CustomResponse } from "../../common/responses/custom.response";
import { NEWS_SWAGGER } from "./swagger/news.swagger";
import { AiNewsTimelineResponseDto } from "./dto/res/ai-news-timeline-response.dto";

@ApiTags("News (AI 분석 뉴스)")
@Controller("api/news")
@ApiExtraModels(AiNewsTimelineResponseDto)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: NEWS_SWAGGER.findAll.summary, description: NEWS_SWAGGER.findAll.description })
  @ApiResponse(NEWS_SWAGGER.findAll.ok)
  async getTimeline(): Promise<CustomResponse<AiNewsTimelineResponseDto>> {
    const data = await this.newsService.getDailyNewsTimeline();

    return CustomResponse.success(data, NEWS_SWAGGER.findAll.ok.description);
  }
}
