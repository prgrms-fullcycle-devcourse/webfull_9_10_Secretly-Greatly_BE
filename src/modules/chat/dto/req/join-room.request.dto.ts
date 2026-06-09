import { IsNotEmpty, IsString } from "class-validator";

export class JoinRoomRequestDto {
  @IsString()
  @IsNotEmpty()
  ticker: string;
}
