import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('kb_articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ length: 255 })
  slug: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ default: false })
  published: boolean;

  @Column({ default: 0 })
  views: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
