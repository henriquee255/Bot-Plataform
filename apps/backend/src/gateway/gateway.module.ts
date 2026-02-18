import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  providers: [ChatGateway],
})
export class GatewayModule {}
