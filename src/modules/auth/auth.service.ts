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
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 일치하지 않습니다.",
      );
    }

    const isPasswordMatched = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordMatched) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 일치하지 않습니다.",
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path,
      message: "로그인에 성공했습니다. 에디터 세션이 동기화됩니다.",
      data: {
        userId: user.id,
        fixedNickname: user.nickname,
        accessToken,
      },
      error: null,
    };
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
