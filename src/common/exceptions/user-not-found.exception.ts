import { HttpException, HttpStatus } from "@nestjs/common";

export class UserNotFoundException extends HttpException {
  constructor(message: string = "시스템에 등록되지 않은 이메일 주소입니다.") {
    super(message, HttpStatus.NOT_FOUND);
  }
}
