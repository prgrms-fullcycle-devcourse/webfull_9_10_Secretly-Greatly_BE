import { NotFoundException } from "@nestjs/common";

export class WatchlistNotFoundException extends NotFoundException {
  constructor(watchlistId: number) {
    super(`요청하신 파일(ID: ${watchlistId})을 디렉토리에서 찾을 수 없거나 접근 권한이 없습니다.`);
  }
}
