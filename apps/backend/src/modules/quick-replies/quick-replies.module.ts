import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuickReply } from './quick-reply.entity';
import { QuickRepliesService } from './quick-replies.service';
import { QuickRepliesController } from './quick-replies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QuickReply])],
  providers: [QuickRepliesService],
  controllers: [QuickRepliesController],
  exports: [QuickRepliesService],
})
export class QuickRepliesModule {}
