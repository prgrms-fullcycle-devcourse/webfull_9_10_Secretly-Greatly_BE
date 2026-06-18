import { ApiProperty } from "@nestjs/swagger";

export class CandleItemDto {
  @ApiProperty({ example: 1778025600 })
  time: number;

  @ApiProperty({ example: 254000 })
  open: number;

  @ApiProperty({ example: 270000 })
  high: number;

  @ApiProperty({ example: 251000 })
  low: number;

  @ApiProperty({ example: 260000 })
  close: number;

  @ApiProperty({ example: 53097996 })
  volume: number;
}
