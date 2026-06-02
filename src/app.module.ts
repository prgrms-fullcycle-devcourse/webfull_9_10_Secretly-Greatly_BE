import { Module } from '@nestjs/common';
import { AppController } from './app.comtroller';

@Module({
  imports: [],
  providers: [],
  controllers: [AppController],
})
export class AppModule {}