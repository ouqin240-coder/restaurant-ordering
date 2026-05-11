// src/modules/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopSettings } from '../../entities/shop.entity';
import { Promotion, PromotionType } from '../../entities/promotion.entity';
import { Coupon } from '../../entities/promotion.entity';

function genCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(ShopSettings) private shopRepo: Repository<ShopSettings>,
    @InjectRepository(Promotion) private promoRepo: Repository<Promotion>,
    @InjectRepository(Coupon) private couponRepo: Repository<Coupon>,
  ) {}

  async getSettings(): Promise<ShopSettings> {
    let settings = await this.shopRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.shopRepo.create({ id: 1 });
      await this.shopRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(dto: Partial<ShopSettings>): Promise<ShopSettings> {
    await this.shopRepo.save({ ...dto, id: 1 });
    return this.getSettings();
  }

  // ─── 营业开关 ───
  async toggleOpen(isOpen: boolean) {
    await this.shopRepo.update(1, { isOpen });
    return { isOpen };
  }

  // ─── 满减活动 ───
  async getPromotions() {
    return this.promoRepo.find({ order: { threshold: 'ASC' } });
  }

  async createPromotion(dto: {
    type: PromotionType;
    name: string;
    threshold: number;
    value: number;
    startAt?: Date;
    endAt?: Date;
  }) {
    return this.promoRepo.save(this.promoRepo.create(dto));
  }

  async updatePromotion(id: number, dto: Partial<Promotion>) {
    await this.promoRepo.update(id, dto);
    return this.promoRepo.findOne({ where: { id } });
  }

  async deletePromotion(id: number) {
    await this.promoRepo.delete(id);
    return { success: true };
  }

  // ─── 优惠券 ───
  async getCoupons(params: { page?: number; pageSize?: number; isUsed?: boolean }) {
    const { page = 1, pageSize = 20, isUsed } = params;
    const qb = this.couponRepo.createQueryBuilder('c').orderBy('c.createdAt', 'DESC');
    if (isUsed !== undefined) qb.where('c.isUsed = :isUsed', { isUsed });
    const [list, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return { total, list };
  }

  async batchCreateCoupons(dto: {
    count: number;
    amount: number;
    minAmount?: number;
    expiredAt?: Date;
    name?: string;
  }) {
    const { count, amount, minAmount = 0, expiredAt, name } = dto;
    const templateId = Date.now(); // 用时间戳做批次 ID
    const couponName = name || `满${minAmount}减${amount}`;
    const coupons = Array.from({ length: count }, () =>
      this.couponRepo.create({
        code: genCouponCode(),
        amount,
        minAmount,
        expiredAt,
        name: couponName,
        templateId,
        batchTotal: count,
      }),
    );
    await this.couponRepo.save(coupons);
    return { created: coupons.length, codes: coupons.map((c) => c.code), templateId };
  }

  /** 顾客端：领券中心 - 按批次聚合显示可领取的券 */
  async getAvailableCouponsForCustomer(userId: number) {
    const now = new Date();
    // 查所有批次（按 templateId 分组），统计剩余、是否已领
    const templates = await this.couponRepo
      .createQueryBuilder('c')
      .select('c.templateId', 'templateId')
      .addSelect('MIN(c.name)', 'name')
      .addSelect('MIN(c.amount)', 'amount')
      .addSelect('MIN(c.minAmount)', 'minAmount')
      .addSelect('MIN(c.expiredAt)', 'expiredAt')
      .addSelect('MIN(c.batchTotal)', 'batchTotal')
      .addSelect('COUNT(CASE WHEN c.userId IS NULL THEN 1 END)', 'remaining')
      .where('c.templateId IS NOT NULL')
      .andWhere('(c.expiredAt IS NULL OR c.expiredAt > :now)', { now })
      .groupBy('c.templateId')
      .orderBy('MIN(c.createdAt)', 'DESC')
      .getRawMany();

    // 查该用户已领取过的 templateId
    const claimed = await this.couponRepo.find({
      where: { userId } as any,
      select: ['templateId'] as any,
    });
    const claimedSet = new Set(claimed.map((c) => String(c.templateId)));

    return templates.map((t) => ({
      templateId: t.templateId,
      name: t.name,
      amount: parseFloat(t.amount),
      minAmount: parseFloat(t.minAmount),
      expiredAt: t.expiredAt,
      batchTotal: parseInt(t.batchTotal),
      remaining: parseInt(t.remaining),
      alreadyClaimed: claimedSet.has(String(t.templateId)),
    }));
  }

  /** 顾客领取一张优惠券 */
  async claimCoupon(userId: number, templateId: number) {
    // 1. 先检查该用户是否已领取过
    const existing = await this.couponRepo.findOne({
      where: { userId, templateId } as any,
    });
    if (existing) {
      throw new Error('您已领取过该优惠券，每人限领一张');
    }

    // 2. 找一张该批次未被领取的券
    const available = await this.couponRepo.findOne({
      where: { templateId, userId: null as any, isUsed: false },
    });
    if (!available) {
      throw new Error('该券已被领完');
    }

    // 3. 标记为该用户所有
    await this.couponRepo.update(available.id, { userId });
    return { success: true, code: available.code, name: available.name };
  }

  /** 我的优惠券（已领取） */
  async getMyCoupons(userId: number) {
    const list = await this.couponRepo.find({
      where: { userId } as any,
      order: { createdAt: 'DESC' },
    });
    const now = new Date();
    return list.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      amount: parseFloat(String(c.amount)),
      minAmount: parseFloat(String(c.minAmount)),
      isUsed: c.isUsed,
      usedAt: c.usedAt,
      expiredAt: c.expiredAt,
      isExpired: c.expiredAt ? new Date(c.expiredAt) < now : false,
      usable: !c.isUsed && (!c.expiredAt || new Date(c.expiredAt) >= now),
    }));
  }

  /** 批量删除优惠券 */
  async batchDeleteCoupons(ids: number[]) {
    if (!ids || ids.length === 0) return { deleted: 0 };
    await this.couponRepo.delete(ids);
    return { deleted: ids.length };
  }

  async validateCoupon(code: string, orderAmount: number) {
    const coupon = await this.couponRepo.findOne({ where: { code, isUsed: false } });
    if (!coupon) return { valid: false, reason: '优惠券不存在或已使用' };
    if (coupon.expiredAt && new Date() > coupon.expiredAt) {
      return { valid: false, reason: '优惠券已过期' };
    }
    if (orderAmount < coupon.minAmount) {
      return { valid: false, reason: `需满 ¥${coupon.minAmount} 方可使用` };
    }
    return { valid: true, coupon, discountAmount: coupon.amount };
  }
}
