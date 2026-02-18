import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('platform_settings')
export class PlatformSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ length: 50, default: 'string' })
  type: 'string' | 'number' | 'boolean' | 'json';

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  group: string;

  /** Valores sensíveis não são retornados em listagem pública */
  @Column({ default: false })
  is_secret: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
