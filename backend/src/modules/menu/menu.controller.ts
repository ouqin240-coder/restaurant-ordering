// menu.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService, CreateCategoryDto, CreateDishDto } from './menu.service';
import { MerchantGuard } from '../../common/guards/auth.guard';
import { DishStatus } from '../../entities/dish.entity';

@ApiTags('菜单')
@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  /** 顾客端：获取完整菜单 */
  @Get('categories-with-dishes')
  getFullMenu() {
    return this.menuService.getFullMenu();
  }

  /** 顾客端：推荐菜品 */
  @Get('recommended')
  getRecommended() {
    return this.menuService.getRecommended();
  }

  /** 顾客端：热销榜 */
  @Get('hot-list')
  getHotList() {
    return this.menuService.getHotList();
  }

  /** 顾客端：搜索 */
  @Get('search')
  searchDishes(@Query('keyword') keyword: string) {
    return this.menuService.searchDishes(keyword || '');
  }
}

@ApiTags('商家-菜品管理')
@ApiBearerAuth()
@UseGuards(MerchantGuard)
@Controller('merchant/menu')
export class MerchantMenuController {
  constructor(private menuService: MenuService) {}

  // 分类管理
  @Get('categories')
  getCategories() { return this.menuService.getCategories(); }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) { return this.menuService.createCategory(dto); }

  @Put('categories/:id')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateCategoryDto>) {
    return this.menuService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseIntPipe) id: number) { return this.menuService.deleteCategory(id); }

  // 菜品管理
  @Get('dishes')
  getDishes(
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
  ) {
    return this.menuService.getDishesByMerchant(
      categoryId ? parseInt(categoryId) : undefined,
      status !== undefined ? parseInt(status) as DishStatus : undefined,
    );
  }

  @Post('dishes')
  createDish(@Body() dto: CreateDishDto) { return this.menuService.createDish(dto); }

  @Put('dishes/:id')
  updateDish(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateDishDto>) {
    return this.menuService.updateDish(id, dto);
  }

  @Put('dishes/:id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: DishStatus) {
    return this.menuService.updateDishStatus(id, status);
  }

  @Post('dishes/batch-status')
  batchStatus(@Body() body: { ids: number[]; status: DishStatus }) {
    return this.menuService.batchUpdateStatus(body.ids, body.status);
  }

  @Delete('dishes/:id')
  deleteDish(@Param('id', ParseIntPipe) id: number) { return this.menuService.deleteDish(id); }
}
