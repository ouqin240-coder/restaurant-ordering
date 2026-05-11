import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PayStatus } from '../../entities/order.entity';
import { DiningTable, TableStatus } from '../../entities/table.entity';

@Injectable()
export class MerchantService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(DiningTable) private tableRepo: Repository<DiningTable>,
  ) {}

  /** 营业概览 */
  async getOverview(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const yesterday = new Date(new Date(targetDate).getTime() - 86400000).toISOString().split('T')[0];

    const getStats = async (d: string) => {
      return this.orderRepo
        .createQueryBuilder('o')
        .select('COUNT(*)', 'orderCount')
        .addSelect('COALESCE(SUM(o.payAmount), 0)', 'revenue')
        .addSelect('COALESCE(AVG(o.payAmount), 0)', 'avgAmount')
        .where('DATE(o.createdAt) = :date', { date: d })
        .andWhere('o.payStatus = :paid', { paid: PayStatus.PAID })
        .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
        .getRawOne();
    };

    const [today, prev] = await Promise.all([getStats(targetDate), getStats(yesterday)]);

    const revenue = parseFloat(today.revenue) || 0;
    const prevRevenue = parseFloat(prev.revenue) || 0;
    const orderCount = parseInt(today.orderCount) || 0;
    const avgAmount = parseFloat(today.avgAmount) || 0;

    // 待处理订单数（状态=待接单）
    const pendingResult = await this.orderRepo
      .createQueryBuilder('o')
      .select('COUNT(*)', 'cnt')
      .where('o.status = :status', { status: OrderStatus.PENDING_ACCEPT })
      .andWhere('o.payStatus = :paid', { paid: PayStatus.PAID })
      .getRawOne();
    const pendingCount = parseInt(pendingResult.cnt) || 0;

    return {
      date: targetDate,
      revenue,
      orderCount,
      avgAmount,
      pendingCount,
      revenueGrowth: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue * 100).toFixed(1) : null,
      orderCountGrowth: parseInt(prev.orderCount) > 0
        ? ((orderCount - parseInt(prev.orderCount)) / parseInt(prev.orderCount) * 100).toFixed(1)
        : null,
    };
  }

  /** 菜品销量排行 */
  async getDishRank(startDate: string, endDate: string) {
    return this.orderRepo.manager
      .createQueryBuilder()
      .select('oi.dishName', 'dishName')
      .addSelect('COALESCE(MAX(d.imageUrl), MAX(oi.dishImage))', 'dishImage')
      .addSelect('SUM(oi.quantity)', 'totalQty')
      .addSelect('SUM(oi.price * oi.quantity)', 'totalRevenue')
      .from('order_items', 'oi')
      .innerJoin('orders', 'o', 'o.id = oi.orderId')
      .leftJoin('dishes', 'd', 'd.name = oi.dishName')
      .where('DATE(o.createdAt) BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.payStatus = :paid', { paid: PayStatus.PAID })
      .groupBy('oi.dishName')
      .orderBy('totalQty', 'DESC')
      .limit(20)
      .getRawMany();
  }

  /** 营收趋势（日/周/月） */
  async getRevenueTrend(type: 'day' | 'week' | 'month' | 'year', count = 7) {
    const dateFormat = type === 'month' || type === 'year' ? '%Y-%m' : '%Y-%m-%d';
    const days = type === 'year' ? 365 : (type === 'month' ? count * 30 : count);

    return this.orderRepo.manager
      .createQueryBuilder()
      .select(`DATE_FORMAT(o.createdAt, '${dateFormat}')`, 'date')
      .addSelect('COALESCE(SUM(o.payAmount), 0)', 'revenue')
      .addSelect('COUNT(*)', 'orderCount')
      .from('orders', 'o')
      .where(`o.createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`)
      .andWhere('o.payStatus = :paid', { paid: PayStatus.PAID })
      .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  /** 桌台管理 */
  async getTables() {
    return this.tableRepo.find({ order: { area: 'ASC', tableNo: 'ASC' } });
  }

  async createTable(data: { tableNo: string; area?: string; capacity?: number }) {
    const table = this.tableRepo.create(data);
    return this.tableRepo.save(table);
  }

  async updateTableStatus(id: number, status: TableStatus) {
    await this.tableRepo.update(id, { status });
    return this.tableRepo.findOne({ where: { id } });
  }

  async deleteTable(id: number) {
    await this.tableRepo.delete(id);
    return { success: true };
  }
}
