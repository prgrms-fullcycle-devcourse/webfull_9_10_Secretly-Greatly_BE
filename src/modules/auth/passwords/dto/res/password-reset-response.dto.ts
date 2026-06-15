import { ApiProperty } from "@nestjs/swagger";

export class PasswordResetResponseDto {
  @ApiProperty({ example: true, description: "임시 비밀번호 메일 발송 성공 여부" })
  mailSent: boolean;
}
