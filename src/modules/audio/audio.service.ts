import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AudioService {
  private s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
    });
    
    const bucketName = this.configService.get('AUDIO_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('AUDIO_BUCKET_NAME is not configured');
    }
    this.bucketName = bucketName;
    
    console.log('Audio Service Configuration:', {
      region: this.configService.get('AWS_REGION'),
      bucketName: this.bucketName,
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
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // URL 有效期1小时
    });

    return {
      success: true,
      data: {
        url: signedUrl,
      },
    };
  }
} 