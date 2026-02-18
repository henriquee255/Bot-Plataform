import {
  Controller, Get, Patch, Delete, Post, Param, Body, Query, UseGuards, Res, HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Dashboard / Stats ──────────────────────────────────────────────────────

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('stats/growth')
  getGrowthStats(@Query('days') days = '30') {
    return this.adminService.getGrowthStats(Number(days));
  }

  @Get('activity')
  getRecentActivity(@Query('limit') limit = '20') {
    return this.adminService.getRecentActivity(Number(limit));
  }

  // ── Companies ──────────────────────────────────────────────────────────────

  @Get('companies')
  listCompanies(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    return this.adminService.listCompanies({ q, status, plan });
  }

  @Get('companies/export/csv')
  async exportCompanies(@Res() res: Response) {
    const csv = await this.adminService.exportCompaniesCSV();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="empresas.csv"');
    res.send('\uFEFF' + csv);
  }

  @Get('companies/:id')
  getCompany(@Param('id') id: string) {
    return this.adminService.getCompany(id);
  }

  @Post('companies')
  createCompany(@Body() body: any) {
    return this.adminService.createCompany(body);
  }

  @Patch('companies/:id')
  updateCompany(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateCompany(id, body);
  }

  @Post('companies/:id/suspend')
  suspendCompany(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.suspendCompany(id, body.reason);
  }

  @Post('companies/:id/activate')
  activateCompany(@Param('id') id: string) {
    return this.adminService.activateCompany(id);
  }

  @Delete('companies/:id')
  @HttpCode(204)
  async deleteCompany(@Param('id') id: string) {
    await this.adminService.deleteCompany(id);
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  @Get('users')
  listUsers(
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listUsers(q, role, status);
  }

  @Post('users')
  createUser(@Body() body: any) {
    return this.adminService.createUser(body);
  }

  @Get('users/export/csv')
  async exportUsers(@Res() res: Response) {
    const csv = await this.adminService.exportUsersCSV();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="usuarios.csv"');
    res.send('\uFEFF' + csv);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body);
  }

  @Post('users/:id/resend-access')
  resendAccess(@Param('id') id: string) {
    return this.adminService.resendAccess(id);
  }

  @Post('users/:id/impersonate')
  impersonateUser(@Param('id') id: string) {
    return this.adminService.generateImpersonateToken(id);
  }

  @Delete('users/:id')
  @HttpCode(204)
  async deleteUser(@Param('id') id: string) {
    await this.adminService.deleteUser(id);
  }

  @Post('users/:id/toggle-superadmin')
  toggleSuperadmin(@Param('id') id: string) {
    return this.adminService.toggleSuperadmin(id);
  }

  // ── Platform Settings ──────────────────────────────────────────────────────

  @Get('platform-settings')
  getPlatformSettings() {
    return this.adminService.getPlatformSettings();
  }

  @Patch('platform-settings')
  updatePlatformSettings(@Body() body: Record<string, any>) {
    return this.adminService.updatePlatformSettings(body);
  }

  // ── System Health ──────────────────────────────────────────────────────────

  @Get('system/health')
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  // ── WhatsApp Plans ─────────────────────────────────────────────────────────

  @Get('whatsapp-plans')
  getWhatsAppPlans() {
    return this.adminService.getWhatsAppPlans();
  }

  @Patch('whatsapp-plans')
  updateWhatsAppPlans(@Body() body: any) {
    return this.adminService.updateWhatsAppPlans(body);
  }
}
