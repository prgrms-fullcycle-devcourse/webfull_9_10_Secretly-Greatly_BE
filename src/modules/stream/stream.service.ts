import { Injectable } from "@nestjs/common";
import { AlertLevel, AlertType } from "@prisma/client";
import { Server } from "socket.io";
import { STREAM_EVENTS, getUserRoomName } from "./constants";

@Injectable()
export class StreamService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitTerminalAlert(params: {
    userId: string;
    stockCode: string;
    stockName: string;
    level: AlertLevel;
    alertType: AlertType;
    changeRate: number;
    message: string;
    formattedLog?: string;
  }) {
    if (!this.server) {
      return;
    }

    this.server.to(getUserRoomName(params.userId)).emit(STREAM_EVENTS.TERMINAL_ALERT, {
      level: params.level,
      alertType: params.alertType,
      stockCode: params.stockCode,
      stockName: params.stockName,
      changeRate: params.changeRate,
      message: params.message,
      formattedLog: params.formattedLog ?? params.message,
      createdAt: new Date().toISOString(),
    });
  }
}
