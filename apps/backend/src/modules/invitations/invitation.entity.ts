import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column()
  email: string;

  @Column({ default: 'agent' })
  role: string;

  @Column({ type: 'uuid', unique: true, default: () => 'gen_random_uuid()' })
  token: string;

  @Column({ type: 'uuid' })
  invited_by: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  accepted_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
