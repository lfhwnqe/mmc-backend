import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, ConfirmSignUpDto, LoginDto } from './dto/auth.dto';
import { Request } from 'express';
import { AdminGuard } from './guards/admin.guard';
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

  @Get('user-info')
  async getUserInfo(@Req() req: Request) {
    return this.authService.getUserInfo(req['token']);
  }

  @Post('set-admin')
  @UseGuards(AdminGuard)
  async setUserAsAdmin(@Body() body: { email: string }) {
    console.log('setUserAsAdmin', body);
    return await this.authService.addUserToGroup(body.email, 'admin');
  }

  @Post('remove-admin')
  @UseGuards(AdminGuard)
  async removeUserAsAdmin(@Body() body: { email: string }) {
    return await this.authService.removeUserFromGroup(body.email, 'admin');
  }

  @Get('user-groups')
  async getUserGroups(@Req() req: Request) {
    return await this.authService.getUserGroups(req['token']);
  }

  @Get('is-admin')
  async isAdmin(@Req() req: Request) {
    return await this.authService.isUserInGroup(req['token'], 'admin');
  }

  @Get('users')
  @UseGuards(AdminGuard)
  async getUsers() {
    return await this.authService.listUsers();
  }

  @Post('registration-setting')
  @UseGuards(AdminGuard)
  async setRegistrationEnabled(@Body() body: { enabled: boolean }) {
    return await this.authService.setRegistrationEnabled(body.enabled);
  }

  @Get('registration-setting')
  @UseGuards(AdminGuard)
  async getRegistrationSetting() {
    return await this.authService.isRegistrationEnabled();
  }
} 