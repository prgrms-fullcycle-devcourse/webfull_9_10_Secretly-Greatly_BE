import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
  /**
   * userId 컨텍스트로 콜백 실행. 콜백 안의 모든 쿼리에 RLS가 적용.
   */
  async withUser<T>(userId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      // 3번째 인자 true = 트랜잭션 한정. 파라미터 바인딩으로 인젝션 방지.
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
      return fn(tx);
    });
  }
}
