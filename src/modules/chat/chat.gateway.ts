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

  private readonly lastMessageAt = new Map<string, number>();

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    //console.log("socket connected:", client.id);

    const token = client.handshake.auth.token;

    if (typeof token !== "string") {
      //console.log("token missing");
      client.disconnect();
      return;
    }

    try {
      const payload = this.authService.verifyAccessToken(token);

      client.data.user = payload;

      //console.log("socket user:", client.data.user);
    } catch {
      //console.log("Invalid access token");
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
      const lastSentAt = this.lastMessageAt.get(user.sub) ?? 0;

      if (now - lastSentAt < 3000) {
        client.emit("chat_error", {
          message: "메시지는 3초에 한 번만 보낼 수 있습니다.",
        });

        return;
      }

      const ticker = body?.ticker ?? GLOBAL_TICKER;

      const message = await this.chatService.sendMessage(user, {
        ...body,
        ticker,
      });

      this.lastMessageAt.set(user.sub, now);

      this.server.to(`stock:${ticker}`).emit("receive_message", message);

      return message;
    } catch (error) {
      client.emit("chat_error", {
        message: error instanceof Error ? error.message : "메시지 전송에 실패했습니다.",
      });
    }
  }
}
