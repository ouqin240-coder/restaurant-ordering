// orders.controller.ts
import { Controller, Get, Post, Put, Body, Param, Query, ParseIntPipe, UseGuards, Req, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService, CreateOrderDto } from './orders.service';
import { JwtAuthGuard, MerchantGuard } from '../../common/guards/auth.guard';
import { OrderStatus } from '../../entities/order.entity';

/** 顾客端订单接口 */
@ApiTags('订单-顾客')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get(':orderNo')
  getOrder(@Param('orderNo') orderNo: string, @Req() req: any) {
    return this.ordersService.getOrderByNo(orderNo, req.user.id);
  }

  @Get()
  getUserOrders(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('status') status?: string,
  ) {
    return this.ordersService.getUserOrders(req.user.id, parseInt(page), parseInt(pageSize), status);
  }
}

/** 商家端订单接口 */
@ApiTags('订单-商家')
@ApiBearerAuth()
@UseGuards(MerchantGuard)
@Controller('merchant/orders')
export class MerchantOrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  getOrders(
    @Query('status') status?: string,
    @Query('orderType') orderType?: string,
    @Query('date') date?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.ordersService.getMerchantOrders({
      status: status !== undefined ? parseInt(status) as OrderStatus : undefined,
      orderType: orderType !== undefined ? parseInt(orderType) : undefined,
      date,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  @Put(':id/accept')
  @HttpCode(200)
  accept(
    @Param('id', ParseIntPipe) id: number,
    @Body('estimatedMinutes') estimatedMinutes?: number,
  ) {
    return this.ordersService.acceptOrder(id, estimatedMinutes);
  }

  @Put(':id/reject')
  @HttpCode(200)
  reject(@Param('id', ParseIntPipe) id: number, @Body('reason') reason: string) {
    return this.ordersService.rejectOrder(id, reason);
  }

  @Put(':id/status')
  @HttpCode(200)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: OrderStatus) {
    return this.ordersService.updateOrderStatus(id, status);
  }

  @Get('stats/today')
  getTodayStats() {
    return this.ordersService.getTodayStats();
  }
}
