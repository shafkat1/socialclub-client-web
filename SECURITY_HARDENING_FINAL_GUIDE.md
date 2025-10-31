# 🔐 Security Hardening - Final Implementation Guide

**Task 6 of 6 Critical Tasks** | **Status**: Implementation Ready | **Est. Time**: 4-6 hours

---

## 🎯 Overview

This guide covers critical security hardening:
- ✅ JWT token refresh & rotation
- ✅ Rate limiting middleware
- ✅ Input validation & sanitization
- ✅ CORS hardening
- ✅ Security headers
- ✅ Helmet integration
- ✅ API error handling
- ✅ HTTPS enforcement

---

## 🔒 Implementation 1: JWT Security

### Step 1: Add JWT Configuration

```typescript
// backend/src/config/jwt.config.ts
export const jwtConfig = {
  // Access token: Short-lived (24 hours)
  accessTokenSecret: process.env.JWT_SECRET || 'your-secret-key',
  accessTokenExpiry: '24h',
  
  // Refresh token: Long-lived (7 days)
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  refreshTokenExpiry: '7d',
  
  // Token rotation: Force refresh after 2 days
  tokenRotationThreshold: 2 * 24 * 60 * 60 * 1000, // 2 days in ms
};
```

### Step 2: Implement Token Refresh Strategy

```typescript
// backend/src/modules/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private redis: RedisService,
  ) {}

  // ============================================
  // TOKEN GENERATION & REFRESH
  // ============================================
  async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    };

    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConfig.accessTokenSecret,
      expiresIn: jwtConfig.accessTokenExpiry,
    });

    // Generate refresh token (long-lived)
    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConfig.refreshTokenSecret,
      expiresIn: jwtConfig.refreshTokenExpiry,
    });

    // Store refresh token in Redis with TTL
    const refreshTokenKey = `refresh_token:${user.id}`;
    await this.redis.set(refreshTokenKey, refreshToken, 7 * 24 * 60 * 60); // 7 days

    // Store token generation timestamp for rotation
    await this.redis.set(
      `token_issued:${user.id}`,
      Date.now().toString(),
      7 * 24 * 60 * 60,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  // Refresh access token
  async refreshAccessToken(userId: string, oldRefreshToken: string) {
    // Verify refresh token is valid and matches stored one
    const storedToken = await this.redis.get(`refresh_token:${userId}`);
    
    if (!storedToken || storedToken !== oldRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token rotation is needed
    const issuedAt = await this.redis.get(`token_issued:${userId}`);
    const ageInMs = Date.now() - parseInt(issuedAt);

    if (ageInMs > jwtConfig.tokenRotationThreshold) {
      // Token is old, require full re-authentication
      await this.redis.del(`refresh_token:${userId}`);
      throw new UnauthorizedException('Token refresh expired. Please login again.');
    }

    // Generate new access token
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const newAccessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: jwtConfig.accessTokenSecret,
        expiresIn: jwtConfig.accessTokenExpiry,
      },
    );

    return {
      accessToken: newAccessToken,
      expiresIn: 24 * 60 * 60,
    };
  }

  // Revoke all tokens for user (logout)
  async revokeAllTokens(userId: string) {
    const keys = [
      `refresh_token:${userId}`,
      `token_issued:${userId}`,
      `access_token_blacklist:${userId}`,
    ];

    for (const key of keys) {
      await this.redis.del(key);
    }

    console.log(`✅ All tokens revoked for user: ${userId}`);
  }
}
```

### Step 3: Add Token Refresh Endpoint

```typescript
// backend/src/modules/auth/auth.controller.ts
@Post('refresh-token')
async refreshToken(@Body() dto: { refreshToken: string }) {
  return this.authService.refreshAccessToken(
    // Get user from refresh token
    this.jwtService.verify(dto.refreshToken, {
      secret: jwtConfig.refreshTokenSecret,
    }).sub,
    dto.refreshToken,
  );
}
```

---

## 🚦 Implementation 2: Rate Limiting Middleware

### Step 1: Install Dependencies

```bash
npm install @nestjs/throttler redis
```

### Step 2: Create Rate Limiting Module

```typescript
// backend/src/modules/rate-limit/rate-limit.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisStore } from 'rate-limit-redis';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      // Default: 100 requests per 15 minutes
      ttl: 15 * 60 * 1000,
      limit: 100,
      storage: new RedisStore({
        client: redisClient,
        prefix: 'rate-limit:',
      }),
    }),
  ],
})
export class RateLimitModule {}
```

### Step 3: Apply Rate Limiting by Endpoint

```typescript
// backend/src/modules/auth/auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // 5 requests per 15 minutes for signin (brute force protection)
  @Post('signin')
  @Throttle(5, 15 * 60)
  async signin(@Body() dto: { email: string; password: string }) {
    return this.authService.signin(dto);
  }

  // 3 requests per 15 minutes for signup (abuse prevention)
  @Post('signup')
  @Throttle(3, 15 * 60)
  async signup(@Body() dto: any) {
    return this.authService.signup(dto);
  }

  // 20 requests per 15 minutes for other endpoints (normal rate limit)
  @Post('refresh-token')
  @Throttle(20, 15 * 60)
  async refreshToken(@Body() dto: { refreshToken: string }) {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }
}
```

---

## ✅ Implementation 3: Input Validation & Sanitization

### Step 1: Install Dependencies

```bash
npm install class-validator class-transformer sanitize-html
```

### Step 2: Create Global Validation Pipe

```typescript
// backend/src/common/pipes/validation.pipe.ts
import { ValidationPipe } from '@nestjs/common';
import { sanitize } from 'class-sanitizer';

export const globalValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  stopAtFirstError: true,
});
```

### Step 3: Create DTOs with Validation

```typescript
// backend/src/common/dtos/auth.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { Sanitize } from 'class-sanitizer';

export class SignupDto {
  @IsEmail()
  @Sanitize()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message: 'Password must contain uppercase, lowercase, number, and special char',
    },
  )
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Sanitize()
  name: string;
}

export class SigninDto {
  @IsEmail()
  @Sanitize()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### Step 4: Apply Globally in main.ts

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { globalValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply global validation pipe
  app.useGlobalPipes(globalValidationPipe);
  
  // ... other middleware
  
  await app.listen(3001);
}
bootstrap();
```

---

## 🔗 Implementation 4: CORS Hardening

### Step 1: Implement Strict CORS Policy

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Strict CORS configuration
  const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 3600, // Cache preflight for 1 hour
  });

  await app.listen(3001);
}
```

### Step 2: Set Environment Variables

```env
# .env.production
CORS_ORIGIN=https://assets.desh.co,https://www.desh.co
NODE_ENV=production
```

---

## 🛡️ Implementation 5: Security Headers with Helmet

### Step 1: Install Helmet

```bash
npm install @nestjs/helmet
```

### Step 2: Apply Helmet Middleware

```typescript
// backend/src/main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply Helmet security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  }));

  // ... rest of bootstrap
}
```

---

## 🌐 Implementation 6: HTTPS Enforcement

### Step 1: Add HTTPS Redirect Middleware

```typescript
// backend/src/common/middleware/https-redirect.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpsRedirectMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'production') {
      if (req.header('x-forwarded-proto') !== 'https') {
        return res.redirect(301, `https://${req.header('host')}${req.url}`);
      }
    }
    next();
  }
}
```

### Step 2: Apply Middleware

```typescript
// backend/src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HttpsRedirectMiddleware } from './common/middleware/https-redirect.middleware';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpsRedirectMiddleware).forRoutes('*');
  }
}
```

---

## 🔍 Implementation 7: API Error Handling

### Step 1: Create Global Exception Filter

```typescript
// backend/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Log error with context
    this.logger.error(
      `${request.method} ${request.url} - ${status}`,
      exception.stack,
    );

    // Don't expose internal error details to client
    const isProduction = process.env.NODE_ENV === 'production';
    const errorResponse = {
      statusCode: status,
      message: this.getSafeErrorMessage(exception),
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(isProduction ? {} : { error: exception.getResponse() }),
    };

    response.status(status).json(errorResponse);
  }

  private getSafeErrorMessage(exception: HttpException): string {
    const message = exception.getResponse();

    if (typeof message === 'object' && 'message' in message) {
      return message.message;
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal server error. Please try again later.';
    }

    return exception.message || 'Unknown error occurred';
  }
}
```

### Step 2: Apply Global Filter

```typescript
// backend/src/main.ts
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // ... rest
}
```

---

## 🔑 Implementation 8: Environment Variable Security

### Step 1: Validate Required Environment Variables

```typescript
// backend/src/config/env.validation.ts
import { plainToClass } from 'class-transformer';
import { IsEnum, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  REDIS_URL: string;
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.toString()}`);
  }

  return validatedConfig;
}
```

### Step 2: Load and Validate in app.module.ts

```typescript
// backend/src/app.module.ts
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
      envFilePath: '.env.production',
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

---

## 🧪 Security Testing Checklist

### Frontend Security

- [ ] HTTPS enforced in production
- [ ] No sensitive data in localStorage (only tokens)
- [ ] CSRF tokens implemented for state-changing requests
- [ ] Content Security Policy headers present
- [ ] X-Frame-Options set to deny
- [ ] X-Content-Type-Options set to nosniff

### Backend Security

- [ ] All endpoints require authentication (except signup/login)
- [ ] Rate limiting active on auth endpoints
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma ORM)
- [ ] CORS configured for specific origins only
- [ ] Error messages don't leak sensitive info
- [ ] Helmet security headers applied
- [ ] HTTPS redirect working
- [ ] JWT tokens have short expiry (24h)
- [ ] Refresh tokens rotate properly

### API Security Tests

```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/signin \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@desh.co","password":"wrong"}'
done

# Test CORS
curl -X GET http://localhost:3001/api/profile \
  -H 'Origin: https://evil.com' \
  -H 'Authorization: Bearer TOKEN'

# Test input validation
curl -X POST http://localhost:3001/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"invalid","password":"short"}'

# Test JWT expiry
curl -X POST http://localhost:3001/api/auth/refresh-token \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"expired-token"}'
```

---

## 📊 Security Checklist

- [ ] JWT tokens implemented with refresh rotation
- [ ] Rate limiting on auth endpoints (5/15min signin, 3/15min signup)
- [ ] Input validation & sanitization on all inputs
- [ ] CORS hardened to specific origins
- [ ] Security headers via Helmet
- [ ] HTTPS redirect middleware
- [ ] Global error handling (no internal details leaked)
- [ ] Environment variables validated
- [ ] Password requirements enforced (uppercase, lowercase, number, special char)
- [ ] Tokens stored securely in Redis
- [ ] All endpoints require authentication
- [ ] CSRF protection considered
- [ ] Logging implemented without sensitive data

---

## 🚀 Environment Variables Required

```env
# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
NODE_ENV=production
CORS_ORIGIN=https://assets.desh.co,https://www.desh.co

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All security implementations completed
- [ ] Security tests passing
- [ ] Environment variables configured
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] Error logging configured
- [ ] Monitoring alerts set up
- [ ] Database backups scheduled
- [ ] Security audit completed
- [ ] Penetration testing considered

---

## 🎯 Final Steps

1. ✅ Implement all security measures above
2. ✅ Run security tests
3. ✅ Deploy to production
4. ✅ Monitor for security issues
5. ✅ Review logs regularly

---

**Status**: 🟢 **Ready for Implementation**  
**Estimated Time**: 4-6 hours  
**Priority**: CRITICAL (Production Safety)**
