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
    // 检查是否在白名单中
    if (whiteList.includes(req.originalUrl)) {
      return next();
    }

    // 1. 先尝试从 cookie 中获取 token
    const tokenFromCookie = req.cookies?.accessToken;

    // 2. 如果 cookie 中没有，再尝试从 Authorization header 中获取
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    // 使用 cookie 中的 token 或 header 中的 token
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.verifier.verify(token);
      // 将 token 和用户信息保存到请求对象中
      req['token'] = token;
      req['user'] = payload;
      next();
    } catch (err) {
      console.error('Token verification failed:', err);
      throw new UnauthorizedException('Invalid token');
    }
  }
} 