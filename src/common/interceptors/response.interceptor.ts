import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Request, Response } from "express";
import { CustomResponse } from "../responses/custom.response";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((result: any) => {
        const isCustomResponse = result instanceof CustomResponse;

        const message = isCustomResponse
          ? result.message
          : res.statusCode === 201
            ? "생성이 완료되었습니다."
            : "요청이 성공적으로 처리되었습니다.";

        const data = isCustomResponse ? result.data : (result ?? null);

        return {
          statusCode: res.statusCode,
          timestamp: new Date().toISOString(),
          path: req.url,
          message: message,
          data: data,
          error: null,
        };
      }),
    );
  }
}
