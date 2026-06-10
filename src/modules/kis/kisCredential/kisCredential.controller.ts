import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Req,
} from "@nestjs/common";
import { KisCredentialService } from "./kisCredential.service";
import { RegisterKisCredentialDto } from "./dto/registerKisCredential.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../../auth/interfaces/jwt-payload.interface";

@Controller("api/auth/kis-credential")
@UseGuards(JwtAuthGuard)
export class KisCredentialController {
  constructor(private readonly kisCredentialService: KisCredentialService) {}

  // 등록: POST /api/auth/kis-credential
  @Post()
  @HttpCode(HttpStatus.CREATED)
  // TODO(임시): JWT 타입 지정 필요
  async register(
    @Req()
    req: {
      user: JwtPayload;
    },
    @Body() dto: RegisterKisCredentialDto,
  ) {
    const userId = req.user.sub;
    const data = await this.kisCredentialService.register(userId, {
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
  @UseGuards(JwtAuthGuard)
  async getStatus(
    @Req()
    req: {
      user: JwtPayload;
    },
  ) {
    const userId = req.user.sub;
    const data = await this.kisCredentialService.getStatus(userId);
    return {
      message: "KIS API 키 등록 상태 조회 성공",
      data,
    };
  }
}
