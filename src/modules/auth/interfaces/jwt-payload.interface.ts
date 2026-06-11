export interface JwtPayload {
  sub: string;
  email?: string | null;
  nickname: string;
  isAnonymous: boolean;
  type?: "member" | "anonymous";
}
