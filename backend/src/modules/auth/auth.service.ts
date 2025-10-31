import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { SendOtpDto, VerifyOtpDto, SocialLoginDto, TokenResponseDto, UserProfileDto } from '../../common/dtos/auth.dto';
import * as twilio from 'twilio';

@Injectable()
export class AuthService {
  private twilioClient: any;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
  ) {
    // Initialize Twilio if credentials available
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
    }
  }

  // ============================================
  // PHONE OTP
  // ============================================
  async sendPhoneOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const code = this.generateOtp();
    const redisKey = `otp:phone:${dto.phone}`;
    
    // Store OTP in Redis with 10 minute expiry
    await this.redis.set(redisKey, code, 600);

    // Send SMS via Twilio
    if (this.twilioClient) {
      try {
        await this.twilioClient.messages.create({
          body: `Your Club app verification code is: ${code}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: dto.phone,
        });
      } catch (error) {
        console.error('Twilio SMS error:', error);
        // In development, just log it
        if (process.env.NODE_ENV === 'production') {
          throw new BadRequestException('Failed to send OTP');
        }
      }
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyPhoneOtp(dto: VerifyOtpDto): Promise<TokenResponseDto> {
    const redisKey = `otp:phone:${dto.phone}`;
    const storedCode = await this.redis.get(redisKey);

    if (!storedCode || storedCode !== dto.code) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Clean up OTP
    await this.redis.del(redisKey);

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          phoneVerified: true,
        },
      });
    } else {
      // Mark as verified
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    return this.generateTokens(user);
  }

  // ============================================
  // SOCIAL LOGIN
  // ============================================
  async socialLogin(dto: SocialLoginDto): Promise<TokenResponseDto> {
    // TODO: Verify token with respective social provider
    // This is a placeholder - implement actual OAuth verification
    
    const socialField = `${dto.provider}Id`;
    
    // Find existing user by social ID
    let user = await this.prisma.user.findUnique({
      where: {
        [socialField]: dto.accessToken, // In real implementation, use actual social ID
      } as any, // Type assertion to handle dynamic field access
    });

    if (!user) {
      // Create new user with social account
      user = await this.prisma.user.create({
        data: {
          [socialField]: dto.accessToken,
        },
      });
    }

    return this.generateTokens(user);
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================
  private async generateTokens(user: any, skipRedis: boolean = false): Promise<TokenResponseDto> {
    const payload = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });

    // Store refresh token in Redis (skip for test-login)
    if (!skipRedis) {
      try {
        await this.redis.set(
          `refresh_token:${user.id}`,
          refreshToken,
          7 * 24 * 60 * 60, // 7 days
        );
      } catch (error) {
        // Redis is optional for development
        console.warn('⚠️ Warning: Could not store refresh token in Redis:', error.message);
      }
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
      user: this.mapUserToProfile(user),
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ============================================
  // DEVELOPMENT TEST LOGIN (REMOVE IN PRODUCTION)
  // ============================================
  async testLogin(identifier: string): Promise<TokenResponseDto> {
    // This is development-only! Returns a valid JWT without OTP.
    // Use this for testing only - REMOVE before production!
    
    try {
      console.log('⚠️ DEV MODE: Test login called for:', identifier);

      // Create a mock user object (in production, this would be from database)
      const mockUser = {
        id: `test_${Date.now()}`,
        phone: identifier.includes('@') ? null : identifier,
        email: identifier.includes('@') ? identifier : `test+${Date.now()}@desh.co`,
        displayName: 'Test Bartender',
        profileImage: null,
        bio: 'Test user for development',
        phoneVerified: true,
        emailVerified: true,
        createdAt: new Date(),
      };

      console.log('✅ DEV MODE: Generating test tokens for user:', mockUser.id);

      return this.generateTokens(mockUser, true); // Pass true to skipRedis
    } catch (error) {
      console.error('❌ Test login error:', error);
      throw error;
    }
  }

  // ============================================
  // UTILITIES
  // ============================================
  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private mapUserToProfile(user: any): UserProfileDto {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      displayName: user.displayName,
      profileImage: user.profileImage,
      bio: user.bio,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }

  async getCurrentUser(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToProfile(user);
  }
}
