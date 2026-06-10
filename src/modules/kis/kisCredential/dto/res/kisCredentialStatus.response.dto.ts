import { ApiProperty } from "@nestjs/swagger";

export class KisCredentialStatusReponseDto {
  @ApiProperty({
    description: "KIS key 등록 여부",
    example: "true",
  })
  registered: boolean;

  @ApiProperty({
    description: "마스킹된 KIS App key",
    example: "AbCd****WxyZ",
  })
  maskedAppKey: string | null;

  @ApiProperty({
    description: "KIS key 등록 일자",
    example: "2026-06-10T01:30:18.678Z",
  })
  registeredAt: string | null;
}
