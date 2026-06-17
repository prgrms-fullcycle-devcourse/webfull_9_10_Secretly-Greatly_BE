import { HttpException, HttpStatus } from "@nestjs/common";

export class AssetCodeNotFoundException extends HttpException {
  constructor(code: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        timestamp: new Date().toISOString(),
        message: `시스템 마스터 풀에 등록되지 않았거나 상장 폐지된 주식 코드입니다. (요청 Code: ${code})`,
        error: "AssetCodeNotFoundException",
        data: null,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
