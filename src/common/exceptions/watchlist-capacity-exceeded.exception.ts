import { HttpException, HttpStatus } from "@nestjs/common";

export class WatchlistCapacityExceededException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: new Date().toISOString(),
        path: "/api/stocks/watchlist",
        message: "종목 즐겨찾기는 최대 20개까지 가능합니다.",
        error: "WatchlistCapacityExceededException",
        data: null,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
