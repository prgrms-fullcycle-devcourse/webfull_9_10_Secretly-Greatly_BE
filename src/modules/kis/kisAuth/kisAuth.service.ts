import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { CryptoService } from "../../../common/crypto/crypto.service";
import { KisTokenResponseDto } from "./dto/kisTokenResponse.dto";
import {
  KIS_OAUTH,
  kisTokenKey,
  TOKEN_EXPIRE_MARGIN_SEC,
} from "./kisAuth.constant";

@Injectable()
export class KisAuthService {
  private readonly logger = new Logger(KisAuthService.name);
  private readonly inflight = new Map<string, Promise<string>>();

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async getAccessToken(userId: string): Promise<string> {
    const cached = await this.redis.get(kisTokenKey(userId));
    if (cached) return cached;

    const ongoing = this.inflight.get(userId);
    if (ongoing) return ongoing;

    const promise = this.issueToken(userId).finally(() => {
      this.inflight.delete(userId);
    });
    this.inflight.set(userId, promise);
    return promise;
  }

  private async issueToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.kisAppKeyEnc || !user?.kisAppSecretEnc) {
      throw new UnauthorizedException("KIS API 키가 등록되지 않았습니다.");
    }
    const appKey = this.crypto.decrypt(user.kisAppKeyEnc);
    const appSecret = this.crypto.decrypt(user.kisAppSecretEnc);

    const base = this.config.get<string>("KIS_BASE_URL");
    const { data } = await firstValueFrom(
      this.http.post<KisTokenResponseDto>(
        `${base}${KIS_OAUTH.TOKEN_PATH}`,
        {
          grant_type: "client_credentials",
          appkey: appKey,
          appsecret: appSecret,
        },
        { headers: { "content-type": "application/json; charset=utf-8" } },
      ),
    );

    const ttl = Math.max(data.expires_in - TOKEN_EXPIRE_MARGIN_SEC, 60);
    await this.redis.set(kisTokenKey(userId), data.access_token, "EX", ttl);

    this.logger.log(`KIS 토큰 발급/캐싱 완료 (user=${userId}, ttl=${ttl}s)`);
    return data.access_token;
  }

  async invalidateToken(userId: string): Promise<void> {
    await this.redis.del(kisTokenKey(userId));
  }
}
