import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { MailerService } from "@nestjs-modules/mailer";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { PasswordResetResponseDto } from "./dto/res/password-reset-response.dto";
import { ChangePasswordRequestDto } from "./dto/req/change-password.request.dto";
import { PasswordUpdateResponseDto } from "./dto/res/password-update-response.dto";
import { UserNotFoundException } from "../../../common/exceptions/user-not-found.exception";
import { InvalidPasswordException } from "../../../common/exceptions/invalid-password.exception";

@Injectable()
export class AuthPasswordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  // 임시 비밀번호 발송
  async sendTemporaryPassword(email: string): Promise<PasswordResetResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UserNotFoundException();
    }

    const originalPassword = user.password;

    // 임시 암호 알파벳 난수
    const tempPassword = randomBytes(4).toString("hex") + "1!";
    const saltRounds = 10;
    const hashedTempPassword = await bcrypt.hash(tempPassword, saltRounds);

    await this.prisma.user.update({
      where: { email },
      data: { password: hashedTempPassword },
    });

    // SMTP 외부 망 발송 시도
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: "[Secretly-Greatly] 임시 비밀번호 발급",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #2d3748;">임시 비밀번호 발급</h3>
            <p style="color: #4a5568;">로그인 후 반드시 환경설정에서 비밀번호를 다시 수정해 주세요.</p>
            <div style="background: #f7fafc; padding: 15px; border-radius: 6px; text-align: center; font-size: 22px; font-weight: bold; color: #e53e3e; letter-spacing: 1px;">
              ${tempPassword}
            </div>
          </div>
        `,
      });
    } catch {
      await this.prisma.user.update({
        where: { email },
        data: { password: originalPassword },
      });
      throw new InternalServerErrorException("메일 전송 장애로 비밀번호를 발급하지 못했습니다.");
    }

    return { mailSent: true };
  }

  // 비밀번호 최종 변경
  async changePassword(userId: string, dto: ChangePasswordRequestDto): Promise<PasswordUpdateResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UserNotFoundException();
    }

    const isPasswordMatched = await bcrypt.compare(dto.currentPassword, user.password || "");
    if (!isPasswordMatched) {
      throw new InvalidPasswordException();
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      },
    });

    return { passwordUpdated: true };
  }
}
