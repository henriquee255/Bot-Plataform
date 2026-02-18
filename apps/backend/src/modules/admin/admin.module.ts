import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { PlatformSetting } from '../settings/platform-setting.entity';
import { Channel } from '../channels/channel.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Company, User, PlatformSetting, Channel]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
