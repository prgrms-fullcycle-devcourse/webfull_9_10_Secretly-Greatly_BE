import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginRequestDto } from "./dto/req/login.request.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

import {
  ME_API_DESCRIPTION,
  ME_API_RESPONSE,
  ME_NOT_FOUND_API_RESPONSE,
  ME_UNAUTHORIZED_API_RESPONSE,
} from "./swagger/me.swagger";

import {
  LOGIN_API_DESCRIPTION,
  LOGIN_API_RESPONSE,
  LOGIN_INTERNAL_SERVER_ERROR_API_RESPONSE,
  LOGIN_UNAUTHORIZED_API_RESPONSE,
} from "./swagger/login.swagger";

import {
  ANONYMOUS_API_DESCRIPTION,
  ANONYMOUS_API_RESPONSE,
  ANONYMOUS_INTERNAL_SERVER_ERROR_API_RESPONSE,
} from "./swagger/anonymous.swagger";

@ApiTags("Auth")
@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "현재 로그인 사용자 조회",
    description: ME_API_DESCRIPTION,
  })
  @ApiBearerAuth()
  @ApiCookieAuth("accessToken")
  @ApiResponse(ME_API_RESPONSE)
  @ApiResponse(ME_UNAUTHORIZED_API_RESPONSE)
  @ApiResponse(ME_NOT_FOUND_API_RESPONSE)
  async getMe(@Req() req: Request) {
    return this.authService.getMe(req.user as JwtPayload, req.url);
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({
    summary: "로그인",
    description: LOGIN_API_DESCRIPTION,
  })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse(LOGIN_API_RESPONSE)
  @ApiResponse(LOGIN_UNAUTHORIZED_API_RESPONSE)
  @ApiResponse(LOGIN_INTERNAL_SERVER_ERROR_API_RESPONSE)
  login(@Body() loginRequestDto: LoginRequestDto, @Req() req: Request) {
    return this.authService.login(loginRequestDto, req.url);
  }

  @Post("anonymous")
  @HttpCode(201)
  @ApiOperation({
    summary: "익명 임시 세션 발급",
    description: ANONYMOUS_API_DESCRIPTION,
  })
  @ApiCookieAuth("accessToken")
  @ApiResponse(ANONYMOUS_API_RESPONSE)
  @ApiResponse(ANONYMOUS_INTERNAL_SERVER_ERROR_API_RESPONSE)
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

    return {
      ...result,
      data: {
        userId: result.data.userId,
        anonymousToken: result.data.anonymousToken,
      },
    };
  }
}
