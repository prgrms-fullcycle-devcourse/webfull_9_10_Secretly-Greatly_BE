import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class ChangePasswordRequestDto {
  @ApiProperty({ example: "임시비밀번호1@", description: "현재 사용 중이거나 메일로 발급받은 임시 비밀번호" })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: "newchoonsik101!", description: "새로 변경할 암호 (8~16자 영문, 숫자, 특수문자 조합)" })
  @IsString()
  @IsNotEmpty()
  @Length(8, 16, { message: "비밀번호는 8자 이상 16자 이하로 입력해야 합니다." })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/, {
    message: "비밀번호는 영문, 숫자, 특수문자를 최소 1개 이상 포함해야 합니다.",
  })
  newPassword: string;

  @ApiProperty({ example: "newchoonsik101!", description: "새로운 비밀번호 확인용 재입력" })
  @IsString()
  @IsNotEmpty()
  checkNewPassword: string;
}
