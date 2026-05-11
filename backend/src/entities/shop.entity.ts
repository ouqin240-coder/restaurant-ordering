// src/entities/shop.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('shop_settings')
export class ShopSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, default: '我的餐厅' })
  name: string;

  @Column({ default: true })
  isOpen: boolean;

  @Column({ length: 10, default: '09:00' })
  openTime: string;

  @Column({ length: 10, default: '22:00' })
  closeTime: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minDeliveryAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'int', default: 5000, comment: '配送范围(米)' })
  deliveryRadius: number;

  @Column({ length: 500, nullable: true })
  announcement: string;

  @Column({ length: 500, nullable: true, comment: '店铺LOGO URL' })
  logoUrl: string;

  @Column({ type: 'json', nullable: true, comment: 'DIY主题配置' })
  themeConfig: {
    primaryColor?: string;       // 主色调，如 #FF6034
    backgroundColor?: string;    // 页面背景色
    backgroundImage?: string;    // 页面背景图URL
    categoryIcons?: Record<string, string>;  // 分类图标，如 {"1": "⭐", "2": "🔥"}
  };

  @Column({ default: false, comment: '是否自动接单' })
  autoAccept: boolean;

  @Column({ type: 'int', default: 20, comment: '默认预计制作时间(分钟)' })
  defaultPrepareMinutes: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
