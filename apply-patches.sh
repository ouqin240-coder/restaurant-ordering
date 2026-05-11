#!/bin/bash
# 重新构建后端后必须运行此脚本，恢复 4 个关键补丁
set -e
echo "正在打补丁..."

docker exec restaurant_backend sh -c '
# 补丁 1: 去掉响应包装
cat > /app/dist/common/interceptors/response.interceptor.js << "JSEOF"
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let ResponseInterceptor = class ResponseInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => data));
    }
};
exports.ResponseInterceptor = ResponseInterceptor;
exports.ResponseInterceptor = ResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], ResponseInterceptor);
JSEOF
sed -i "s|new common_1.ValidationPipe({|new common_1.ValidationPipe({ transformOptions: { enableImplicitConversion: true },|" /app/dist/main.js
sed -i "s|.groupBy(\"oi.dishId\")|.groupBy(\"oi.dishId\").addGroupBy(\"oi.dishName\").addGroupBy(\"oi.dishImage\")|g" /app/dist/modules/merchant/merchant.service.js
sed -i "s|dishMap.get(Number(cat.id))|dishMap.get(String(cat.id))|g" /app/dist/modules/menu/menu.service.js
sed -i "s|dishMap.get(d.categoryId)|dishMap.get(String(d.categoryId))|g" /app/dist/modules/menu/menu.service.js
sed -i "s|dishMap.set(d.categoryId|dishMap.set(String(d.categoryId)|g" /app/dist/modules/menu/menu.service.js
'

echo "重启后端..."
docker restart restaurant_backend
sleep 15
echo "✅ 4 个补丁已应用并重启"

curl -s http://localhost:3000/v1/menu/categories-with-dishes | python3 -c "import json,sys; d=json.load(sys.stdin); print('✅ 验证：分类数:',len(d),'第一类菜品数:',len(d[0]['dishes']))" || echo "⚠️ 验证失败"
