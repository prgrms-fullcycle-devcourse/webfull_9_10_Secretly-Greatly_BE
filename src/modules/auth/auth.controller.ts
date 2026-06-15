import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { PasswordMismatchException } from "../../common/exceptions/password-mismatch.exception";
import { CustomResponse } from "../../common/responses/custom.response";
import { AuthService } from "./auth.service";
import { LoginRequestDto } from "./dto/req/login.request.dto";
import { SignupRequestDto } from "./dto/req/signup.request.dto";
import { AnonymousResponseDto } from "./dto/res/anonymous-response.dto";
import { LoginResponseDto } from "./dto/res/login.response.dto";
import { SignUpResponseDto } from "./dto/res/signup.response.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import {
  ANONYMOUS_API_DESCRIPTION,
  ANONYMOUS_API_RESPONSE,
  ANONYMOUS_INTERNAL_SERVER_ERROR_API_RESPONSE,
} from "./swagger/anonymous.swagger";
import {
  LOGIN_API_DESCRIPTION,
  LOGIN_API_RESPONSE,
  LOGIN_INTERNAL_SERVER_ERROR_API_RESPONSE,
  LOGIN_UNAUTHORIZED_API_RESPONSE,
} from "./swagger/login.swagger";
import {
  ME_API_DESCRIPTION,
  ME_API_RESPONSE,
  ME_NOT_FOUND_API_RESPONSE,
  ME_UNAUTHORIZED_API_RESPONSE,
} from "./swagger/me.swagger";
import {
  SIGNUP_API_RESPONSE,
  SIGNUP_DUPLICATE_EMAIL_API_RESPONSE,
  SIGNUP_MISMATCH_API_RESPONSE,
  SIGNUP_VALIDATION_API_RESPONSE,
} from "./swagger/signup.swagger";
import { AuthenticatedRequest } from "./interfaces/request.inerface";

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
  async signUp(@Body() body: SignupRequestDto): Promise<CustomResponse<SignUpResponseDto>> {
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
  async login(@Body() loginRequestDto: LoginRequestDto): Promise<CustomResponse<LoginResponseDto>> {
    const loginResult = await this.authService.login(loginRequestDto);

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
    @Res({ passthrough: true }) res: Response,
  ): Promise<CustomResponse<AnonymousResponseDto>> {
    const { accessToken, ...responseData } = await this.authService.createAnonymousSession();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return CustomResponse.success(responseData, "익명 임시 세션 발급이 완료되었습니다.");
  }

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
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user, req.url);
  }
}
