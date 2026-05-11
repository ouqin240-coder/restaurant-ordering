import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum OrderType { DINE_IN = 1, DELIVERY = 2 }
export enum OrderStatus {
  PENDING_PAYMENT = 0,
  PENDING_ACCEPT = 1,
  PREPARING = 2,
  READY = 3,
  COMPLETED = 4,
  CANCELLED = 5,
}
export enum PayStatus { UNPAID = 0, PAID = 1, REFUNDED = 2 }

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 32, unique: true })
  orderNo: string;

  @Column({ type: 'bigint', nullable: true })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'tinyint' })
  orderType: OrderType;

  @Column({ type: 'bigint', nullable: true })
  tableId: number;

  @Column({ length: 20, nullable: true })
  tableNo: string;

  @Column({ type: 'bigint', nullable: true })
  addressId: number;

  @Column({ type: 'text', nullable: true })
  addressSnapshot: string;

  @Column({ type: 'tinyint', default: OrderStatus.PENDING_PAYMENT })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  payAmount: number;

  @Column({ type: 'tinyint', default: PayStatus.UNPAID })
  payStatus: PayStatus;

  @Column({ length: 64, nullable: true })
  wxTransactionId: string;

  @Column({ length: 500, nullable: true })
  remark: string;

  @Column({ type: 'int', nullable: true })
  estimatedMinutes: number;

  @Column({ length: 200, nullable: true })
  rejectReason: string;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  finishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('OrderItem', 'order', { cascade: true, eager: true })
  items: any[];
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  orderId: number;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'bigint' })
  dishId: number;

  @Column({ length: 100 })
  dishName: string;

  @Column({ length: 255, nullable: true })
  dishImage: string;

  @Column({ length: 50, nullable: true })
  specName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ length: 200, nullable: true })
  remark: string;
}
