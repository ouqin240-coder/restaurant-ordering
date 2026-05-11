// merchant.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MerchantService } from './merchant.service';
import { MerchantGuard } from '../../common/guards/auth.guard';
import { TableStatus } from '../../entities/table.entity';

@ApiTags('商家-统计与设置')
@ApiBearerAuth()
@UseGuards(MerchantGuard)
@Controller('merchant')
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  @Get('stats/overview')
  getOverview(@Query('date') date?: string) {
    return this.merchantService.getOverview(date);
  }

  @Get('stats/dish-rank')
  getDishRank(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    return this.merchantService.getDishRank(start, end);
  }

  @Get('stats/revenue-trend')
  getRevenueTrend(
    @Query('type') type: 'day' | 'week' | 'month' = 'day',
    @Query('count') count = '7',
  ) {
    return this.merchantService.getRevenueTrend(type, parseInt(count));
  }

  // 桌台管理
  @Get('tables')
  getTables() { return this.merchantService.getTables(); }

  @Post('tables')
  createTable(@Body() body: { tableNo: string; area?: string; capacity?: number }) {
    return this.merchantService.createTable(body);
  }

  @Put('tables/:id/status')
  updateTableStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: TableStatus) {
    return this.merchantService.updateTableStatus(id, status);
  }

  @Delete('tables/:id')
  deleteTable(@Param('id', ParseIntPipe) id: number) {
    return this.merchantService.deleteTable(id);
  }
}
