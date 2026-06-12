import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class ReportChatRequestDto {
  @ApiPropertyOptional({
    example: "욕설 및 비방",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
