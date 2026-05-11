import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum MerchantRole {
  ADMIN = 'admin',
  CASHIER = 'cashier',
  KITCHEN = 'kitchen',
}

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 100 })
  password: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'enum', enum: MerchantRole, default: MerchantRole.CASHIER })
  role: MerchantRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
