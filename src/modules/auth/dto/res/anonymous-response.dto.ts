import { ApiProperty } from "@nestjs/swagger";

export class AnonymousResponseDto {
  @ApiProperty({
    example: "b4b92b67-d112-4293-8cfb-66554400aaaa",
    description: "임시로 생성된 익명 유저의 고유 식별자 (Prisma UUID)",
  })
  userId: string;

  @ApiProperty({
    example: "e7c227f4-d539-4d5e-9ca9-b4552460da8f",
    description: "클라이언트 세션 식별 및 추적용 익명 UUID 토큰",
  })
  anonymousToken: string;
}
