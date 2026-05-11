import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Category } from '../../entities/category.entity';
import { Dish, DishStatus } from '../../entities/dish.entity';

export class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() iconUrl?: string;
  @IsOptional() @IsNumber() sortNo?: number;
}

export class CreateDishDto {
  @IsNumber() categoryId: number;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsNumber() price: number;
  @IsOptional() @IsNumber() sortNo?: number;
  @IsOptional() @IsBoolean() isRecommend?: boolean;
  @IsOptional() @IsString() tags?: string;
  @IsOptional() specs?: Array<{ name: string; priceDelta: number }>;
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Dish) private dishRepo: Repository<Dish>,
  ) {}

  /** 获取完整菜单（分类+菜品，带Redis缓存） */
  async getFullMenu() {
    const categories = await this.categoryRepo.find({
      where: { isActive: true },
      order: { sortNo: 'ASC', createdAt: 'ASC' },
    });

    const dishes = await this.dishRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.specs', 'specs')
      .where('d.status = :status', { status: DishStatus.ONLINE })
      .orWhere('d.status = :soldOut', { soldOut: DishStatus.SOLD_OUT })
      .orderBy('d.sortNo', 'ASC')
      .addOrderBy('d.monthlySales', 'DESC')
      .getMany();

    // 将菜品按分类分组
    const dishMap = new Map<string, Dish[]>();
    dishes.forEach((d) => {
      const list = dishMap.get(String(d.categoryId)) || [];
      list.push(d);
      dishMap.set(String(d.categoryId), list);
    });

    return categories.map((cat) => ({
      ...cat,
      dishes: dishMap.get(String(cat.id)) || [],
    }));
  }

  /** 获取推荐菜品 */
  async getRecommended() {
    return this.dishRepo.find({
      where: { isRecommend: true, status: DishStatus.ONLINE },
      order: { monthlySales: 'DESC' },
      take: 10,
    });
  }

  /** 获取热销榜 */
  async getHotList() {
    return this.dishRepo.find({
      where: { status: DishStatus.ONLINE },
      order: { monthlySales: 'DESC' },
      take: 10,
    });
  }

  /** 搜索菜品 */
  async searchDishes(keyword: string) {
    return this.dishRepo
      .createQueryBuilder('d')
      .where('d.name LIKE :kw', { kw: `%${keyword}%` })
      .andWhere('d.status != :off', { off: DishStatus.OFFLINE })
      .leftJoinAndSelect('d.specs', 'specs')
      .take(20)
      .getMany();
  }

  // ─── 商家管理接口 ───

  async getCategories() {
    return this.categoryRepo.find({ order: { sortNo: 'ASC' } });
  }

  async createCategory(dto: CreateCategoryDto) {
    const cat = this.categoryRepo.create(dto);
    return this.categoryRepo.save(cat);
  }

  async updateCategory(id: number, dto: Partial<CreateCategoryDto>) {
    await this.categoryRepo.update(id, dto);
    return this.categoryRepo.findOne({ where: { id } });
  }

  async deleteCategory(id: number) {
    // 检查是否有菜品
    const count = await this.dishRepo.count({ where: { categoryId: id } });
    if (count > 0) throw new Error(`该分类下有 ${count} 道菜品，请先移除菜品`);
    await this.categoryRepo.softDelete(id);
    return { success: true };
  }

  async getDishesByMerchant(categoryId?: number, status?: DishStatus) {
    const qb = this.dishRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.specs', 'specs')
      .orderBy('d.categoryId', 'ASC')
      .addOrderBy('d.sortNo', 'ASC');
    if (categoryId) qb.where('d.categoryId = :categoryId', { categoryId });
    if (status !== undefined) qb.andWhere('d.status = :status', { status });
    return qb.getMany();
  }

  async createDish(dto: CreateDishDto) {
    const dish = this.dishRepo.create({
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      price: dto.price,
      sortNo: dto.sortNo || 0,
      isRecommend: dto.isRecommend || false,
      tags: dto.tags,
    });
    const saved = await this.dishRepo.save(dish);
    return saved;
  }

  async updateDish(id: number, dto: Partial<CreateDishDto>) {
    await this.dishRepo.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.sortNo !== undefined && { sortNo: dto.sortNo }),
      ...(dto.isRecommend !== undefined && { isRecommend: dto.isRecommend }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.categoryId && { categoryId: dto.categoryId }),
    });
    return this.dishRepo.findOne({ where: { id }, relations: ['specs'] });
  }

  async updateDishStatus(id: number, status: DishStatus) {
    await this.dishRepo.update(id, { status });
    return { id, status };
  }

  async batchUpdateStatus(ids: number[], status: DishStatus) {
    await this.dishRepo
      .createQueryBuilder()
      .update()
      .set({ status })
      .whereInIds(ids)
      .execute();
    return { updated: ids.length };
  }

  async deleteDish(id: number) {
    await this.dishRepo.update(id, { status: DishStatus.OFFLINE });
    return { success: true };
  }
}
