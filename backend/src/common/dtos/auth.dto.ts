import { IsEmail, IsPhoneNumber, IsString, MinLength } from 'class-validator';

// ============================================
// PHONE OTP
// ============================================
export class SendOtpDto {
  @IsPhoneNumber()
  phone: string;
}

export class VerifyOtpDto {
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @MinLength(4)
  code: string;
}

// ============================================
// EMAIL VERIFICATION
// ============================================
export class SendEmailOtpDto {
  @IsEmail()
  email: string;
}

export class VerifyEmailOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  code: string;
}

// ============================================
// SOCIAL LOGIN
// ============================================
export class SocialLoginDto {
  @IsString()
  provider: 'google' | 'facebook' | 'instagram' | 'apple' | 'tiktok' | 'snapchat' | 'twitter';

  @IsString()
  accessToken: string;

  idToken?: string; // for Apple
}

// ============================================
// TOKEN RESPONSE
// ============================================
export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfileDto;
}

export class UserProfileDto {
  id: string;
  phone?: string;
  email?: string;
  displayName?: string;
  profileImage?: string;
  bio?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  createdAt: Date;
}

// ============================================
// DEVICE REGISTRATION
// ============================================
export class RegisterDeviceDto {
  @IsString()
  deviceToken: string;

  @IsString()
  platform: 'ios' | 'android' | 'web';

  @IsString()
  appVersion?: string;

  @IsString()
  osVersion?: string;
}
