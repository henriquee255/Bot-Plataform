import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotFlow } from './bot-flow.entity';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BotFlow])],
  providers: [BotService],
  controllers: [BotController],
  exports: [BotService],
})
export class BotModule {}
