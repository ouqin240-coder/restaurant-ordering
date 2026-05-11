import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum TableStatus { FREE = 'free', OCCUPIED = 'occupied', CLEANING = 'cleaning' }

@Entity('tables')
export class DiningTable {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 20, unique: true })
  tableNo: string;

  @Column({ length: 50, nullable: true })
  area: string;

  @Column({ type: 'int', default: 4 })
  capacity: number;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.FREE })
  status: TableStatus;

  @Column({ length: 500, nullable: true })
  qrCodeUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
