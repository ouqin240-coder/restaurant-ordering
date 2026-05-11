import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { OrdersModule } from '../orders/orders.module';
import { GatewayModule } from '../../gateways/gateway.module';

@Module({
  imports: [forwardRef(() => OrdersModule), forwardRef(() => GatewayModule)],
  controllers: [PaymentController],
})
export class PaymentModule {}
