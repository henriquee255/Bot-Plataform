import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, UseGuards, NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from './sector.entity';
import { SectorMember } from './sector-member.entity';
import { User } from '../users/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('sectors')
@UseGuards(JwtAuthGuard)
export class SectorsController {
    constructor(
        @InjectRepository(Sector) private sectorRepo: Repository<Sector>,
        @InjectRepository(SectorMember) private memberRepo: Repository<SectorMember>,
        @InjectRepository(User) private userRepo: Repository<User>,
    ) { }

    @Get()
    async findAll(@CurrentUser() user: any) {
        const sectors = await this.sectorRepo.find({
            where: { company_id: user.companyId },
            order: { created_at: 'ASC' },
        });

        // Attach member count
        const result = await Promise.all(
            sectors.map(async (sector) => {
                const memberCount = await this.memberRepo.count({ where: { sector_id: sector.id } });
                return { ...sector, member_count: memberCount };
            }),
        );

        return result;
    }

    @Post()
    async create(@CurrentUser() user: any, @Body() body: any) {
        const sector = this.sectorRepo.create({
            ...body,
            company_id: user.companyId,
        });
        return this.sectorRepo.save(sector);
    }

    @Patch(':id')
    async update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
        const sector = await this.sectorRepo.findOne({ where: { id, company_id: user.companyId } });
        if (!sector) throw new NotFoundException('Setor não encontrado');
        Object.assign(sector, body);
        return this.sectorRepo.save(sector);
    }

    @Delete(':id')
    async remove(@CurrentUser() user: any, @Param('id') id: string) {
        const sector = await this.sectorRepo.findOne({ where: { id, company_id: user.companyId } });
        if (!sector) throw new NotFoundException('Setor não encontrado');
        await this.memberRepo.delete({ sector_id: id });
        await this.sectorRepo.remove(sector);
        return { success: true };
    }

    @Get(':id/members')
    async getMembers(@CurrentUser() user: any, @Param('id') id: string) {
        const sector = await this.sectorRepo.findOne({ where: { id, company_id: user.companyId } });
        if (!sector) throw new NotFoundException('Setor não encontrado');

        const members = await this.memberRepo.find({
            where: { sector_id: id },
            relations: ['user'],
        });

        return members.map(m => ({
            id: m.user.id,
            full_name: m.user.full_name,
            email: m.user.email,
            role: m.user.role,
            avatar_url: m.user.avatar_url,
            member_record_id: m.id,
        }));
    }

    @Post(':id/members')
    async addMember(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() body: { userId: string },
    ) {
        const sector = await this.sectorRepo.findOne({ where: { id, company_id: user.companyId } });
        if (!sector) throw new NotFoundException('Setor não encontrado');

        const targetUser = await this.userRepo.findOne({
            where: { id: body.userId, company_id: user.companyId },
        });
        if (!targetUser) throw new NotFoundException('Usuário não encontrado');

        const existing = await this.memberRepo.findOne({
            where: { sector_id: id, user_id: body.userId },
        });
        if (existing) throw new ConflictException('Usuário já é membro deste setor');

        const member = this.memberRepo.create({ sector_id: id, user_id: body.userId });
        await this.memberRepo.save(member);

        return {
            id: targetUser.id,
            full_name: targetUser.full_name,
            email: targetUser.email,
            role: targetUser.role,
            avatar_url: targetUser.avatar_url,
        };
    }

    @Delete(':id/members/:userId')
    async removeMember(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Param('userId') userId: string,
    ) {
        const sector = await this.sectorRepo.findOne({ where: { id, company_id: user.companyId } });
        if (!sector) throw new NotFoundException('Setor não encontrado');

        await this.memberRepo.delete({ sector_id: id, user_id: userId });
        return { success: true };
    }
}
