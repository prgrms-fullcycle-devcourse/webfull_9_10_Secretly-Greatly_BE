import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class PasswordResetRequestDto {
  @ApiProperty({ example: "nanehcoonsik@test.com", description: "임시 비밀번호를 수신할 사용자의 가입 이메일" })
  @IsEmail({}, { message: "올바른 이메일 형식이 아닙니다." })
  @IsNotEmpty({ message: "이메일은 필수 입력 항목입니다." })
  @IsString()
  email: string;
}
