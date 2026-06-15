import { HttpException, HttpStatus } from "@nestjs/common";

export class PositionNotFoundException extends HttpException {
  constructor(code: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `해당 종목(${code})에 대한 보유 자산(Position) 데이터가 존재하지 않아 시뮬레이션 기록을 저장할 수 없습니다.`,
        error: "PositionNotFoundException",
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
