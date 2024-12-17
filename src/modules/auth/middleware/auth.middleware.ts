import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { whiteList } from '../../../config/whitelist.config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private verifier: any;

  constructor(private configService: ConfigService) {
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.configService.get('USER_POOL_ID'),
      clientId: this.configService.get('USER_POOL_CLIENT_ID'),
      tokenUse: 'access',
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    console.log('AuthMiddleware', req.originalUrl);
    console.log('whiteList', whiteList);
    // 检查是否在白名单中
    if (whiteList.includes(req.originalUrl)) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = await this.verifier.verify(token);
      // 将用户信息添加到请求对象中
      req['user'] = payload;
      next();
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
} 