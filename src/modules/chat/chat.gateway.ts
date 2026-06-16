import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthService } from "../auth/auth.service";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { ChatService } from "./chat.service";
import { JoinRoomRequestDto } from "./dto/req/join-room.request.dto";
import { SendMessageRequestDto } from "./dto/req/send-message.request.dto";

const GLOBAL_TICKER = "GLOBAL";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly messageHistory = new Map<string, number[]>();
  private readonly bannedUsers = new Map<string, number>();

  private readonly SPAM_WINDOW_MS = 3000;
  private readonly SPAM_LIMIT = 5;
  private readonly BAN_DURATION_MS = 10000;

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth.token;

    if (typeof token !== "string") {
      client.disconnect();
      return;
    }

    try {
      const payload = this.authService.verifyAccessToken(token);
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage("join_room")
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() body: JoinRoomRequestDto) {
    const ticker = body?.ticker ?? GLOBAL_TICKER;
    const roomName = `stock:${ticker}`;

    void client.join(roomName);

    client.emit("joined_room", {
      ticker,
      roomName,
      message: "채팅방에 입장했습니다.",
    });
  }

  @SubscribeMessage("send_message")
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() body: SendMessageRequestDto) {
    try {
      const user = client.data.user as JwtPayload | undefined;

      if (!user) {
        client.emit("chat_error", {
          message: "인증되지 않은 사용자입니다.",
        });
        client.disconnect();
        return;
      }

      const now = Date.now();
      const bannedUntil = this.bannedUsers.get(user.sub);

      if (bannedUntil && bannedUntil > now) {
        client.emit("chat_error", {
          message: `채팅 제한 중입니다. ${Math.ceil((bannedUntil - now) / 1000)}초 후 다시 시도해주세요.`,
        });
        return;
      }

      if (bannedUntil && bannedUntil <= now) {
        this.bannedUsers.delete(user.sub);
      }

      const history = this.messageHistory.get(user.sub) ?? [];
      const recentMessages = history.filter((time) => now - time < this.SPAM_WINDOW_MS);

      if (recentMessages.length >= this.SPAM_LIMIT) {
        this.bannedUsers.set(user.sub, now + this.BAN_DURATION_MS);
        this.messageHistory.delete(user.sub);

        client.emit("chat_error", {
          message: "도배 감지로 10초간 채팅이 제한되었습니다.",
        });
        return;
      }

      recentMessages.push(now);
      this.messageHistory.set(user.sub, recentMessages);

      const ticker = body?.ticker ?? GLOBAL_TICKER;

      const message = await this.chatService.sendMessage(user, {
        ...body,
        ticker,
      });

      this.server.to(`stock:${ticker}`).emit("receive_message", message);

      return message;
    } catch (error) {
      client.emit("chat_error", {
        message: error instanceof Error ? error.message : "메시지 전송에 실패했습니다.",
      });
    }
  }
}
