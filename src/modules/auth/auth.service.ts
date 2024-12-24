import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand, ConfirmSignUpCommand, ResendConfirmationCodeCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, AdminListGroupsForUserCommand, ListUsersCommand, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from "aws-jwt-verify";

@Injectable()
export class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly clientId: string;
  private verifier: any;

  constructor(private configService: ConfigService) {
    console.log('当前环境:', process.env.NODE_ENV);
    console.log('AWS凭证信息:', {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ? '已设置' : '未设置',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? '已设置' : '未设置',
    });
    
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

    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.userPoolId,
      clientId: this.clientId,
      tokenUse: "access",
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
      console.log('register error', error);
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

  async resendCode(email: string) {
    const command = new ResendConfirmationCodeCommand({
      ClientId: this.clientId,
      Username: email,
    });

    try {
      await this.cognitoClient.send(command);
      return {
        success: true,
        message: '验证码已重新发送',
      };
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    return {
      success: true,
      message: '退出登录成功',
    };
  }

  async getUserInfo(token: string) {
    try {
      const payload = await this.verifier.verify(token);
      return {
        success: true,
        data: {
          sub: payload.sub,
          email: payload['cognito:username'] || payload.email || payload.sub,
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async addUserToGroup(email: string, groupName: string) {
    try {
      console.log('addUserToGroup', email, groupName);
      const user = await this.getUserByEmail(email);
      console.log('user', user);
      await this.cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: this.userPoolId,
          Username: user.Username,
          GroupName: groupName,
        })
      );

      return {
        success: true,
        message: '添加用户到组成功',
      };
    } catch (error) {
      return {
        success: false,
        message: '添加用户到组失败',
        error: error.message,
      };
    }
  }

  async removeUserFromGroup(email: string, groupName: string) {
    try {
      const user = await this.getUserByEmail(email);
      
      await this.cognitoClient.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: this.userPoolId,
          Username: user.Username,
          GroupName: groupName,
        })
      );

      return {
        success: true,
        message: '从组中移除用户成功',
      };
    } catch (error) {
      return {
        success: false,
        message: '从组中移除用户失败',
        error: error.message,
      };
    }
  }

  async getUserGroups(token: string) {
    const userCommand = new GetUserCommand({
      AccessToken: token,
    });
    const user = await this.cognitoClient.send(userCommand);

    const groupsCommand = new AdminListGroupsForUserCommand({
      UserPoolId: this.userPoolId,
      Username: user.Username,
    });
    return this.cognitoClient.send(groupsCommand);
  }

  async isUserInGroup(token: string, groupName: string) {
    try {
      const groups = await this.getUserGroups(token);
      const isAdmin = groups.Groups.some(group => group.GroupName === groupName);
      
      return {
        success: true,
        data: isAdmin,
      };
    } catch (error) {
      return {
        success: false,
        message: '检查用户组失败',
        error: error.message,
      };
    }
  }

  private async getUserByEmail(email: string) {
    const command = new ListUsersCommand({
      UserPoolId: this.userPoolId,
      Filter: `email = "${email}"`,
    });
    const users = await this.cognitoClient.send(command);

    if (!users.Users || users.Users.length === 0) {
      throw new Error('User not found');
    }

    return users.Users[0];
  }

  async listUsers() {
    try {
      const command = new ListUsersCommand({
        UserPoolId: this.userPoolId,
      });
      
      const users = await this.cognitoClient.send(command);
      
      const usersWithGroups = await Promise.all(
        users.Users.map(async (user) => {
          const groups = await this.cognitoClient.send(
            new AdminListGroupsForUserCommand({
              UserPoolId: this.userPoolId,
              Username: user.Username,
            })
          );
          
          return {
            email: user.Attributes.find(attr => attr.Name === 'email')?.Value,
            isAdmin: groups.Groups.some(group => group.GroupName === 'admin'),
          };
        })
      );
      
      return {
        success: true,
        data: {
          users: usersWithGroups,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: '获取用户列表失败',
        error: error.message,
      };
    }
  }
} 