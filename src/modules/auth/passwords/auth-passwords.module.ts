import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { AuthPasswordsController } from "./auth-passwords.controller";
import { AuthPasswordsService } from "./auth-passwords.service";
import { PrismaService } from "../../../common/prisma/prisma.service";

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: Number(process.env.EMAIL_PORT) || 587,
        auth: {
          user: process.env.EMAIL_AUTH_USER,
          pass: process.env.EMAIL_AUTH_PASS,
        },
      },
      defaults: {
        from: '"비밀번호 도움센터" <yunny.dev@gmail.com>',
      },
    }),
  ],
  controllers: [AuthPasswordsController],
  providers: [AuthPasswordsService, PrismaService],
  exports: [AuthPasswordsService],
})
export class AuthPasswordsModule {}
