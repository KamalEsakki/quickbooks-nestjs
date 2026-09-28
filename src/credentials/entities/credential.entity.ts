import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('credentials')
export class CredentialEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  realmId: string;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ type: 'text' })
  refreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn({ nullable: true })
  createdAt?: Date | null;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date | null;
}
