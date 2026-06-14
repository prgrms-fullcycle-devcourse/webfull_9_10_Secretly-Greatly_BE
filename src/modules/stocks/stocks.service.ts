import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GetStocksQueryDto } from "./dto/getStocksQuery.dto";
import { StockListDataDto, StockItemDto } from "./dto/stockItem.dto";
import { MARKET_TO_RESPONSE, RESPONSE_TO_MARKET } from "./stocks.constant";

@Injectable()
export class StockItemFetchAll {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetStocksQueryDto): Promise<StockListDataDto> {
    const { sort = "change", order = "desc", market, keyword } = query;

    // 종목 마스터 + 각 종목의 최신 시세 스냅샷 1건
    const stocks = await this.prisma.stock.findMany({
      where: {
        ...(market ? { market: RESPONSE_TO_MARKET[market] } : {}),
        ...this.buildKeywordWhere(keyword),
      },
      // include: {
      //   snapshots: {
      //     orderBy: { capturedAt: "desc" },
      //     take: 1,
      //   },
      // },
    });

    const items: StockItemDto[] = stocks.map((s) => {
      // TODO: 스냅샷 삭제로 인한 임시 하드코딩 - snapshot 복구 후 원복 필요
      // const latest = s.snapshots[0];
      return {
        stockId: s.id,
        code: s.code,
        name: s.name,
        price: 0, // TODO: 임시 하드코딩 (원래: latest ? Number(latest.currentPrice) : 0)
        change: 0, // TODO: 임시 하드코딩 (원래: latest ? Number(latest.changeRate) : 0) - 기호 없는 순수 실수
        volume: 0, // TODO: 임시 하드코딩 (원래: latest?.volume != null ? Number(latest.volume) : 0)
        market: MARKET_TO_RESPONSE[s.market], // KR/US/CRYPTO -> DOMESTIC/OVERSEAS/COIN
      };
    });

    // price/change/volume은 스냅샷 파생값이라 메모리에서 정렬
    const dir = order === "asc" ? 1 : -1;
    items.sort((a, b) => (a[sort] - b[sort]) * dir);

    return {
      sortedBy: sort,
      totalCount: items.length,
      items,
    };
  }

  /**
   * 검색 조건 생성부
   * 현재: 정확(부분 일치) 검색 — name 또는 code 에 keyword 포함, 대소문자 무시
   * 향후: 유사도(fuzzy) 검색으로 전환 시 이 메서드만 교체
   */
  private buildKeywordWhere(keyword?: string): Prisma.StockWhereInput {
    const kw = keyword?.trim();
    if (!kw) return {};
    return {
      OR: [{ name: { contains: kw, mode: "insensitive" } }, { code: { contains: kw, mode: "insensitive" } }],
    };
  }
}
