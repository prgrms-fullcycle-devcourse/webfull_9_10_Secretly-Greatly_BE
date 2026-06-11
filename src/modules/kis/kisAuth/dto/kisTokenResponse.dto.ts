// KIS OAuth 토큰 발급 응답
export class KisTokenResponseDto {
  access_token: string;
  token_type: string;
  expires_in: number; // 초 (보통 86400)
}
