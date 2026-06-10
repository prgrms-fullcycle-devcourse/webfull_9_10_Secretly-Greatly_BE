import { ApiProperty } from "@nestjs/swagger";

export class SignUpResponseDto {
  @ApiProperty({ example: 4821, description: "가입된 사용자 Id" })
  userId: string;
}
