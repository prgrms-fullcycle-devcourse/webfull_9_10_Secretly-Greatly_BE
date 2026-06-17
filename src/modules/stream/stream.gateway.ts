import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthService } from "../auth/auth.service";
import { getUserRoomName, STREAM_EVENTS } from "./constants";
import { StreamService } from "./stream.service";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  namespace: "/api/v1/stream",
  cors: {
    origin: true,
    credentials: true,
  },
})
export class StreamGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StreamGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly streamService: StreamService,
  ) {}
  afterInit(server: Server) {
    this.streamService.setServer(server);
    this.logger.log("StreamGateway initialized");
  }

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (typeof token !== "string" || !token) {
        client.emit(STREAM_EVENTS.STREAM_ERROR, {
          message: "인증 토큰이 필요합니다.",
        });
        client.disconnect();
        return;
      }

      if (!token) {
        client.emit(STREAM_EVENTS.STREAM_ERROR, {
          message: "인증 토큰이 필요합니다.",
        });
        client.disconnect();
        return;
      }

      const user = this.authService.verifyAccessToken(token);

      client.data.user = user;
      void client.join(getUserRoomName(user.sub));

      this.logger.log(`connected user=${user.sub}`);
    } catch {
      client.emit(STREAM_EVENTS.STREAM_ERROR, {
        message: "유효하지 않은 인증 토큰입니다.",
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`disconnected socket=${client.id}`);
  }
}
