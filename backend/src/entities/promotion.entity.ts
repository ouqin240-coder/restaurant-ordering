// src/entities/promotion.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum PromotionType {
  FULL_MINUS = 'full_minus',   // 满减
  COUPON = 'coupon',           // 优惠券
  DISCOUNT = 'discount',       // 折扣
}

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'enum', enum: PromotionType })
  type: PromotionType;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '满足条件金额' })
  threshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '减免金额/折扣率' })
  value: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, comment: '开始时间' })
  startAt: Date;

  @Column({ nullable: true, comment: '结束时间' })
  endAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 20, unique: true, comment: '优惠券码' })
  code: string;

  @Column({ length: 50, nullable: true, comment: '券名称（如：新人立减5元）' })
  name: string;

  @Column({ type: 'bigint', nullable: true, comment: '批次/模板 ID，同批次共享，用于领取去重' })
  templateId: number;

  @Column({ type: 'int', default: 0, comment: '批次总数，仅用于展示剩余' })
  batchTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '面额' })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '最低使用金额' })
  minAmount: number;

  @Column({ type: 'bigint', nullable: true, comment: '领取者 userId（NULL=未领取）' })
  userId: number;

  @Column({ length: 64, nullable: true, comment: '绑定的用户 openid（为空则通用）' })
  userOpenid: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ nullable: true })
  usedAt: Date;

  @Column({ nullable: true })
  expiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
