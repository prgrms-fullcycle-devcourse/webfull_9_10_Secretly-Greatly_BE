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
import { RegisterKisCredentialRequestDto } from "./dto/req/registerKisCredential.request.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../../auth/interfaces/jwt-payload.interface";
import {
  KIS_REGISTER_SUCCESS_API_RESPONSE,
  KIS_REGISTER_VALIDATION_API_RESPONSE,
  KIS_REGISTER_UNAUTHORIZED_API_RESPONSE,
  KIS_REGISTER_CONFLICT_API_RESPONSE,
  KIS_REGISTER_INVALID_CREDENTIAL_API_RESPONSE,
  KIS_REGISTER_INTERNAL_SERVER_ERROR_API_RESPONSE,
  KIS_REGISTER_API_DESCRIPTION,
} from "./swagger/kisCredentialRegister.swagger";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  KIS_STATUS_API_DESCRIPTION,
  KIS_STATUS_SUCCESS_API_RESPONSE,
  KIS_STATUS_UNAUTHORIZED_API_RESPONSE,
  KIS_STATUS_INTERNAL_SERVER_ERROR_API_RESPONSE,
} from "./swagger/kisCredentialStatus.swagger";

@Controller("api/auth/kis-credential")
@UseGuards(JwtAuthGuard)
export class KisCredentialController {
  constructor(private readonly kisCredentialService: KisCredentialService) {}

  // 등록: POST /api/auth/kis-credential
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "KIS key 등록",
    description: KIS_REGISTER_API_DESCRIPTION,
  })
  @ApiResponse(KIS_REGISTER_SUCCESS_API_RESPONSE)
  @ApiResponse(KIS_REGISTER_VALIDATION_API_RESPONSE)
  @ApiResponse(KIS_REGISTER_UNAUTHORIZED_API_RESPONSE)
  @ApiResponse(KIS_REGISTER_CONFLICT_API_RESPONSE)
  @ApiResponse(KIS_REGISTER_INVALID_CREDENTIAL_API_RESPONSE)
  @ApiResponse(KIS_REGISTER_INTERNAL_SERVER_ERROR_API_RESPONSE)
  async register(
    @Req()
    req: {
      user: JwtPayload;
    },
    @Body() dto: RegisterKisCredentialRequestDto,
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

  // 조회: GET /api/auth/kis-credential
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "KIS key 조회",
    description: KIS_STATUS_API_DESCRIPTION,
  })
  @ApiResponse(KIS_STATUS_SUCCESS_API_RESPONSE)
  @ApiResponse(KIS_STATUS_UNAUTHORIZED_API_RESPONSE)
  @ApiResponse(KIS_STATUS_INTERNAL_SERVER_ERROR_API_RESPONSE)
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
