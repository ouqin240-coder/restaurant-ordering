import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { MenuController, MerchantMenuController } from './menu.controller';
import { Category } from '../../entities/category.entity';
import { Dish, DishSpec } from '../../entities/dish.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Dish, DishSpec])],
  providers: [MenuService],
  controllers: [MenuController, MerchantMenuController],
  exports: [MenuService],
})
export class MenuModule {}
