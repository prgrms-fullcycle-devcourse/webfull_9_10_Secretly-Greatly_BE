import { IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterKisCredentialRequestDto {
  @ApiProperty({
    description: "한국투자증권 앱 키",
    example: "PSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  })
  @IsString()
  @Length(36, 36, { message: "appKey는 36자여야 합니다." })
  appKey: string;

  @ApiProperty({
    description: "한국투자증권 앱 시크릿",
    example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  })
  @IsString()
  @Length(180, 180, { message: "appSecret은 180자여야 합니다." })
  appSecret: string;
}
