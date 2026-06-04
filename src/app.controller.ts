// 임시 라우터
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      status: 'ok',
      message: 'Secretly Greatly Backend is running',
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      message: 'Health check success',
    };
  }
}