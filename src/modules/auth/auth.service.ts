import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { PrismaService } from "../../common/prisma/prisma.service";
import { LoginRequestDto } from "./dto/req/login.request.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { SignupRequestDto } from "./dto/req/signup.request.dto";
import { SignUpResponseDto } from "./dto/res/signup.response.dto";
import { DuplicateEmailException } from "../../common/exceptions/duplicate-email.exception";
import { DuplicateNicknameException } from "../../common/exceptions/duplicate-nickname.exception";
import { AnonymousServiceResultDto } from "./dto/res/anonymous-serivce-result.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(body: SignupRequestDto): Promise<SignUpResponseDto> {
    // 1. 이메일 중복 체크
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existingEmail) {
      throw new DuplicateEmailException();
    }

    // 2. 닉네임 중복 체크
    const existingNickname = await this.prisma.user.findUnique({
      where: { nickname: body.fixedNickname },
    });
    if (existingNickname) {
      throw new DuplicateNicknameException();
    }

    // 3. Bcrypt 해싱
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);

    // 4. DB 등록
    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          nickname: body.fixedNickname,
          password: hashedPassword,
        },
      });

      await tx.userSetting.create({
        data: {
          userId: user.id,
        },
      });

      return user;
    });

    // 5. 객체 반환
    return {
      userId: newUser.id,
    };
  }

  // 로그인
  async login(loginRequestDto: LoginRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginRequestDto.email,
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 일치하지 않습니다.");
    }

    const isPasswordMatched = await bcrypt.compare(loginRequestDto.password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 일치하지 않습니다.");
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
      isAnonymous: false,
    });

    return {
      userId: user.id,
      fixedNickname: user.nickname,
      accessToken,
    };
  }

  // 익명 임시 세션 발급
  async createAnonymousSession(): Promise<AnonymousServiceResultDto> {
    const anonymousToken = randomUUID();

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    // 1. Prisma를 활용해 익명 유저 레코드, 세팅, 익명 세션 히스토리를 동시에 생성
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

    // 2. 익명 접속 유저 식별용 임시 JWT 페이로드
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: null,
      nickname: user.nickname,
      isAnonymous: true,
    });

    // 3. DTO 반환
    return {
      userId: user.id,
      anonymousToken,
      accessToken,
    };
  }

  async getMe(user: JwtPayload, path: string) {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });

    if (!foundUser) {
      throw new NotFoundException("사용자를 찾을 수 없습니다.");
    }

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path,
      message: "현재 로그인 사용자 조회에 성공했습니다.",
      data: {
        userId: foundUser.id,
        email: foundUser.email,
        nickname: foundUser.nickname,
        isAnonymous: user.isAnonymous,
        createdAt: foundUser.createdAt,
      },
      error: null,
    };
  }
  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
