import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.entity';

export enum DishStatus {
  OFFLINE = 0,
  ONLINE = 1,
  SOLD_OUT = 2,
}

@Entity('dishes')
export class Dish {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  categoryId: number;

  @ManyToOne(() => Category, (c) => c.dishes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  monthlySales: number;

  @Column({ type: 'tinyint', default: DishStatus.ONLINE })
  status: DishStatus;

  @Column({ default: 0 })
  sortNo: number;

  @Column({ default: false })
  isRecommend: boolean;

  @Column({ length: 200, nullable: true })
  tags: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('DishSpec', 'dish', { cascade: true, eager: true })
  specs: any[];
}

@Entity('dish_specs')
export class DishSpec {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  dishId: number;

  @ManyToOne(() => Dish, (d) => d.specs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dishId' })
  dish: Dish;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceDelta: number;
}
