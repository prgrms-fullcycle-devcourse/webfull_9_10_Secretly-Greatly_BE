import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req.url);
  }

  @Post("anonymous")
  @HttpCode(201)
  async createAnonymousSession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.createAnonymousSession(req.url);

    res.cookie("accessToken", result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    // 애리: accessToken 선언 후 미사용으로 오류가 떠서, 우선 주석처리 해두었습니다. 향후 삭제해주세요.
    // const { accessToken, ...dataWithoutAccessToken } = result.data;
    const { ...dataWithoutAccessToken } = result.data;

    return {
      ...result,
      data: dataWithoutAccessToken,
    };
  }
}
