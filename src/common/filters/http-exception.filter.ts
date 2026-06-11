import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { CustomBusinessException } from "../exceptions/custom-business.exception";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // 1. 상태 코드 추출 (HttpException이 아니면 기본값 500 세팅)
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 2. 메시지 및 페이로드 추출
    const payload =
      exception instanceof HttpException ? exception.getResponse() : null;
    const rawMessage =
      typeof payload === "string" ? payload : (payload as any)?.message;

    let message = Array.isArray(rawMessage)
      ? rawMessage[0]
      : (rawMessage ?? exception.message);
    if (exception.name?.includes("PrismaClient") && message) {
      if (message.includes("The table")) {
        const tableIndex = message.indexOf("The table");
        message = message.substring(tableIndex).replace(/\n/g, " ").trim();
      } else {
        message = "데이터베이스 연동 중 예외가 발생했습니다.";
      }
    }

    // 3. 에러 이름 매핑
    let errorName = exception.name;
    if (exception instanceof CustomBusinessException) {
      errorName = exception.name;
    } else if (errorName === "BadRequestException") {
      errorName = "ValidationException";
    }

    // 4. 응답 조립
    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: message ?? "서버 내부 인프라에 오류가 발생했습니다.",
      data: null,
      error: errorName,
    });
  }
}
