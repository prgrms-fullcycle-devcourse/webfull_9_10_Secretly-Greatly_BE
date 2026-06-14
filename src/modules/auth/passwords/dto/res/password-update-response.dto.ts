import { ApiProperty } from "@nestjs/swagger";

export class PasswordUpdateResponseDto {
  @ApiProperty({ example: true, description: "비밀번호 변경/갱신 성공 여부" })
  passwordUpdated: boolean;
}
