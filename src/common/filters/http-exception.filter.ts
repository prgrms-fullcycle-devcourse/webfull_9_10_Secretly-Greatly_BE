import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const payload = exception.getResponse() as
      | string
      | { message?: string | string[]; error?: string };

    // ValidationPipe 메시지는 배열로 옴 -> 첫 메시지 사용
    const rawMessage = typeof payload === "string" ? payload : payload?.message;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: message ?? exception.message,
      error:
        exception.name === "BadRequestException"
          ? "ValidationException"
          : exception.name,
      data: null,
    });
  }
}
