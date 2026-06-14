import { HttpException, HttpStatus } from "@nestjs/common";

export class InvalidPasswordException extends HttpException {
  constructor(message: string = "기존 비밀번호가 일치하지 않습니다.") {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
