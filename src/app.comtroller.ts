// 임시 라우터
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      message: 'Secretly Greatly Backend is running',
    };
  }
}