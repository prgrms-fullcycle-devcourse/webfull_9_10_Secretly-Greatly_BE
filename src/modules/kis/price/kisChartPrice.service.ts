import { BadGatewayException, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { CryptoService } from "../../../common/crypto/crypto.service";
import { KisAuthService } from "../kisAuth/kisAuth.service";
import { CandleDto, KisDomesticMinuteChartResponse, KisOverseasMinuteChartResponse } from "./dto/kisChartPrice.dto";
import { EXCHANGE_TO_EXCD } from "./kisPrice.constant";

const DOMESTIC_MINUTE_CHART_PATH = "/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice";
const DOMESTIC_MINUTE_CHART_TR_ID = "FHKST03010230";

const OVERSEAS_MINUTE_CHART_PATH = "/uapi/overseas-price/v1/quotations/inquire-time-itemchartprice";
const OVERSEAS_MINUTE_CHART_TR_ID = "HHDFS76950200";

const CANDLE_INTERVAL = "1m";
const CANDLE_CACHE_TTL = 60;

@Injectable()
export class KisChartPriceService {
  private readonly logger = new Logger(KisChartPriceService.name);

  constructor(
    @InjectRedis()
    private readonly redis: Redis,

    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly auth: KisAuthService,
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async fetchDomesticCandles(userId: string, code: string, limit: number): Promise<CandleDto[]> {
    const cacheKey = this.candleCacheKey("DOMESTIC", code, limit);
    const cached = await this.getCachedCandles(cacheKey);

    if (cached) {
      return cached;
    }

    const { token, appKey, appSecret, base } = await this.getKisAuthContext(userId);
    const now = new Date();

    const params = {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: code,
      FID_INPUT_DATE_1: this.formatYyyymmdd(now),
      FID_INPUT_HOUR_1: this.formatHhmmss(now),
      FID_PW_DATA_INCU_YN: "Y",
      FID_FAKE_TICK_INCU_YN: "N",
    };

    const { data } = await firstValueFrom(
      this.http.get<KisDomesticMinuteChartResponse>(`${base}${DOMESTIC_MINUTE_CHART_PATH}`, {
        params,
        headers: this.buildHeaders(token, appKey, appSecret, DOMESTIC_MINUTE_CHART_TR_ID),
      }),
    );

    if (data.rt_cd !== "0") {
      throw new BadGatewayException(`KIS 국내 1분봉 조회 오류 - ${data.msg1}`);
    }

    const candles = (data.output2 ?? [])
      .map((item) => ({
        time: this.yyyymmddhhmmssToEpochSeconds(item.stck_bsop_date, item.stck_cntg_hour),
        open: Number(item.stck_oprc),
        high: Number(item.stck_hgpr),
        low: Number(item.stck_lwpr),
        close: Number(item.stck_prpr),
        volume: Number(item.cntg_vol ?? 0),
      }))
      .sort((a, b) => a.time - b.time)
      .slice(-limit);

    await this.setCachedCandles(cacheKey, candles);

    return candles;
  }

  async fetchOverseasCandles(userId: string, code: string, exchange: string, limit: number): Promise<CandleDto[]> {
    const cacheKey = this.candleCacheKey(exchange, code, limit);
    const cached = await this.getCachedCandles(cacheKey);

    if (cached) {
      return cached;
    }

    const { token, appKey, appSecret, base } = await this.getKisAuthContext(userId);
    const excd = EXCHANGE_TO_EXCD[exchange as keyof typeof EXCHANGE_TO_EXCD];

    if (!excd) {
      this.logger.warn(`지원하지 않는 해외 거래소입니다. exchange=${exchange}`);
      return [];
    }

    const params = {
      AUTH: "",
      EXCD: excd,
      SYMB: code,
      NMIN: "1",
      PINC: "1",
      NEXT: "",
      NREC: String(Math.min(limit, 120)),
      FILL: "",
      KEYB: "",
    };

    const { data } = await firstValueFrom(
      this.http.get<KisOverseasMinuteChartResponse>(`${base}${OVERSEAS_MINUTE_CHART_PATH}`, {
        params,
        headers: this.buildHeaders(token, appKey, appSecret, OVERSEAS_MINUTE_CHART_TR_ID),
      }),
    );

    if (data.rt_cd !== "0") {
      throw new BadGatewayException(`KIS 해외 1분봉 조회 오류 - ${data.msg1}`);
    }

    const candles = (data.output2 ?? [])
      .map((item) => ({
        time: this.yyyymmddhhmmssToEpochSeconds(item.xymd, item.xhms),
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.last),
        volume: Number(item.evol ?? 0),
      }))
      .sort((a, b) => a.time - b.time)
      .slice(-limit);

    await this.setCachedCandles(cacheKey, candles);

    return candles;
  }

  private async getKisAuthContext(userId: string) {
    const token = await this.auth.getAccessToken(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.kisAppKeyEnc || !user?.kisAppSecretEnc) {
      throw new ForbiddenException("KIS 연동이 필요합니다.");
    }

    return {
      token,
      appKey: this.crypto.decrypt(user.kisAppKeyEnc),
      appSecret: this.crypto.decrypt(user.kisAppSecretEnc),
      base: this.config.get<string>("KIS_BASE_URL"),
    };
  }

  private buildHeaders(token: string, appKey: string, appSecret: string, trId: string) {
    return {
      "content-type": "application/json; charset=utf-8",
      authorization: `Bearer ${token}`,
      appkey: appKey,
      appsecret: appSecret,
      tr_id: trId,
      custtype: "P",
    };
  }

  private formatYyyymmdd(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  }

  private formatHhmmss(date: Date) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${hh}${mm}${ss}`;
  }

  private yyyymmddhhmmssToEpochSeconds(dateValue: string, timeValue: string) {
    const yyyy = Number(dateValue.slice(0, 4));
    const mm = Number(dateValue.slice(4, 6));
    const dd = Number(dateValue.slice(6, 8));

    const hh = Number(timeValue.slice(0, 2));
    const mi = Number(timeValue.slice(2, 4));
    const ss = Number(timeValue.slice(4, 6));

    return Math.floor(Date.UTC(yyyy, mm - 1, dd, hh, mi, ss) / 1000);
  }

  private candleCacheKey(market: string, code: string, limit: number) {
    return `kis:candles:${market}:${code}:${CANDLE_INTERVAL}:${limit}`;
  }

  private async getCachedCandles(cacheKey: string): Promise<CandleDto[] | null> {
    try {
      const cached = await this.redis.get(cacheKey);

      if (!cached) {
        this.logger.log(`[CANDLE CACHE MISS] ${cacheKey}`);
        return null;
      }

      this.logger.log(`[CANDLE CACHE HIT] ${cacheKey}`);
      return JSON.parse(cached) as CandleDto[];
    } catch (e) {
      this.logger.warn(`[CANDLE CACHE READ ERROR] ${cacheKey}: ${(e as Error).message}`);
      return null;
    }
  }

  private async setCachedCandles(cacheKey: string, candles: CandleDto[]): Promise<void> {
    try {
      await this.redis.set(cacheKey, JSON.stringify(candles), "EX", CANDLE_CACHE_TTL);
    } catch (e) {
      this.logger.warn(`[CANDLE CACHE WRITE ERROR] ${cacheKey}: ${(e as Error).message}`);
    }
  }
}
