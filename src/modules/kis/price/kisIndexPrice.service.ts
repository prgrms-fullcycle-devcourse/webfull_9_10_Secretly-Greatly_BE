import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { CryptoService } from "../../../common/crypto/crypto.service";
import { KisAuthService } from "../kisAuth/kisAuth.service";
import { KisDomesticIndexResponse, KisOverseasIndexResponse, IndexQuote } from "./dto/kisIndexPrice.dto";
import {
  KIS_DOMESTIC_INDEX,
  KIS_OVERSEAS_INDEX,
  OVERSEAS_INDEX_QUERY,
  TRACKED_INDICES,
  IndexDef,
} from "./kisIndexPrice.constant";

/**
 * 지수·환율 시세 조회
 *  - 국내(코스피/코스닥): 국내업종 현재지수 API (단건)
 *  - 해외(나스닥/나스닥100/S&P500/환율): 해외지수분봉조회 API (현재값)
 */
@Injectable()
export class KisIndexPriceService {
  private readonly logger = new Logger(KisIndexPriceService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly auth: KisAuthService,
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /** 모든 추적 지표를 조회해 정규화된 IndexQuote[] 반환. 실패한 지표는 건너뜀(부분 성공 허용) */
  async fetchAll(userId: string): Promise<IndexQuote[]> {
    const creds = await this.resolveCreds(userId);
    if (!creds) return [];
    const { token, appKey, appSecret, base } = creds;

    const capturedAt = new Date();
    const results: IndexQuote[] = [];

    // 지표별 1회 호출 (지수 조회는 복수 묶음 미지원)
    for (const def of TRACKED_INDICES) {
      try {
        const quote =
          def.source === "DOMESTIC"
            ? await this.fetchDomestic(def, { token, appKey, appSecret, base }, capturedAt)
            : await this.fetchOverseas(def, { token, appKey, appSecret, base }, capturedAt);
        if (quote) results.push(quote);
      } catch (e) {
        // 한 지표 실패가 전체를 막지 않도록 격리
        const detail = (e as any)?.response?.data;
        this.logger.warn(
          `지표 조회 실패 user=${userId} code=${def.code}: ${(e as Error).message}  | ${JSON.stringify(detail ?? {})}`,
        );
      }
    }
    return results;
  }

  // ── 국내업종 현재지수 ──────────────────────────────────────────────
  private async fetchDomestic(def: IndexDef, c: Creds, capturedAt: Date): Promise<IndexQuote | null> {
    const { PATH, TR_ID } = KIS_DOMESTIC_INDEX;
    const { data } = await firstValueFrom(
      this.http.get<KisDomesticIndexResponse>(`${c.base}${PATH}`, {
        params: {
          FID_COND_MRKT_DIV_CODE: def.mrktDiv,
          FID_INPUT_ISCD: def.inputCode,
        },
        headers: this.headers(c, TR_ID),
      }),
    );
    if (data.rt_cd !== "0" || !data.output) {
      this.logger.warn(`국내지수 응답 비정상 code=${def.code} rt_cd=${data.rt_cd} msg=${data.msg1}`);
      return null;
    }
    const o = data.output;
    return {
      code: def.code,
      value: Number(o.bstp_nmix_prpr),
      change: Number(o.bstp_nmix_prdy_ctrt || "0"),
      capturedAt,
    };
  }

  // ── 해외지수분봉조회 ──────────────────────────────────────────────
  private async fetchOverseas(def: IndexDef, c: Creds, capturedAt: Date): Promise<IndexQuote | null> {
    const { PATH, TR_ID } = KIS_OVERSEAS_INDEX;
    const { data } = await firstValueFrom(
      this.http.get<KisOverseasIndexResponse>(`${c.base}${PATH}`, {
        params: {
          FID_COND_MRKT_DIV_CODE: def.mrktDiv,
          FID_INPUT_ISCD: def.inputCode,
          ...OVERSEAS_INDEX_QUERY,
        },
        headers: this.headers(c, TR_ID),
      }),
    );
    if (data.rt_cd !== "0" || !data.output1) {
      this.logger.warn(`해외지수 응답 비정상 code=${def.code} rt_cd=${data.rt_cd} msg=${data.msg1}`);
      return null;
    }
    if (def.code === "USDKRW") {
      this.logger.debug(`환율 응답: ${JSON.stringify(data)}`);
    }
    const o = data.output1;
    return {
      code: def.code,
      value: Number(o.ovrs_nmix_prpr),
      change: Number(o.prdy_ctrt || "0"),
      capturedAt,
    };
  }

  // ── 공통: 인증/헤더 ───────────────────────────────────────────────
  private async resolveCreds(userId: string): Promise<Creds | null> {
    const token = await this.auth.getAccessToken(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.kisAppKeyEnc || !user?.kisAppSecretEnc) {
      throw new BadRequestException(`KIS 키가 등록되지 않은 유저입니다 (user=${userId})`);
    }
    return {
      token,
      appKey: this.crypto.decrypt(user.kisAppKeyEnc),
      appSecret: this.crypto.decrypt(user.kisAppSecretEnc),
      base: this.config.get<string>("KIS_BASE_URL") ?? "",
    };
  }

  private headers(c: Creds, trId: string) {
    return {
      "content-type": "application/json; charset=utf-8",
      authorization: `Bearer ${c.token}`,
      appkey: c.appKey,
      appsecret: c.appSecret,
      tr_id: trId,
      custtype: "P",
    };
  }
}

interface Creds {
  token: string;
  appKey: string;
  appSecret: string;
  base: string;
}
