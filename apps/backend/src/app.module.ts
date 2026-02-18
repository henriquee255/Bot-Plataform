import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@nestjs-modules/ioredis';

import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { WidgetModule } from './modules/widget/widget.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { GatewayModule } from './gateway/gateway.module';
import { AdminModule } from './modules/admin/admin.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { QuickRepliesModule } from './modules/quick-replies/quick-replies.module';
import { BotModule } from './modules/bot/bot.module';
import { PlansModule } from './modules/plans/plans.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { WhatsAppQrModule } from './modules/whatsapp-qr/whatsapp-qr.module';
import { AiModule } from './modules/ai/ai.module';
import { AiConfig } from './modules/ai/ai-config.entity';
import { CrmModule } from './modules/crm/crm.module';
import { CrmPipeline } from './modules/crm/crm-pipeline.entity';
import { CrmActivity } from './modules/crm/crm-activity.entity';
import { CrmTask } from './modules/crm/crm-task.entity';
import { AutomationsModule } from './modules/automations/automations.module';
import { Automation } from './modules/automations/automation.entity';
import { AutomationLog } from './modules/automations/automation-log.entity';
import { ReportsModule } from './modules/reports/reports.module';

import { Company } from './modules/companies/company.entity';
import { User } from './modules/users/user.entity';
import { Invitation } from './modules/invitations/invitation.entity';
import { Contact } from './modules/contacts/contact.entity';
import { ContactSession } from './modules/contacts/contact-session.entity';
import { ContactNote } from './modules/contacts/contact-note.entity';
import { Conversation } from './modules/conversations/conversation.entity';
import { Message } from './modules/messages/message.entity';
import { Sector } from './modules/companies/sector.entity';
import { SectorMember } from './modules/companies/sector-member.entity';
import { Article } from './modules/knowledge-base/article.entity';
import { QuickReply } from './modules/quick-replies/quick-reply.entity';
import { BotFlow } from './modules/bot/bot-flow.entity';
import { Plan } from './modules/plans/plan.entity';
import { PlatformSetting } from './modules/settings/platform-setting.entity';
import { Channel } from './modules/channels/channel.entity';

const entities = [
  Company, User, Invitation, Contact, ContactSession, ContactNote,
  Conversation, Message, Sector, SectorMember, Article, QuickReply, BotFlow,
  Plan, PlatformSetting, Channel, AiConfig,
  CrmPipeline, CrmActivity, CrmTask,
  Automation, AutomationLog,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const useSqlite = config.get('USE_SQLITE') === 'true';
        if (useSqlite) {
          return {
            type: 'better-sqlite3' as any,
            database: './chat-dev.sqlite',
            entities,
            synchronize: true,
            logging: false,
          };
        }
        return {
          type: 'postgres',
          url: config.get('DATABASE_URL'),
          entities,
          synchronize: true,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),

    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL', 'redis://localhost:6379'),
        lazyConnect: true,
      }),
      inject: [ConfigService],
    }),

    EventEmitterModule.forRoot(),

    AuthModule,
    CompaniesModule,
    UsersModule,
    InvitationsModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,
    WidgetModule,
    DashboardModule,
    GatewayModule,
    AdminModule,
    KnowledgeBaseModule,
    QuickRepliesModule,
    BotModule,
    PlansModule,
    SettingsModule,
    ChannelsModule,
    WhatsAppQrModule,
    AiModule,
    CrmModule,
    AutomationsModule,
    ReportsModule,
  ],
})
export class AppModule { }
