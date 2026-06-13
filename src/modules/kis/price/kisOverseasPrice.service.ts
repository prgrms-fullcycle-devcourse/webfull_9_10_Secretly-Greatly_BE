import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { CryptoService } from "../../../common/crypto/crypto.service";
import { KisAuthService } from "../kisAuth/kisAuth.service";
import { KisOverseasMultiPriceResponse, KisOverseasMultiPriceItem } from "./dto/kisOverseasPrice.dto";
import { KIS_OVERSEAS_MULTI_PRICE, EXCHANGE_TO_EXCD, CHUNK_INTERVAL_MS } from "./kisPrice.constant";

const { PATH, TR_ID, MAX_SYMBOLS_PER_CALL } = KIS_OVERSEAS_MULTI_PRICE;

export interface OverseasSymbolInput {
  code: string; // 종목코드 (예: AAPL)
  exchange: string; // 우리 Exchange enum 값 (NASDAQ/NYSE)
}

@Injectable()
export class KisOverseasPriceService {
  private readonly logger = new Logger(KisOverseasPriceService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly auth: KisAuthService,
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /** 종목 배열을 10개씩 나눠 복수종목 시세 조회. output2 배열을 합쳐서 반환 */
  async fetchMultiPrice(userId: string, symbols: OverseasSymbolInput[]): Promise<KisOverseasMultiPriceItem[]> {
    const token = await this.auth.getAccessToken(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.kisAppKeyEnc || !user?.kisAppSecretEnc) {
      // KIS 키 없는 유저는 수집 대상 아님 — 폴러가 걸러주지만 방어적으로 빈 배열
      this.logger.warn(`user=${userId} KIS 키 없음 — 해외 시세 조회 건너뜀`);
      return [];
    }
    const appKey = this.crypto.decrypt(user.kisAppKeyEnc);
    const appSecret = this.crypto.decrypt(user.kisAppSecretEnc);
    const base = this.config.get<string>("KIS_BASE_URL");

    const results: KisOverseasMultiPriceItem[] = [];

    for (let i = 0; i < symbols.length; i += MAX_SYMBOLS_PER_CALL) {
      const chunk = symbols.slice(i, i + MAX_SYMBOLS_PER_CALL);
      const params = this.buildParams(chunk);

      try {
        const { data } = await firstValueFrom(
          this.http.get<KisOverseasMultiPriceResponse>(`${base}${PATH}`, {
            params,
            headers: {
              "content-type": "application/json; charset=utf-8",
              authorization: `Bearer ${token}`,
              appkey: appKey,
              appsecret: appSecret,
              tr_id: TR_ID,
              custtype: "P",
            },
          }),
        );

        if (data.rt_cd !== "0") {
          this.logger.warn(`user=${userId} 해외 시세 청크 실패 - ${data.msg1}`);
          continue;
        }
        results.push(...(data.output2 ?? []));
      } catch (e) {
        this.logger.warn(`user=${userId} 해외 시세 청크 호출 실패: ${(e as Error).message}`);
        continue;
      }

      // 청크가 여러 개면 호출 간 간격 (Rate Limit 마진)
      if (i + MAX_SYMBOLS_PER_CALL < symbols.length) {
        await this.sleep(CHUNK_INTERVAL_MS);
      }
    }

    return results;
  }

  /**
   * AUTH(공백 필수) + NREC + EXCD_01~10 / SYMB_01~10 구성.
   * NREC 개수만큼만 채우고 나머지 슬롯은 빈 문자열.
   */
  private buildParams(chunk: OverseasSymbolInput[]): Record<string, string> {
    const params: Record<string, string> = {
      AUTH: "", // 사용자권한정보
      NREC: String(chunk.length), // 종목요청개수 (최대 10)
    };
    for (let n = 1; n <= MAX_SYMBOLS_PER_CALL; n++) {
      const item = chunk[n - 1];
      const idx = String(n).padStart(2, "0"); // EXCD_01 ~ EXCD_10
      params[`EXCD_${idx}`] = item ? (EXCHANGE_TO_EXCD[item.exchange] ?? "") : "";
      params[`SYMB_${idx}`] = item ? item.code : "";
    }
    return params;
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
