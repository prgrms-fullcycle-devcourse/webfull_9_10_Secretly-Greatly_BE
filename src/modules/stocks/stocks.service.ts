import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GetStocksQueryDto } from "./dto/getStocksQuery.dto";
import { StockListDataDto, StockItemDto } from "./dto/stockItem.dto";
import { MARKET_TO_RESPONSE, RESPONSE_TO_MARKET } from "./stocks.constant";
import { QuoteService } from "../quote/quote.service";
import { CreateWatchlistRequestDto } from "./dto/req/create-watchlist-request.dto";
import { AssetEntityNotFoundException } from "../../common/exceptions/asset-entity-not-found.exception";
import { CreateWatchlistResponseDto } from "./dto/res/create-watchlist-response.dto";
import { WatchlistCapacityExceededException } from "../../common/exceptions/watchlist-capacity-exceeded.exception";

/**
 * 여러 종목 목록 + 최신 시세 조회 (종목 추가/검색 화면용)
 *
 * 시세(price/priceKrw/change/volume)는 QuoteService 가 캐시 우선 + DB 폴백으로 해결한다.
 * priceKrw: 원화 환산가 (미장은 KIS t_xprc, 국장은 price 와 동일). 환산값 없으면 null.
 */
@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quoteService: QuoteService,
  ) {}

  async findAll(userId: string, query: GetStocksQueryDto): Promise<StockListDataDto> {
    const { sort = "change", order = "desc", market, keyword } = query;

    // 종목 마스터 필터 (지표 제외, 시장/검색어)
    const stocks = await this.prisma.stock.findMany({
      where: {
        assetType: { not: "INDEX" },
        ...(market ? { market: RESPONSE_TO_MARKET[market] } : {}),
        ...this.buildKeywordWhere(keyword),
      },
    });
    if (stocks.length === 0) {
      return { sortedBy: sort, totalCount: 0, items: [] };
    }

    // userId 없으면(비로그인) 시세 조회 건너뜀 → 가격 전부 null
    const quotes = userId
      ? await this.quoteService.getLatestQuotes(
          userId,
          stocks.map((s) => s.id),
        )
      : new Map();

    // 응답 조립 (시세 없는 종목은 null)
    const items: StockItemDto[] = stocks.map((s) => {
      const q = quotes.get(s.id);
      return {
        stockId: s.id,
        code: s.code,
        name: s.name,
        price: q?.price ?? null,
        priceKrw: q?.priceKrw ?? null, // 원화 환산가 (미장 t_xprc / 국장 price / 없으면 null)
        change: q?.change ?? null,
        volume: q?.volume ?? null,
        market: MARKET_TO_RESPONSE[s.market],
      };
    });

    // 파생값(price/change/volume) 메모리 정렬
    // 시세가 없는(null) 종목은 항상 뒤로 보낸다(정렬 방향과 무관)
    const dir = order === "asc" ? 1 : -1;
    items.sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // a 를 뒤로
      if (bv == null) return -1; // b 를 뒤로
      return (av - bv) * dir;
    });

    return { sortedBy: sort, totalCount: items.length, items };
  }

  /**
   * 검색 조건: name 또는 code 부분 일치(대소문자 무시).
   * 향후 유사도 검색 전환 시 이 메서드만 교체.
   */
  private buildKeywordWhere(keyword?: string): Prisma.StockWhereInput {
    const kw = keyword?.trim();
    if (!kw) return {};
    return {
      OR: [{ name: { contains: kw, mode: "insensitive" } }, { code: { contains: kw, mode: "insensitive" } }],
    };
  }

  // 관심 종목 등록 (최대 20개 제한)
  async addStockToWatchlist(userId: string, body: CreateWatchlistRequestDto): Promise<CreateWatchlistResponseDto> {
    this.logger.log(`📥 [Watchlist Engine] 유저 ${userId} - 종목 ID: ${body.stockId} 등록 시도`);

    const stock = await this.prisma.stock.findUnique({
      where: {
        id: body.stockId,
      },
    });

    if (!stock) {
      this.logger.warn(`❌ [Asset Lookup Failed] 존재하지 않는 자산 유입: ${body.stockId}`);
      throw new AssetEntityNotFoundException(body.stockId);
    }
    const existingWatchlist = await this.prisma.watchlist.findUnique({
      where: {
        userId_stockId: {
          userId,
          stockId: body.stockId,
        },
      },
    });

    if (existingWatchlist) {
      throw new ConflictException("이미 관심 종목에 등록된 종목입니다.");
    }

    const currentCount = await this.prisma.watchlist.count({
      where: {
        userId,
      },
    });

    if (currentCount >= 20) {
      this.logger.warn(`⚠️ [Watchlist Capacity Overflow] 유저 ${userId} 가상 디스크 한도(20개) 초과 발생`);
      throw new WatchlistCapacityExceededException();
    }

    const newWatchlist = await this.prisma.watchlist.create({
      data: {
        userId,
        stockId: body.stockId,
      },
    });

    return {
      watchlistId: newWatchlist.id,
      stockName: stock.name,
      totalRegisteredCount: currentCount + 1,
    };
  }
}
