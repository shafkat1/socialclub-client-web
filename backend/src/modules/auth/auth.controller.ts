import { Controller, Post, Body, Get, UseGuards, Request, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SendOtpDto, VerifyOtpDto, SocialLoginDto, TokenResponseDto, UserProfileDto } from '../../common/dtos/auth.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================
  // PHONE OTP
  // ============================================
  @Post('phone/send-otp')
  @HttpCode(200)
  async sendPhoneOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendPhoneOtp(dto);
  }

  @Post('phone/verify-otp')
  async verifyPhoneOtp(@Body() dto: VerifyOtpDto): Promise<TokenResponseDto> {
    return this.authService.verifyPhoneOtp(dto);
  }

  // ============================================
  // DEVELOPMENT TEST LOGIN (REMOVE IN PRODUCTION)
  // ============================================
  @Post('test-login')
  @HttpCode(200)
  async testLogin(@Body() body: { phone?: string; email?: string }): Promise<TokenResponseDto> {
    // This endpoint is for development only - REMOVE before production!
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Test login not available in production');
    }
    return this.authService.testLogin(body.phone || body.email || '5551234567');
  }

  // ============================================
  // SOCIAL LOGIN
  // ============================================
  @Post('social/login')
  async socialLogin(@Body() dto: SocialLoginDto): Promise<TokenResponseDto> {
    return this.authService.socialLogin(dto);
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================
  @Post('refresh-token')
  async refreshToken(@Body() body: { refreshToken: string }): Promise<TokenResponseDto> {
    return this.authService.refreshToken(body.refreshToken);
  }

  // ============================================
  // PROFILE
  // ============================================
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getCurrentUser(@Request() req): Promise<UserProfileDto> {
    return this.authService.getCurrentUser(req.user.sub);
  }
}
