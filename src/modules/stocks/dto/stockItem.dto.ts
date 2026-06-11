export class StockItemDto {
  stockId: number;
  code: string;
  name: string;
  price: number;
  change: number; // 순수 Float (% 제외)
  volume: number;
  market: string; // DOMESTIC | OVERSEAS | COIN
}

export class StockListDataDto {
  sortedBy: string;
  totalCount: number;
  items: StockItemDto[];
}
