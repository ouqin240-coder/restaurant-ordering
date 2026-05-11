// payment.controller.ts
import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { OrdersService } from '../orders/orders.service';
import { OrdersGateway } from '../../gateways/orders.gateway';
import { OrderStatus } from '../../entities/order.entity';

@ApiTags('支付')
@Controller('payments')
export class PaymentController {
  constructor(
    private ordersService: OrdersService,
    private ordersGateway: OrdersGateway,
  ) {}

  /**
   * 微信支付回调（不对外暴露，需配置在微信商户后台）
   * 微信会以 XML 或 JSON(v3) 格式 POST 此接口
   */
  @Post('wx-notify')
  @ApiExcludeEndpoint()
  async wxPayNotify(@Body() body: any, @Headers() headers: any) {
    try {
      // 1. 验证签名（生产环境必须实现）
      // await this.verifyWxSignature(headers, rawBody);

      // 2. 解析回调数据（微信支付v3 JSON格式）
      const { transaction_id: wxTransactionId, out_trade_no: orderNo } = body?.resource?.plaintext
        ? JSON.parse(body.resource.plaintext)  // 实际需 AES-GCM 解密
        : body;

      if (!orderNo) return { code: 'FAIL', message: 'orderNo missing' };

      // 3. 处理支付成功
      const order = await this.ordersService.handlePaymentNotify(wxTransactionId, orderNo);

      // 4. 通过 WebSocket 通知商家后台有新订单
      if (order && 'status' in order && order.status === OrderStatus.PENDING_ACCEPT) {
        this.ordersGateway.notifyMerchantNewOrder(order);
      }

      // 5. 微信要求返回成功响应
      return { code: 'SUCCESS', message: '成功' };
    } catch (err) {
      console.error('WeChat Pay notify error:', err);
      return { code: 'FAIL', message: err.message };
    }
  }
}
