import { IsEnum, IsOptional } from "class-validator";

export enum Timeframe {
  DAILY = "DAILY",
  M15 = "M15",
  M30 = "M30",
}

export enum SortBy {
  FLUCTUATION = "FLUCTUATION",
  PRICE = "PRICE",
  VOLUME = "VOLUME",
}

export class GetWatchlistQueryRequestDto {
  @IsEnum(Timeframe)
  @IsOptional()
  timeframe?: Timeframe = Timeframe.M15;

  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy = SortBy.FLUCTUATION;
}
