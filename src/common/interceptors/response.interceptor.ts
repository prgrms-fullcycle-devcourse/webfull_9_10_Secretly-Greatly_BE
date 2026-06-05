import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Request, Response } from "express";

interface ServiceResult<T> {
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  ServiceResult<T>,
  unknown
> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((result: ServiceResult<T>) => ({
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
        path: req.url,
        message: result?.message ?? "OK",
        data: result?.data ?? null,
        error: null,
      })),
    );
  }
}
