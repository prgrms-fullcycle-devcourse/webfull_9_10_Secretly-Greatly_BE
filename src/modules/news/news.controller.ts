import { Controller, Get, Param, ParseIntPipe, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiExtraModels } from "@nestjs/swagger";
import { NewsService } from "./news.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CustomResponse } from "../../common/responses/custom.response";
import { AiNewsTimelineResponseDto } from "./dto/res/ai-news-response.dto";
import { AiNewsDetailResponseDto } from "./dto/res/ai-news-detail-response.dto";
import { NEWS_SWAGGER } from "./swagger/news.swagger";

@ApiTags("News (AI 분석 뉴스)")
@Controller("api/news")
@ApiExtraModels(AiNewsTimelineResponseDto, AiNewsDetailResponseDto)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: NEWS_SWAGGER.getTimeline.summary, description: NEWS_SWAGGER.getTimeline.description })
  @ApiResponse(NEWS_SWAGGER.getTimeline.success)
  async getTimeline(): Promise<CustomResponse<AiNewsTimelineResponseDto>> {
    const data = await this.newsService.getDailyNewsTimeline();
    return CustomResponse.success(data, NEWS_SWAGGER.getTimeline.success.description);
  }

  @Get("/:newsId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: NEWS_SWAGGER.getDetail.summary, description: NEWS_SWAGGER.getDetail.description })
  @ApiResponse(NEWS_SWAGGER.getDetail.success)
  @ApiResponse(NEWS_SWAGGER.getDetail.notFound)
  async getDetail(@Param("newsId", ParseIntPipe) newsId: number): Promise<CustomResponse<AiNewsDetailResponseDto>> {
    const data = await this.newsService.getDailyNewsDetail(newsId);
    return CustomResponse.success(data, NEWS_SWAGGER.getDetail.success.description);
  }
}
