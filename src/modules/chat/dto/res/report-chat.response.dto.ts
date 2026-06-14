import { ApiProperty } from "@nestjs/swagger";

export class ReportChatResponseDto {
  @ApiProperty({
    example: "신고가 접수되었습니다.",
  })
  message: string;

  @ApiProperty({
    example: 3,
  })
  reportCount: number;

  @ApiProperty({
    example: false,
  })
  isHidden: boolean;
}
