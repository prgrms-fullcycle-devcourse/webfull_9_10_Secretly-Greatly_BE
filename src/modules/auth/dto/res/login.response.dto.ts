import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto {
  @ApiProperty({
    example: "uuid",
  })
  userId: string;

  @ApiProperty({
    example: "고정닉네임",
  })
  fixedNickname: string;
}
