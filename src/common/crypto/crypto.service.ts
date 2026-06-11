import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

@Injectable()
export class CryptoService {
  private readonly algorithm = "aes-256-gcm";
  private readonly key: Buffer; // 32바이트(256비트)

  constructor(private readonly config: ConfigService) {
    const secret = this.config.get<string>("ENCRYPTION_KEY");
    if (!secret) {
      throw new Error("ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.");
    }
    // hex 문자열을 Buffer로 변환: 64 hex 문자 = 32바이트
    this.key = Buffer.from(secret, "hex");
    if (this.key.length !== 32) {
      throw new Error("ENCRYPTION_KEY는 32바이트(64자리 hex)여야 합니다.");
    }
  }

  /**
   * 평문을 암호화한다.
   * 반환 형식: "iv:authTag:암호문" (각 부분 hex 인코딩)
   * - iv: 매 암호화마다 새로 생성하는 무작위 초기화 벡터
   * - authTag: GCM 무결성 검증 태그 (변조 감지용)
   */
  encrypt(plain: string): string {
    const iv = randomBytes(12); // GCM 권장 IV 길이 12바이트, 매번 새로 발급
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plain, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      iv.toString("hex"),
      authTag.toString("hex"),
      encrypted.toString("hex"),
    ].join(":");
  }

  /**
   * "iv:authTag:암호문" 형식의 문자열을 복호화한다.
   * 데이터가 변조됐으면 decipher.final()에서 예외가 발생한다.
   */
  decrypt(payload: string): string {
    const [ivHex, tagHex, dataHex] = payload.split(":");
    if (!ivHex || !tagHex || !dataHex) {
      throw new Error("복호화 대상 형식이 올바르지 않습니다.");
    }

    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(ivHex, "hex"),
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(), // 변조되었을 경우 throw
    ]);
    return decrypted.toString("utf8");
  }
}
