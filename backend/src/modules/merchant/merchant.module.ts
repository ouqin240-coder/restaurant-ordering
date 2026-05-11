import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { Order, OrderItem } from '../../entities/order.entity';
import { DiningTable } from '../../entities/table.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, DiningTable])],
  providers: [MerchantService],
  controllers: [MerchantController],
  exports: [MerchantService],
})
export class MerchantModule {}
