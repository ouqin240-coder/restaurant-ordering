// auth.controller.ts
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';

export class WxLoginDto {
  @IsString() code: string;
  @IsOptional() @IsString() scene?: string;
}
export class MerchantLoginDto {
  @IsString() username: string;
  @IsString() password: string;
}

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('wx-login')
  @HttpCode(200)
  @ApiOperation({ summary: '顾客微信登录' })
  wxLogin(@Body() dto: WxLoginDto) {
    return this.authService.wxLogin(dto.code, dto.scene);
  }

  @Post('merchant-login')
  @HttpCode(200)
  @ApiOperation({ summary: '商家后台登录' })
  merchantLogin(@Body() dto: MerchantLoginDto) {
    return this.authService.merchantLogin(dto.username, dto.password);
  }
}
