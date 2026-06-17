import { Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    // 토큰 없으면 비로그인으로 통과
    if (!token) return null;

    // 토큰 있는데 검증 실패 → 401
    if (err || !user) {
      throw err || new UnauthorizedException("유효하지 않은 인증 정보입니다.");
    }
    return user;
  }

  // JwtStrategy 와 동일하게: Authorization Bearer 우선, 없으면 쿠키
  private extractToken(req: Request): string | null {
    const auth = req.headers?.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      return auth.slice(7);
    }
    return req.cookies?.accessToken ?? null;
  }
}
