import { HttpStatus } from "@nestjs/common";
import { CustomBusinessException } from "./custom-business.exception";

export class DuplicateEmailException extends CustomBusinessException {
  constructor() {
    super(
      "이미 사용 중인 이메일입니다.",
      "DuplicateEmailException",
      HttpStatus.CONFLICT,
    );
  }
}
