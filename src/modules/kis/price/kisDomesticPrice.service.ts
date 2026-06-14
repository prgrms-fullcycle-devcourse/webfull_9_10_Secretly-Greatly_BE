import { Injectable, Logger, BadGatewayException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { CryptoService } from "../../../common/crypto/crypto.service";
import { KisAuthService } from "../kisAuth/kisAuth.service";
import { KisDomesticMultiPriceResponse, KisDomesticMultiPriceItem } from "./dto/kisDomesticPrice.dto";

// [국내주식] 시세분석 / 관심종목(멀티종목) 시세조회
const MULTI_PRICE_PATH = "/uapi/domestic-stock/v1/quotations/intstock-multprice";
const TR_ID_MULTI_PRICE = "FHKST11300006";
const MAX_SYMBOLS_PER_CALL = 30;

export interface SymbolInput {
  code: string; // 종목코드 (예: 005930)
  marketDivCode?: string; // J(KRX) 기본
}

@Injectable()
export class KisDomesticPriceService {
  private readonly logger = new Logger(KisDomesticPriceService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly auth: KisAuthService,
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /** 종목 배열을 30개씩 나눠 멀티시세 조회. output 배열을 합쳐서 반환 */
  async fetchMultiPrice(userId: string, symbols: SymbolInput[]): Promise<KisDomesticMultiPriceItem[]> {
    const token = await this.auth.getAccessToken(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.kisAppKeyEnc || !user?.kisAppSecretEnc) {
      throw new BadGatewayException("User KIS Key 조회 실패");
    }
    const appKey = this.crypto.decrypt(user.kisAppKeyEnc);
    const appSecret = this.crypto.decrypt(user.kisAppSecretEnc);
    const base = this.config.get<string>("KIS_BASE_URL");

    const results: KisDomesticMultiPriceItem[] = [];

    for (let i = 0; i < symbols.length; i += MAX_SYMBOLS_PER_CALL) {
      const chunk = symbols.slice(i, i + MAX_SYMBOLS_PER_CALL);
      const params = this.buildParams(chunk);

      const { data } = await firstValueFrom(
        this.http.get<KisDomesticMultiPriceResponse>(`${base}${MULTI_PRICE_PATH}`, {
          params,
          headers: {
            "content-type": "application/json; charset=utf-8",
            authorization: `Bearer ${token}`,
            appkey: appKey,
            appsecret: appSecret,
            tr_id: TR_ID_MULTI_PRICE,
            custtype: "P",
          },
        }),
      );

      if (data.rt_cd !== "0") {
        throw new BadGatewayException(`KIS 멀티시세 조회 오류 - ${data.msg1}`);
      }
      results.push(...data.output);

      // 청크가 여러 개면 호출 간 간격 (Rate Limit 마진)
      if (i + MAX_SYMBOLS_PER_CALL < symbols.length) {
        await this.sleep(150);
      }
    }

    return results;
  }

  /** FID_COND_MRKT_DIV_CODE_N / FID_INPUT_ISCD_N 쌍을 1~30까지 구성 */
  private buildParams(chunk: SymbolInput[]): Record<string, string> {
    const params: Record<string, string> = {};
    for (let n = 1; n <= MAX_SYMBOLS_PER_CALL; n++) {
      const item = chunk[n - 1];
      // 빈 슬롯은 빈 문자열로 채움 (전 파라미터 Required 표기 대응)
      params[`FID_COND_MRKT_DIV_CODE_${n}`] = item?.marketDivCode ?? "J";
      params[`FID_INPUT_ISCD_${n}`] = item?.code ?? "";
    }
    return params;
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
