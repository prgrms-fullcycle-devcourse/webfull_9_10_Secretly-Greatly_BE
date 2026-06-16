import { HttpException, HttpStatus } from "@nestjs/common";

export class NewsNotFoundException extends HttpException {
  constructor(newsId: number) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        timestamp: new Date().toISOString(),
        path: `/api/news/${newsId}`,
        message: "존재하지 않거나 당일 만료 처리되어 파기된 인프라 로그 패킷입니다.",
        error: "NewsNotFoundException",
        data: null,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
