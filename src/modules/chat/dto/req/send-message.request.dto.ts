import { IsNotEmpty, IsString } from "class-validator";

export class SendMessageRequestDto {
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
