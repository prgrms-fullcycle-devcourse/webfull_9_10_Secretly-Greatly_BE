import { HttpException, HttpStatus } from "@nestjs/common";

export class AssetEntityNotFoundException extends HttpException {
  constructor(stockId: number) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        timestamp: new Date().toISOString(),
        path: "/api/stocks/watchlist",
        message: `존재하지 않거나 파기된 주식 자산 엔티티입니다. (요청 ID: ${stockId})`,
        error: "AssetEntityNotFoundException",
        data: null,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
