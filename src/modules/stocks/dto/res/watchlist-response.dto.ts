export class WatchlistStockItemDto {
  watchlistId: number;
  stockId: number;
  displayFileName: string;
  ticker: string;
  currentPrice: number;
  fluctuationRate: number;
  volume: number;
  displayOrder: number;
  market: string;
}

export class WatchlistResponseDto {
  currentTimeframe: string;
  currentSortBy: string;
  totalCount: number;
  items: WatchlistStockItemDto[];
}
