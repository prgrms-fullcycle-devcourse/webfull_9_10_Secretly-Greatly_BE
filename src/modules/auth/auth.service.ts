import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { PrismaService } from "../../common/prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, path: string) {
    // 기존 login 코드 그대로
  }

  async createAnonymousSession(path: string) {
    const anonymousToken = randomUUID();

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    const user = await this.prisma.user.create({
      data: {
        nickname: `anonymous_${anonymousToken.slice(0, 8)}`,
        setting: {
          create: {},
        },
        anonymousSessions: {
          create: {
            anonymousUuid: anonymousToken,
            expiredAt,
          },
        },
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      nickname: user.nickname,
      type: "anonymous",
    });

    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path,
      message: "익명 임시 세션 발급이 완료되었습니다.",
      data: {
        userId: user.id,
        anonymousToken,
        accessToken,
      },
      error: null,
    };
  }
}
