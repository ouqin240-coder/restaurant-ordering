// src/modules/settings/settings.controller.ts
import { Controller, Get, Put, Post, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { MerchantGuard } from '../../common/guards/auth.guard';
import { PromotionType } from '../../entities/promotion.entity';

@ApiTags('营业设置')
@ApiBearerAuth()
@UseGuards(MerchantGuard)
@Controller('merchant/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getSettings() { return this.settingsService.getSettings(); }

  @Put()
  updateSettings(@Body() body: any) { return this.settingsService.updateSettings(body); }

  @Put('toggle-open')
  toggleOpen(@Body('isOpen') isOpen: boolean) { return this.settingsService.toggleOpen(isOpen); }

  // 满减活动
  @Get('promotions')
  getPromotions() { return this.settingsService.getPromotions(); }

  @Post('promotions')
  createPromotion(@Body() body: {
    type: PromotionType; name: string; threshold: number; value: number;
    startAt?: Date; endAt?: Date;
  }) { return this.settingsService.createPromotion(body); }

  @Put('promotions/:id')
  updatePromotion(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.settingsService.updatePromotion(id, body);
  }

  @Delete('promotions/:id')
  deletePromotion(@Param('id', ParseIntPipe) id: number) {
    return this.settingsService.deletePromotion(id);
  }

  // 优惠券
  @Get('coupons')
  getCoupons(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('isUsed') isUsed?: string,
  ) {
    return this.settingsService.getCoupons({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      isUsed: isUsed !== undefined ? isUsed === 'true' : undefined,
    });
  }

  @Post('coupons/batch')
  batchCreateCoupons(@Body() body: { count: number; amount: number; minAmount?: number; expiredAt?: Date; name?: string }) {
    return this.settingsService.batchCreateCoupons(body);
  }

  @Post('coupons/batch-delete')
  batchDeleteCoupons(@Body() body: { ids: number[] }) {
    return this.settingsService.batchDeleteCoupons(body.ids);
  }
}

// Coupon validation (顾客端使用)
@ApiTags('优惠券')
@Controller('coupons')
export class CouponController {
  constructor(private settingsService: SettingsService) {}

  @Get('validate')
  validateCoupon(@Query('code') code: string, @Query('amount') amount: string) {
    return this.settingsService.validateCoupon(code, parseFloat(amount));
  }
}

// 顾客端：领券中心 + 我的券
@ApiTags('顾客优惠券')
@Controller('customer/coupons')
export class CustomerCouponController {
  constructor(private settingsService: SettingsService) {}

  @Get('available')
  async getAvailable(@Query('userId') userId: string) {
    return this.settingsService.getAvailableCouponsForCustomer(parseInt(userId));
  }

  @Post('claim')
  async claim(@Body() body: { userId: number; templateId: number }) {
    try {
      return await this.settingsService.claimCoupon(body.userId, body.templateId);
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  @Get('mine')
  async getMine(@Query('userId') userId: string) {
    return this.settingsService.getMyCoupons(parseInt(userId));
  }
}

// 顾客端公开店铺信息（含 DIY 主题配置）
@ApiTags('店铺信息')
@Controller('shop')
export class ShopInfoController {
  constructor(private settingsService: SettingsService) {}

  @Get('info')
  async getShopInfo() {
    const s = await this.settingsService.getSettings();
    return {
      name: s.name,
      isOpen: s.isOpen,
      announcement: s.announcement,
      logoUrl: s.logoUrl,
      themeConfig: s.themeConfig || {},
    };
  }
}
