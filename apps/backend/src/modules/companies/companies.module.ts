import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Sector } from './sector.entity';
import { SectorMember } from './sector-member.entity';
import { SectorsController } from './sectors.controller';
import { Company } from './company.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Sector, SectorMember, User]),
    UsersModule,
  ],
  providers: [CompaniesService],
  controllers: [CompaniesController, SectorsController],
  exports: [CompaniesService],
})
export class CompaniesModule { }
