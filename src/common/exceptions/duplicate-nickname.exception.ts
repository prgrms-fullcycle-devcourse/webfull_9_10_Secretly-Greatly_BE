import { HttpStatus } from "@nestjs/common";
import { CustomBusinessException } from "./custom-business.exception";

export class DuplicateNicknameException extends CustomBusinessException {
  constructor() {
    super("이미 사용하고 있는 닉네임입니다.", "DuplicateNicknameException", HttpStatus.CONFLICT);
  }
}
