import { HttpException, HttpStatus } from "@nestjs/common";

export class CustomBusinessException extends HttpException {
  constructor(message: string, errorName: string, status: HttpStatus) {
    super(message, status);

    this.name = errorName;
  }
}
