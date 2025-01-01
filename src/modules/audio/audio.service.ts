import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AudioService {
  private s3Client: S3Client;
  private readonly bucketName: string;
  private readonly cloudfrontDomain: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
    });

    const bucketName = this.configService.get('AUDIO_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('AUDIO_BUCKET_NAME is not configured');
    }
    this.bucketName = bucketName;

    const cloudfrontDomain = this.configService.get('CLOUDFRONT_DOMAIN');
    if (!cloudfrontDomain) {
      throw new Error('CLOUDFRONT_DOMAIN is not configured');
    }
    this.cloudfrontDomain = cloudfrontDomain;

    console.log('Audio Service Configuration:', {
      region: this.configService.get('AWS_REGION'),
      bucketName: this.bucketName,
      cloudfrontDomain: this.cloudfrontDomain,
    });
  }

  async generateUploadUrl(key: string, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // URL 有效期1小时
    });

    return {
      success: true,
      data: {
        uploadUrl: signedUrl,
        key: key,
      },
    };
  }

  async getSignedUrl(key: string) {
    const cloudfrontUrl = `https://${this.cloudfrontDomain}/${key}`;

    return {
      success: true,
      data: {
        url: cloudfrontUrl,
      },
    };
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      return {
        success: true,
        message: '文件删除成功',
      };
    } catch (error) {
      console.error('Delete S3 file error:', error);
      throw error;
    }
  }
}
