import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  providers: [],
  controllers: [AppController],
})
export class AppModule {}