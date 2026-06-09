import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { CryptoService } from "../../../common/crypto/crypto.service";
import { KisCredentialStatusDto } from "./dto/kisCredentialStatus.dto";

@Injectable()
export class KisCredentialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /** 유저의 KIS 키 등록 상태 조회 */
  async getStatus(userId: string): Promise<KisCredentialStatusDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        kisAppKeyEnc: true,
        kisAppSecretEnc: true,
        kisCredentialRegisteredAt: true,
      },
    });

    if (!user?.kisAppKeyEnc || !user?.kisAppSecretEnc) {
      return { registered: false, maskedAppKey: null, registeredAt: null };
    }

    const appKey = this.crypto.decrypt(user.kisAppKeyEnc);
    return {
      registered: true,
      maskedAppKey: this.mask(appKey),
      registeredAt: user.kisCredentialRegisteredAt?.toISOString() ?? null,
    };
  }

  /** 유저의 KIS 키 등록 */
  async register(userId: string, cred: { appKey: string; appSecret: string }) {
    // 중복 등록 막기: 이미 있으면 409
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kisAppKeyEnc: true },
    });
    if (existing?.kisAppKeyEnc) {
      throw new ConflictException("이미 등록된 KIS API 키가 있습니다.");
    }

    // 암호화 및 저장
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        kisAppKeyEnc: this.crypto.encrypt(cred.appKey),
        kisAppSecretEnc: this.crypto.encrypt(cred.appSecret),
        kisCredentialRegisteredAt: new Date(),
      },
    });

    return {
      registered: true,
      maskedAppKey: this.mask(cred.appKey),
      registeredAt: new Date().toISOString(),
    };
  }

  /** 앞 4자 + 뒤 4자만 노출 (예: "PSxa****9f2c") */
  private mask(value: string): string {
    if (value.length <= 8) return "****";
    return `${value.slice(0, 4)}****${value.slice(-4)}`;
  }
}
