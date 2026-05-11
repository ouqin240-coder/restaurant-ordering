import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController, CouponController, ShopInfoController, CustomerCouponController } from './settings.controller';
import { ShopSettings } from '../../entities/shop.entity';
import { Promotion, Coupon } from '../../entities/promotion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShopSettings, Promotion, Coupon])],
  providers: [SettingsService],
  controllers: [SettingsController, CouponController, ShopInfoController, CustomerCouponController],
  exports: [SettingsService],
})
export class SettingsModule {}
