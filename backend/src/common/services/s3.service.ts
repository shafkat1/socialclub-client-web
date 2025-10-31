import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service {
  private s3: AWS.S3;
  private logger = new Logger('S3Service');

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.logger.log('✅ S3 service initialized');
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer | string,
    contentType?: string,
  ): Promise<string> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
    };

    try {
      await this.s3.upload(params).promise();
      const cdnUrl = `${process.env.S3_ASSET_CDN_URL || `https://${bucket}.s3.amazonaws.com`}/${key}`;
      this.logger.log(`✅ Uploaded: ${cdnUrl}`);
      return cdnUrl;
    } catch (error) {
      this.logger.error('S3 upload failed', error);
      throw error;
    }
  }

  async download(bucket: string, key: string): Promise<Buffer> {
    try {
      const data = await this.s3.getObject({ Bucket: bucket, Key: key }).promise();
      return data.Body as Buffer;
    } catch (error) {
      this.logger.error('S3 download failed', error);
      throw error;
    }
  }

  async delete(bucket: string, key: string): Promise<void> {
    try {
      await this.s3.deleteObject({ Bucket: bucket, Key: key }).promise();
      this.logger.log(`✅ Deleted: ${key}`);
    } catch (error) {
      this.logger.error('S3 delete failed', error);
      throw error;
    }
  }
}
