import { BadGatewayException, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { CryptoService } from "../../../common/crypto/crypto.service";
import { KisAuthService } from "../kisAuth/kisAuth.service";
import {
  CandleDto,
  KisDomesticChartResponse,
  KisDomesticMinuteChartResponse,
  KisOverseasChartResponse,
  KisOverseasMinuteChartResponse,
} from "./dto/kisChartPrice.dto";
import { EXCHANGE_TO_EXCD } from "./kisPrice.constant";

const DOMESTIC_MINUTE_CHART_PATH = "/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice";
const DOMESTIC_MINUTE_CHART_TR_ID = "FHKST03010230";

const OVERSEAS_MINUTE_CHART_PATH = "/uapi/overseas-price/v1/quotations/inquire-time-itemchartprice";
const OVERSEAS_MINUTE_CHART_TR_ID = "HHDFS76950200";

const DOMESTIC_DAILY_CHART_PATH = "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice";
const DOMESTIC_DAILY_CHART_TR_ID = "FHKST03010100";

const OVERSEAS_DAILY_CHART_PATH = "/uapi/overseas-price/v1/quotations/dailyprice";
const OVERSEAS_DAILY_CHART_TR_ID = "HHDFS76240000";

const DOMESTIC_INTERVAL_MAP = {
  "1d": "D",
  "1wk": "W",
  "1mo": "M",
} as const;

const OVERSEAS_INTERVAL_MAP = {
  "1d": "0",
  "1wk": "1",
  "1mo": "2",
} as const;

export type CandleInterval = "1m" | "1d" | "1wk" | "1mo";
type PeriodCandleInterval = Exclude<CandleInterval, "1m">;

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

  async fetchDomesticCandles(
    userId: string,
    code: string,
    interval: CandleInterval,
    limit: number,
  ): Promise<CandleDto[]> {
    if (interval === "1m") {
      return this.fetchDomesticMinuteCandles(userId, code, limit);
    }

    return this.fetchDomesticPeriodCandles(userId, code, interval, limit);
  }

  async fetchOverseasCandles(
    userId: string,
    code: string,
    exchange: string,
    interval: CandleInterval,
    limit: number,
  ): Promise<CandleDto[]> {
    if (interval === "1m") {
      return this.fetchOverseasMinuteCandles(userId, code, exchange, limit);
    }

    return this.fetchOverseasPeriodCandles(userId, code, exchange, interval, limit);
  }

  private async fetchDomesticMinuteCandles(userId: string, code: string, limit: number): Promise<CandleDto[]> {
    const cacheKey = this.candleCacheKey("DOMESTIC", code, "1m", limit);
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

    await this.setCachedCandles(cacheKey, "1m", candles);

    return candles;
  }

  private async fetchDomesticPeriodCandles(
    userId: string,
    code: string,
    interval: PeriodCandleInterval,
    limit: number,
  ): Promise<CandleDto[]> {
    const cacheKey = this.candleCacheKey("DOMESTIC", code, interval, limit);
    const cached = await this.getCachedCandles(cacheKey);

    if (cached) {
      return cached;
    }

    const { token, appKey, appSecret, base } = await this.getKisAuthContext(userId);
    const { from, to } = this.getDateRange(interval, limit);

    const params = {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: code,
      FID_INPUT_DATE_1: from,
      FID_INPUT_DATE_2: to,
      FID_PERIOD_DIV_CODE: DOMESTIC_INTERVAL_MAP[interval],
      FID_ORG_ADJ_PRC: "0",
    };

    const { data } = await firstValueFrom(
      this.http.get<KisDomesticChartResponse>(`${base}${DOMESTIC_DAILY_CHART_PATH}`, {
        params,
        headers: this.buildHeaders(token, appKey, appSecret, DOMESTIC_DAILY_CHART_TR_ID),
      }),
    );

    if (data.rt_cd !== "0") {
      throw new BadGatewayException(`KIS 국내 기간봉 조회 오류 - ${data.msg1}`);
    }

    const candles = (data.output2 ?? [])
      .map((item) => ({
        time: this.yyyymmddToEpochSeconds(item.stck_bsop_date),
        open: Number(item.stck_oprc),
        high: Number(item.stck_hgpr),
        low: Number(item.stck_lwpr),
        close: Number(item.stck_clpr),
        volume: Number(item.acml_vol ?? 0),
      }))
      .sort((a, b) => a.time - b.time)
      .slice(-limit);

    await this.setCachedCandles(cacheKey, interval, candles);

    return candles;
  }

  private async fetchOverseasMinuteCandles(
    userId: string,
    code: string,
    exchange: string,
    limit: number,
  ): Promise<CandleDto[]> {
    const cacheKey = this.candleCacheKey(exchange, code, "1m", limit);
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

    await this.setCachedCandles(cacheKey, "1m", candles);

    return candles;
  }

  private async fetchOverseasPeriodCandles(
    userId: string,
    code: string,
    exchange: string,
    interval: PeriodCandleInterval,
    limit: number,
  ): Promise<CandleDto[]> {
    const cacheKey = this.candleCacheKey(exchange, code, interval, limit);
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

    const { to } = this.getDateRange(interval, limit);

    const params = {
      AUTH: "",
      EXCD: excd,
      SYMB: code,
      GUBN: OVERSEAS_INTERVAL_MAP[interval],
      BYMD: to,
      MODP: "1",
    };

    const { data } = await firstValueFrom(
      this.http.get<KisOverseasChartResponse>(`${base}${OVERSEAS_DAILY_CHART_PATH}`, {
        params,
        headers: this.buildHeaders(token, appKey, appSecret, OVERSEAS_DAILY_CHART_TR_ID),
      }),
    );

    if (data.rt_cd !== "0") {
      throw new BadGatewayException(`KIS 해외 기간봉 조회 오류 - ${data.msg1}`);
    }

    const candles = (data.output2 ?? [])
      .map((item) => ({
        time: this.yyyymmddToEpochSeconds(item.xymd),
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.clos),
        volume: Number(item.tvol ?? 0),
      }))
      .sort((a, b) => a.time - b.time)
      .slice(-limit);

    await this.setCachedCandles(cacheKey, interval, candles);

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

  private getDateRange(interval: PeriodCandleInterval, limit: number) {
    const toDate = new Date();
    const fromDate = new Date(toDate);

    if (interval === "1d") {
      fromDate.setDate(fromDate.getDate() - Math.max(limit * 2, 30));
    }

    if (interval === "1wk") {
      fromDate.setDate(fromDate.getDate() - Math.max(limit * 7 * 2, 365));
    }

    if (interval === "1mo") {
      fromDate.setMonth(fromDate.getMonth() - Math.max(limit * 2, 24));
    }

    return {
      from: this.formatYyyymmdd(fromDate),
      to: this.formatYyyymmdd(toDate),
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

  private yyyymmddToEpochSeconds(value: string) {
    const yyyy = Number(value.slice(0, 4));
    const mm = Number(value.slice(4, 6));
    const dd = Number(value.slice(6, 8));

    return Math.floor(Date.UTC(yyyy, mm - 1, dd) / 1000);
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

  private candleCacheKey(market: string, code: string, interval: CandleInterval, limit: number) {
    return `kis:candles:${market}:${code}:${interval}:${limit}`;
  }

  private getCandleCacheTtl(interval: CandleInterval) {
    switch (interval) {
      case "1m":
        return 60;

      case "1d":
        return 60 * 5;

      case "1wk":
        return 60 * 30;

      case "1mo":
        return 60 * 60 * 6;
    }
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

  private async setCachedCandles(cacheKey: string, interval: CandleInterval, candles: CandleDto[]): Promise<void> {
    try {
      await this.redis.set(cacheKey, JSON.stringify(candles), "EX", this.getCandleCacheTtl(interval));
    } catch (e) {
      this.logger.warn(`[CANDLE CACHE WRITE ERROR] ${cacheKey}: ${(e as Error).message}`);
    }
  }
}
