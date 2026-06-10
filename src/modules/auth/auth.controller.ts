import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
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
import { LoginRequestDto } from "./dto/req/login.request.dto";
import { SignupRequestDto } from "./dto/req/signup.request.dto";
import { SignUpResponseDto } from "./dto/res/signup.response.dto";
import { CustomResponse } from "../../common/responses/custom.response";
import { PasswordMismatchException } from "../../common/exceptions/password-mismatch.exception";
import {
  SIGNUP_API_RESPONSE,
  SIGNUP_DUPLICATE_EMAIL_API_RESPONSE,
  SIGNUP_MISMATCH_API_RESPONSE,
  SIGNUP_VALIDATION_API_RESPONSE,
} from "./swagger/signup.swagger";
import { LoginResponseDto } from "./dto/res/login.response.dto";
import { AnonymousResponseDto } from "./dto/res/anonymous-response.dto";

@ApiTags("Auth")
@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @ApiOperation({ summary: "회원가입", description: "유저 등록" })
  @ApiBody({ type: SignupRequestDto })
  @ApiResponse(SIGNUP_API_RESPONSE)
  @ApiResponse(SIGNUP_VALIDATION_API_RESPONSE)
  @ApiResponse(SIGNUP_MISMATCH_API_RESPONSE)
  @ApiResponse(SIGNUP_DUPLICATE_EMAIL_API_RESPONSE)
  async signUp(
    @Body() body: SignupRequestDto,
  ): Promise<CustomResponse<SignUpResponseDto>> {
    if (body.password !== body.checkPassword) {
      throw new PasswordMismatchException();
    }

    const signUpResult = await this.authService.signup(body);

    return CustomResponse.success(signUpResult, "회원가입이 완료되었습니다.");
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
  async login(
    @Body() loginRequestDto: LoginRequestDto,
    @Req() req: Request,
  ): Promise<CustomResponse<LoginResponseDto>> {
    const loginResult = await this.authService.login(loginRequestDto, req.url);

    return CustomResponse.success(loginResult, "로그인에 성공했습니다.");
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
    @Res({ passthrough: true }) res: Response, // NestJS 인터셉터 흐름을 방해하지 않도록 passthrough 옵션 필수 적용
  ): Promise<CustomResponse<AnonymousResponseDto>> {
    const { accessToken, ...responseData } =
      await this.authService.createAnonymousSession();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    return CustomResponse.success(
      responseData,
      "익명 임시 세션 발급이 완료되었습니다.",
    );
  }
}
