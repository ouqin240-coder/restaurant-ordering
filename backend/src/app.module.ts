import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadModule } from './modules/upload/upload.module';
import { GatewayModule } from './gateways/gateway.module';
import { OrdersGateway } from './gateways/orders.gateway';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // 数据库
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.get('DB_HOST', 'localhost'),
        port: cfg.get<number>('DB_PORT', 3306),
        username: cfg.get('DB_USER', 'root'),
        password: cfg.get('DB_PASS', ''),
        database: cfg.get('DB_NAME', 'restaurant_ordering'),
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        synchronize: cfg.get('NODE_ENV') !== 'production',
        logging: cfg.get('NODE_ENV') === 'development',
        charset: 'utf8mb4',
        timezone: '+08:00',
      }),
    }),

    // 限流
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // 业务模块
    AuthModule,
    MenuModule,
    OrdersModule,
    MerchantModule,
    PaymentModule,
    SettingsModule,
    UploadModule,
    GatewayModule,
  ],
  providers: [],
})
export class AppModule {}
