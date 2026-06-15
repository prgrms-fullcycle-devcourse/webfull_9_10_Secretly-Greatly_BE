import { Body, Controller, HttpCode, Post, Patch, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthPasswordsService } from "./auth-passwords.service";
import { CustomResponse } from "../../../common/responses/custom.response";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PasswordResetRequestDto } from "./dto/req/password-reset-request.dto";
import { ChangePasswordRequestDto } from "./dto/req/change-password.request.dto";
import { PasswordResetResponseDto } from "./dto/res/password-reset-response.dto";
import { PasswordUpdateResponseDto } from "./dto/res/password-update-response.dto";
import { PasswordMismatchException } from "../../../common/exceptions/password-mismatch.exception";
import {
  PASSWORD_CHANGE_INVALID_API_RESPONSE,
  PASSWORD_CHANGE_MISMATCH_API_RESPONSE,
  PASSWORD_CHANGE_SUCCESS_API_RESPONSE,
  PASSWORD_RESET_NOT_FOUND_API_RESPONSE,
  PASSWORD_RESET_SUCCESS_API_RESPONSE,
} from "../swagger/passwords.swagger";
import { AuthenticatedRequest } from "../interfaces/request.inerface";

@ApiTags("Auth Passwords")
@Controller("api/auth/passwords")
export class AuthPasswordsController {
  constructor(private readonly passwordsService: AuthPasswordsService) {}

  // 임시 비밀번호 발급 및 발송
  @Post("reset-request")
  @HttpCode(200)
  @ApiOperation({ summary: "임시 비밀번호 메일 발송 (비밀번호 찾기)" })
  @ApiResponse(PASSWORD_RESET_SUCCESS_API_RESPONSE)
  @ApiResponse(PASSWORD_RESET_NOT_FOUND_API_RESPONSE)
  async requestResetPassword(@Body() body: PasswordResetRequestDto): Promise<CustomResponse<PasswordResetResponseDto>> {
    const data = await this.passwordsService.sendTemporaryPassword(body.email);
    return CustomResponse.success(data, "등록된 이메일로 임시 비밀번호가 발송되었습니다. 메일함을 확인해주세요.");
  }

  // 비밀번호 최종 재설정 및 변경
  @Patch()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("accessToken")
  @ApiOperation({ summary: "비밀번호 최종 재설정 및 변경 (임시 로그인 후 또는 일반 변경용)" })
  @ApiResponse(PASSWORD_CHANGE_SUCCESS_API_RESPONSE)
  @ApiResponse(PASSWORD_CHANGE_MISMATCH_API_RESPONSE)
  @ApiResponse(PASSWORD_CHANGE_INVALID_API_RESPONSE)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: ChangePasswordRequestDto,
  ): Promise<CustomResponse<PasswordUpdateResponseDto>> {
    if (body.newPassword !== body.checkNewPassword) {
      throw new PasswordMismatchException();
    }

    const data = await this.passwordsService.changePassword(req.user.sub, body);
    return CustomResponse.success(data, "비밀번호 재설정이 완료되었습니다. 새 비밀번호로 다시 로그인해주세요.");
  }
}
