import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Sector } from './sector.entity';
import { User } from '../users/user.entity';

@Entity('sector_members')
@Unique(['sector_id', 'user_id'])
export class SectorMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    sector_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => Sector, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sector_id' })
    sector: Sector;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    created_at: Date;
}
