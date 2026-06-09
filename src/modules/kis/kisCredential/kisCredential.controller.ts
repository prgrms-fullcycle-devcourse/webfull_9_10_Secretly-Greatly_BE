import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  // Req,
  // UseGuards,
} from "@nestjs/common";
// import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { KisCredentialService } from "./kisCredential.service";
import { RegisterKisCredentialDto } from "./dto/registerKisCredential.dto";

@Controller("api/auth/kis-credential") // → /api/auth/kis-credential
// TODO: JWT 발급 구현되면 가드 복구하고 userId는 req.user에서 추출
// @UseGuards(JwtAuthGuard)
export class KisCredentialController {
  constructor(private readonly kisCredentialService: KisCredentialService) {}

  // 등록: POST /api/auth/kis-credential
  @Post()
  @HttpCode(HttpStatus.CREATED)
  // TODO(임시): JWT 전까지 body로 userId 받음. 인증 붙으면 req.user.userId로 교체
  async register(@Body() dto: RegisterKisCredentialDto) {
    const data = await this.kisCredentialService.register(dto.userId, {
      appKey: dto.appKey,
      appSecret: dto.appSecret,
    });
    return {
      message: "KIS API 키가 등록되었습니다.",
      data,
    };
  }

  // 조회: GET /api/auth/kis-credential?userId=...
  @Get()
  @HttpCode(HttpStatus.OK)
  // TODO(임시): JWT 전까지 userId를 쿼리로 받음
  async getStatus(@Query("userId") userId: string) {
    const data = await this.kisCredentialService.getStatus(userId);
    return {
      message: "KIS API 키 등록 상태 조회 성공",
      data,
    };
  }
}
