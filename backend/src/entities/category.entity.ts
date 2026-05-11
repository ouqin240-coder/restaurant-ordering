import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Dish } from './dish.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ nullable: true, length: 255 })
  iconUrl: string;

  @Column({ default: 0 })
  sortNo: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Dish, (d) => d.category)
  dishes: Dish[];
}
