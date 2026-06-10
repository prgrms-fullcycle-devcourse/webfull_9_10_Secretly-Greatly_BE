import {
  Logger,
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { CryptoService } from "../../../common/crypto/crypto.service";
import { KisCredentialStatusResponseDto } from "./dto/res/kisCredentialStatus.response.dto";
import { KisAuthService } from "../kisAuth/kisAuth.service";

@Injectable()
export class KisCredentialService {
  private readonly logger = new Logger(KisCredentialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly kisAuthService: KisAuthService,
  ) {}

  /** 유저의 KIS 키 등록 상태 조회 */
  async getStatus(userId: string): Promise<KisCredentialStatusResponseDto> {
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
      // TODO: Custom에러
      throw new ConflictException("이미 등록된 KIS API 키가 있습니다.");
    }

    // 암호화 및 저장
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        kisAppKeyEnc: this.crypto.encrypt(cred.appKey),
        kisAppSecretEnc: this.crypto.encrypt(cred.appSecret),
        kisCredentialRegisteredAt: new Date(),
      },
    });
    // 2) 저장한 키로 토큰 발급을 시도 → 유효성 검증 + 캐싱
    try {
      await this.kisAuthService.getAccessToken(userId); // ← 여기서 토큰 발급/캐싱
    } catch (e) {
      this.logger.warn(
        `KIS 키 검증 실패 (user=${userId}): ${(e as Error).message}`,
      );

      // 토큰 발급 실패 = 키가 유효하지 않음. 저장한 키를 롤백.
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          kisAppKeyEnc: null,
          kisAppSecretEnc: null,
          kisCredentialRegisteredAt: null,
        },
      });
      throw new UnprocessableEntityException(
        "유효하지 않은 KIS API 키입니다. 한투에서 발급받은 키를 확인해주세요.",
      );
    }

    return {
      registered: true,
      maskedAppKey: this.mask(cred.appKey),
      registeredAt:
        updatedUser.kisCredentialRegisteredAt?.toISOString() ??
        new Date().toISOString(),
    };
  }

  /** 앞 4자 + 뒤 4자만 노출 (예: "PSxa****9f2c") */
  private mask(value: string): string {
    if (value.length <= 8) return "****";
    return `${value.slice(0, 4)}****${value.slice(-4)}`;
  }
}
