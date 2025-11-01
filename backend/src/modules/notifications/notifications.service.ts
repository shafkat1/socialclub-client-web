import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';
import AWS from 'aws-sdk';

@Injectable()
export class NotificationsService {
  private logger = new Logger('NotificationsService');
  private sns: AWS.SNS | null = null;

  constructor(private readonly redis: RedisService) {
    if (process.env.AWS_REGION && process.env.SNS_TOPIC_ARN) {
      this.sns = new AWS.SNS({ region: process.env.AWS_REGION });
    }
  }

  async getUserDeviceTokens(userId: string): Promise<string[]> {
    const keys = await this.redis.keys(`user:${userId}:device:*`);
    const tokens: string[] = [];
    for (const key of keys) {
      const raw = await this.redis.get(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.token) tokens.push(parsed.token);
      } catch {
        // ignore
      }
    }
    return tokens;
  }

  async sendTest(userId: string, message: string) {
    const tokens = await this.getUserDeviceTokens(userId);
    if (!this.sns || !process.env.SNS_TOPIC_ARN) {
      // Return tokens so caller can verify registration; real send requires SNS setup
      this.logger.warn('SNS not configured; returning tokens only');
      return { success: false, tokens, note: 'SNS not configured' };
    }
    // Publish a test message; in real flow you would target platform-specific endpoints
    await this.sns
      .publish({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: JSON.stringify({ userId, message, tokens }),
        Subject: 'ClubApp Test Notification',
      })
      .promise();
    return { success: true, tokens };
  }
}


