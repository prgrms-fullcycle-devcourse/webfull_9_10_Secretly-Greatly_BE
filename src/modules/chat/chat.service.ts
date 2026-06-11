import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
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

    const hasBannedWord = this.bannedWords.some((word) => normalizedContent.includes(word));

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

  async getMessagesByTicker(ticker: string, page: number, limit: number) {
    const stock = await this.prisma.stock.findFirst({
      where: {
        code: ticker,
      },
    });

    if (!stock) {
      throw new NotFoundException("존재하지 않는 종목입니다.");
    }

    const room = await this.prisma.chatRoom.findUnique({
      where: {
        stockId: stock.id,
      },
    });

    if (!room) {
      return {
        stockId: stock.id,
        ticker: stock.code,
        stockName: stock.name,
        page,
        limit,
        total: 0,
        messages: [],
      };
    }

    const [messages, total] = await this.prisma.$transaction([
      this.prisma.chatMessage.findMany({
        where: {
          roomId: room.id,
          isHidden: false,
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chatMessage.count({
        where: {
          roomId: room.id,
          isHidden: false,
        },
      }),
    ]);

    return {
      stockId: stock.id,
      ticker: stock.code,
      stockName: stock.name,
      page,
      limit,
      total,
      messages: messages.map((message) => ({
        chatId: message.id,
        roomId: message.roomId,
        senderId: message.userId,
        nickname: message.user?.nickname ?? "알 수 없음",
        message: message.message,
        messageType: message.messageType,
        reportCount: message.reportCount,
        isHidden: message.isHidden,
        createdAt: message.createdAt,
      })),
    };
  }

  async reportChat(chatId: number, userId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: {
        id: chatId,
      },
    });

    if (!message) {
      throw new NotFoundException("존재하지 않는 채팅 메시지입니다.");
    }

    const alreadyReported = await this.prisma.chatReport.findUnique({
      where: {
        chatMessageId_userId: {
          chatMessageId: chatId,
          userId,
        },
      },
    });

    if (alreadyReported) {
      throw new ConflictException("이미 신고한 메시지입니다.");
    }

    const updatedMessage = await this.prisma.$transaction(async (tx) => {
      await tx.chatReport.create({
        data: {
          chatMessageId: chatId,
          userId,
        },
      });

      const reportedMessage = await tx.chatMessage.update({
        where: {
          id: chatId,
        },
        data: {
          reportCount: {
            increment: 1,
          },
        },
      });

      if (reportedMessage.reportCount >= 5 && !reportedMessage.isHidden) {
        return tx.chatMessage.update({
          where: {
            id: chatId,
          },
          data: {
            isHidden: true,
          },
        });
      }

      return reportedMessage;
    });

    return {
      message: "해당 메시지에 대한 신고가 접수되었습니다.",
      chatId: updatedMessage.id,
      currentReportCount: updatedMessage.reportCount,
      isBlinded: updatedMessage.isHidden,
    };
  }
}
