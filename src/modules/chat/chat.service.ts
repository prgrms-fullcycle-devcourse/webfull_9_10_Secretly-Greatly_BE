import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MessageType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { SendMessageRequestDto } from "./dto/req/send-message.request.dto";

@Injectable()
export class ChatService {
  private readonly bannedWords = ["시발", "병신", "개새끼"];

  constructor(private readonly prisma: PrismaService) {}

  private validateMessageContent(message: string) {
    const normalizedContent = message.toLowerCase().replace(/\s/g, "");

    const hasBannedWord = this.bannedWords.some((word) =>
      normalizedContent.includes(word),
    );

    if (hasBannedWord) {
      throw new BadRequestException("금칙어가 포함된 메시지입니다.");
    }
  }

  async sendMessage(user: JwtPayload, dto: SendMessageRequestDto) {
    this.validateMessageContent(dto.message);

    const stock = await this.prisma.stock.findFirst({
      where: {
        code: dto.ticker,
      },
    });

    if (!stock) {
      throw new NotFoundException("존재하지 않는 종목입니다.");
    }

    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: {
        stockId: stock.id,
      },
    });

    if (!chatRoom) {
      throw new NotFoundException("채팅방이 존재하지 않습니다.");
    }

    const chatMessage = await this.prisma.chatMessage.create({
      data: {
        userId: user.sub,
        roomId: chatRoom.id,
        message: dto.message,
        messageType: MessageType.NORMAL,
      },
    });

    return {
      chatId: chatMessage.id,
      stockId: stock.id,
      ticker: stock.code,
      stockName: stock.name,
      roomId: chatRoom.id,
      senderId: user.sub,
      isAnonymous: user.isAnonymous,
      nickname: user.nickname,
      message: chatMessage.message,
      messageType: chatMessage.messageType,
      formattedLog: `[${stock.code}] ${user.nickname}: ${chatMessage.message}`,
      createdAt: chatMessage.createdAt,
    };
  }
}
