import { IsString, Length } from "class-validator";

export class RegisterKisCredentialDto {
  // TODO(임시): JWT 전까지만. 인증 붙으면 제거하고 req.user.userId 사용
  @IsString()
  userId: string;

  @IsString()
  @Length(36, 36, { message: "appKey는 36자여야 합니다." })
  appKey: string;

  @IsString()
  @Length(180, 180, { message: "appSecret은 180자여야 합니다." })
  appSecret: string;
}
