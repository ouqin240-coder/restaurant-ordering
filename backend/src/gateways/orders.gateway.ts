import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 商家连接 map: merchantId → socketId[]
  private merchantSockets = new Map<number, Set<string>>();
  // 顾客连接 map: orderNo → socketId
  private customerSockets = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token as string;
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET', 'fallback-secret'),
      });

      client.data.userId = payload.sub;
      client.data.userType = payload.type;
      client.data.role = payload.role;

      if (payload.type === 'merchant') {
        // 加入商家房间
        const room = `merchant_${payload.sub}`;
        client.join(room);
        client.join('merchants'); // 广播给所有商家
        if (!this.merchantSockets.has(payload.sub)) {
          this.merchantSockets.set(payload.sub, new Set());
        }
        this.merchantSockets.get(payload.sub)!.add(client.id);
        console.log(`Merchant ${payload.sub} connected: ${client.id}`);
      } else {
        // 顾客加入自己的房间
        client.join(`user_${payload.sub}`);
        console.log(`Customer ${payload.sub} connected: ${client.id}`);
      }
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (client.data.userType === 'merchant' && userId) {
      const sockets = this.merchantSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.merchantSockets.delete(userId);
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  /** 顾客订阅特定订单状态 */
  @SubscribeMessage('subscribe_order')
  subscribeOrder(@ConnectedSocket() client: Socket, @MessageBody() orderNo: string) {
    client.join(`order_${orderNo}`);
    this.customerSockets.set(orderNo, client.id);
    return { event: 'subscribed', orderNo };
  }

  /** 推送新订单给商家（所有在线商家） */
  notifyMerchantNewOrder(order: any) {
    this.server.to('merchants').emit('new_order', {
      type: 'new_order',
      data: order,
      sound: true,
      timestamp: new Date().toISOString(),
    });
    console.log(`📢 New order pushed to merchants: ${order.orderNo}`);
  }

  /** 推送订单状态变更给顾客 */
  notifyOrderStatusChange(order: any) {
    this.server.to(`order_${order.orderNo}`).emit('order_status_changed', {
      orderNo: order.orderNo,
      status: order.status,
      statusText: order.statusText,
      estimatedMinutes: order.estimatedMinutes,
    });
    // 同时推送给顾客自己的房间
    this.server.to(`user_${order.userId}`).emit('order_status_changed', {
      orderNo: order.orderNo,
      status: order.status,
    });
  }

  /** 推送给 KDS 厨房屏 */
  notifyKitchenNewOrder(order: any) {
    this.server.to('kitchen').emit('kitchen_new_order', { data: order });
  }
}
