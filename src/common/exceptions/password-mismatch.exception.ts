import { HttpStatus } from "@nestjs/common";
import { CustomBusinessException } from "./custom-business.exception";

export class PasswordMismatchException extends CustomBusinessException {
  constructor() {
    super("비밀번호 확인이 일치하지 않습니다.", "PasswordMismatchException", HttpStatus.BAD_REQUEST);
  }
}
