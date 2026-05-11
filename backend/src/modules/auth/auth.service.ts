import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { Merchant } from '../../entities/merchant.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Merchant) private merchantRepo: Repository<Merchant>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /** 微信顾客端登录：code换openid，生成JWT */
  async wxLogin(code: string, scene?: string) {
    // 1. 调用微信 jscode2session 接口
    const appid = this.config.get('WX_APPID');
    const secret = this.config.get('WX_SECRET');
    let openid: string;
    let sessionKey: string;

    // 开发模式 mock：code 以 mock_ 开头直接跳过微信 API
    if (code.startsWith('mock_')) {
      openid = 'dev_user_fixed';
    } else {
      try {
        const res = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
          params: { appid, secret, js_code: code, grant_type: 'authorization_code' },
          timeout: 5000,
        });
        if (res.data.errcode) {
          throw new BadRequestException(`微信登录失败: ${res.data.errmsg}`);
        }
        openid = res.data.openid;
        sessionKey = res.data.session_key;
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('微信服务调用失败，请稍后重试');
      }
    }

    // 2. 查找或创建用户
    let user = await this.userRepo.findOne({ where: { openid } });
    if (!user) {
      user = this.userRepo.create({ openid });
      await this.userRepo.save(user);
    }

    // 3. 解析场景参数（桌号）
    let tableNo: string | null = null;
    if (scene) {
      // scene 格式: table_A3 或 takeaway
      const match = scene.match(/^table_(.+)$/);
      tableNo = match ? match[1] : null;
    }

    // 4. 签发 JWT
    const token = this.jwtService.sign(
      { sub: user.id, openid: user.openid, type: 'customer' },
      { expiresIn: this.config.get('JWT_EXPIRES_IN', '24h') },
    );

    return { token, openid: user.openid, userId: user.id, tableNo };
  }

  /** 商家后台登录：用户名密码 */
  async merchantLogin(username: string, password: string) {
    const merchant = await this.merchantRepo.findOne({ where: { username, isActive: true } });
    if (!merchant) throw new UnauthorizedException('账号不存在或已禁用');

    const valid = await bcrypt.compare(password, merchant.password);
    if (!valid) throw new UnauthorizedException('密码错误');

    // 更新最后登录时间
    await this.merchantRepo.update(merchant.id, { lastLoginAt: new Date() });

    const token = this.jwtService.sign(
      { sub: merchant.id, username: merchant.username, role: merchant.role, type: 'merchant' },
      { expiresIn: this.config.get('JWT_MERCHANT_EXPIRES_IN', '8h') },
    );

    return { token, merchantId: merchant.id, name: merchant.name, role: merchant.role };
  }

  /** 验证 JWT payload（供守卫使用） */
  async validatePayload(payload: any) {
    if (payload.type === 'customer') {
      return this.userRepo.findOne({ where: { id: payload.sub, isActive: true } });
    }
    if (payload.type === 'merchant') {
      return this.merchantRepo.findOne({ where: { id: payload.sub, isActive: true } });
    }
    return null;
  }
}
