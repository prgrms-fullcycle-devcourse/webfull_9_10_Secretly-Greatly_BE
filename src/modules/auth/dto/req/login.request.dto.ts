import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginRequestDto {
  @ApiProperty({
    example: "test@test.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "password123!",
  })
  @IsString()
  password: string;
}
