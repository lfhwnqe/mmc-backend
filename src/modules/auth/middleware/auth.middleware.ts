import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
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
    if (whiteList.includes(req.originalUrl)) {
      return next();
    }

    console.log('req originalUrl:', req.originalUrl);
    
    // 从 Cookie 头中解析 token
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};

    const tokenFromCookie = cookies['accessToken'];
    console.log('Token from cookie:', tokenFromCookie);

    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    console.log('Token from header:', tokenFromHeader);

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.verifier.verify(token);
      req['token'] = token;
      req['user'] = payload;
      next();
    } catch (err) {
      console.error('Token verification failed:', err);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
