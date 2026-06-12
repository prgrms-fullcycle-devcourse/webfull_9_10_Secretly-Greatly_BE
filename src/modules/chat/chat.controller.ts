import { Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { ChatService } from "./chat.service";
import { GetChatMessagesQueryDto } from "./dto/req/get-chat-messages.query.dto";
import {
  CHAT_MESSAGES_API_DESCRIPTION,
  CHAT_MESSAGES_API_RESPONSE,
  CHAT_MESSAGES_NOT_FOUND_API_RESPONSE,
} from "./swagger/chatMessages.swagger";
import {
  CHAT_REPORT_API_DESCRIPTION,
  CHAT_REPORT_API_RESPONSE,
  CHAT_REPORT_CONFLICT_API_RESPONSE,
  CHAT_REPORT_NOT_FOUND_API_RESPONSE,
} from "./swagger/reportChat.swagger";

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@ApiTags("Chat")
@Controller("api/chats")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("stocks/:ticker")
  @ApiOperation({
    summary: "특정 종목 채팅 조회",
    description: CHAT_MESSAGES_API_DESCRIPTION,
  })
  @ApiResponse(CHAT_MESSAGES_API_RESPONSE)
  @ApiResponse(CHAT_MESSAGES_NOT_FOUND_API_RESPONSE)
  async getMessages(@Param("ticker") ticker: string, @Query() query: GetChatMessagesQueryDto) {
    return this.chatService.getMessagesByTicker(ticker, query.page, query.limit);
  }

  @Patch(":chatId/report")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "채팅 신고",
    description: CHAT_REPORT_API_DESCRIPTION,
  })
  @ApiResponse(CHAT_REPORT_API_RESPONSE)
  @ApiResponse(CHAT_REPORT_NOT_FOUND_API_RESPONSE)
  @ApiResponse(CHAT_REPORT_CONFLICT_API_RESPONSE)
  reportChat(@Param("chatId") chatId: string, @Req() req: AuthenticatedRequest) {
    return this.chatService.reportChat(Number(chatId), req.user.sub);
  }
}
