import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import {
  CHAT_MESSAGES_API_DESCRIPTION,
  CHAT_MESSAGES_API_RESPONSE,
  CHAT_MESSAGES_NOT_FOUND_API_RESPONSE,
} from "./swagger/chatMessages.swagger";

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
  async getMessages(@Param("ticker") ticker: string, @Query("page") page = "1", @Query("limit") limit = "30") {
    return this.chatService.getMessagesByTicker(ticker, Number(page), Number(limit));
  }
}
