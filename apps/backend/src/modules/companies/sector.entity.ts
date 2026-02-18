import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';

@Entity('sectors')
export class Sector {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    company_id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 500, nullable: true })
    description: string;

    @Column({ length: 100, nullable: true, default: '#6366f1' })
    color: string;

    @Column({ default: true })
    is_active: boolean;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
