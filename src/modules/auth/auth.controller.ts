import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, ConfirmSignUpDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(
      registerDto.email,
      registerDto.password,
    );
  }

  @Post('confirm')
  async confirmSignUp(@Body() confirmDto: ConfirmSignUpDto) {
    return await this.authService.confirmSignUp(
      confirmDto.email,
      confirmDto.code,
    );
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('resend-code')
  async resendCode(@Body() body: { email: string }) {
    return this.authService.resendCode(body.email);
  }

  @Post('logout')
  async logout() {
    return this.authService.logout();
  }
} 