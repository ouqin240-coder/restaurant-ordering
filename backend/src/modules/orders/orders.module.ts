import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController, MerchantOrdersController } from './orders.controller';
import { Order, OrderItem } from '../../entities/order.entity';
import { Dish, DishSpec } from '../../entities/dish.entity';
import { DiningTable } from '../../entities/table.entity';
import { Coupon } from '../../entities/promotion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Dish, DishSpec, DiningTable, Coupon])],
  providers: [OrdersService],
  controllers: [OrdersController, MerchantOrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
