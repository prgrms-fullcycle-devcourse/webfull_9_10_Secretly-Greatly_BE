import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class SignupRequestDto {
  @ApiProperty({
    example: "nanehcoonsik@test.com",
    description: "사용자 가입 이메일",
  })
  @IsEmail({}, { message: "올바른 이메일 형식이 아닙니다." })
  @IsNotEmpty({ message: "이메일은 필수 입력 항목입니다." })
  email: string;

  @ApiProperty({ example: "난이춘식", description: "선점할 고정 닉네임" })
  @IsString()
  @IsNotEmpty({ message: "닉네임은 필수 입력 항목입니다." })
  fixedNickname: string;

  @ApiProperty({
    example: "gitstock101@",
    description: "비밀번호 (8자~16자, 영문/숫자/특수문자 필수 혼합, DDoS 방어용 상한선 적용)",
  })
  @IsString()
  @Length(8, 16, {
    message: "비밀번호는 8자 이상 16자 이하의 영문, 숫자, 특수문자를 포함해야 합니다.",
  })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/, {
    message: "비밀번호는 영문, 숫자, 특수문자를 최소 1개씩 포함해야 합니다.",
  })
  password: string;

  @ApiProperty({ example: "gitstock101@", description: "비밀번호 확인 필드" })
  @IsString()
  @IsNotEmpty({ message: "비밀번호 확인은 필수 입력 항목입니다." })
  checkPassword: string;
}
