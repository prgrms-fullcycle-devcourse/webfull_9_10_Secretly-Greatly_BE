import { IsString, Length } from "class-validator";

export class RegisterKisCredentialDto {
  @IsString()
  @Length(36, 36, { message: "appKey는 36자여야 합니다." })
  appKey: string;

  @IsString()
  @Length(180, 180, { message: "appSecret은 180자여야 합니다." })
  appSecret: string;
}
