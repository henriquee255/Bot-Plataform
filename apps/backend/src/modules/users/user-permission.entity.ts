import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user_permissions')
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column()
  user_id: string;

  // Resources: inbox, reports, knowledge_base, automations, bots, channels, team, sectors, settings, crm, dashboard
  @Column()
  resource: string;

  // Actions: view, create, edit, delete, manage
  @Column('simple-array')
  actions: string[];

  @CreateDateColumn()
  created_at: Date;
}
