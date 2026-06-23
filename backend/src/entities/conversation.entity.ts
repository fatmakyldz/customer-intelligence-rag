import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  @Column({ type: 'jsonb', default: [] })
  sources: any[];

  @Column({ type: 'jsonb', default: [] })
  reasoning_steps: any[];

  @Column({ type: 'varchar', length: 50, default: 'normal' })
  category: string;

  @CreateDateColumn()
  created_at: Date;
}
