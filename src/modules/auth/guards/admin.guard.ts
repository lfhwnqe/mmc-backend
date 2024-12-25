import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.token;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const isAdminResponse = await this.authService.isUserInGroup(
      token,
      'admin',
    );
    console.log('isAdminResponse', isAdminResponse);
    if (!isAdminResponse.success || !isAdminResponse.data) {
      throw new UnauthorizedException('Admin access required');
    }

    return true;
  }
}
