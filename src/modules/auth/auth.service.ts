import { Injectable } from '@nestjs/common';
import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly clientId: string;

  constructor(private configService: ConfigService) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get('AWS_REGION'),
    });
    
    this.userPoolId = this.configService.get('USER_POOL_ID');
    this.clientId = this.configService.get('USER_POOL_CLIENT_ID');

    console.log('Auth Service Configuration:', {
      region: this.configService.get('AWS_REGION'),
      userPoolId: this.userPoolId,
      clientId: this.clientId,
    });
  }

  async register(email: string, password: string) {
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: email,
      Password: password,
    });

    try {
      const response = await this.cognitoClient.send(command);
      return {
        success: true,
        message: '注册成功，请查收验证码邮件',
        data: response,
      };
    } catch (error) {
      throw error;
    }
  }

  async confirmSignUp(email: string, code: string) {
    const command = new ConfirmSignUpCommand({
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: code,
    });

    try {
      await this.cognitoClient.send(command);
      return {
        success: true,
        message: '邮箱验证成功',
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string) {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    try {
      const response = await this.cognitoClient.send(command);
      return {
        success: true,
        message: '登录成功',
        data: {
          accessToken: response.AuthenticationResult.AccessToken,
          refreshToken: response.AuthenticationResult.RefreshToken,
        },
      };
    } catch (error) {
      throw error;
    }
  }
} 