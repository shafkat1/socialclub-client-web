# Migration Guide: Supabase → AWS Backend (DynamoDB)

## Overview

Your application was built with **Supabase** as the backend, but you've now deployed to **AWS** with:
- **Frontend**: S3 + CloudFront (https://assets.desh.co)
- **Backend**: ECS (NestJS) with:
  - **Database**: RDS PostgreSQL
  - **Cache**: ElastiCache Redis  
  - **NoSQL**: DynamoDB (for specific use cases)

## Current Problem

Frontend is still hardcoded to call the **OLD Supabase backend**:
```
https://ncxbwbwalqnkrneynpaf.supabase.co/functions/v1/make-server-8a406620/*
```

## Solution

Update frontend to call the **NEW AWS backend**:
```
http://clubapp-dev-alb-505439685.us-east-1.elb.amazonaws.com/api/*
```

## DynamoDB Tables

Your AWS infrastructure provides these DynamoDB tables:

| Table | Primary Key | Purpose |
|-------|------------|---------|
| `clubapp-dev-presence` | `userId` + `venueId` | Track user presence at venues |
| `clubapp-dev-venue-counts` | `venueId` | Store venue visitor counts |
| `clubapp-dev-devices` | `deviceId` | Track user devices |
| `clubapp-dev-idempotency` | `key` | Prevent duplicate requests |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  AWS Infrastructure                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FRONTEND                    BACKEND                        │
│  ───────────────────────────────────────────────────────    │
│  S3 + CloudFront             ECS (NestJS)                   │
│  https://assets.desh.co      Port 3001                      │
│                              Fronted by ALB                  │
│                                                              │
│  Backend connects to:                                       │
│  ├─ RDS PostgreSQL (Main database)                         │
│  ├─ ElastiCache Redis (Caching/Sessions)                   │
│  ├─ DynamoDB (Real-time data)                              │
│  └─ S3 (File storage)                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Backend API Endpoints

Your NestJS backend provides these endpoints:

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signup` - Sign up
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP

### Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update profile

### Venues
- `GET /api/venues` - List venues
- `GET /api/venues/:id` - Get venue details

### Health Check
- `GET /api/health` - Health check endpoint

## Files to Update

### 1. Remove Supabase Dependencies

**File**: `src/utils/supabase/info.tsx`

This file contains OLD Supabase credentials and is no longer needed.

**Action**: Delete or comment out

### 2. Update Authentication Calls

**File**: `src/components/AuthScreen.tsx`

Replace all Supabase calls with backend API calls using `config.api.baseUrl`

**Example Change**:
```typescript
// OLD (Supabase)
import { projectId } from "../utils/supabase/info";
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-8a406620/auth/signin`,
  { ... }
);

// NEW (AWS Backend)
import { config } from "../utils/config";
const response = await fetch(
  `${config.api.baseUrl}/auth/signin`,
  { ... }
);
```

### 3. Update Seed Data

**File**: `src/utils/seedData.ts`

Replace Supabase API base URL with AWS backend URL

**Example Change**:
```typescript
// OLD
import { projectId } from "./supabase/info";
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8a406620`;

// NEW
import { config } from "./config";
const API_BASE = config.api.baseUrl;
```

## DynamoDB Tables Explained

### clubapp-dev-presence
Tracks which users are at which venues (real-time)
```
{
  userId: "user-123",
  venueId: "venue-456",
  arrivalTime: 1234567890,
  ttl: 1234567890 + (4 * 3600)  // Expires after 4 hours
}
```

### clubapp-dev-venue-counts
Stores current visitor counts per venue
```
{
  venueId: "venue-456",
  count: 42,
  updatedAt: 1234567890
}
```

### clubapp-dev-devices
Tracks user devices for push notifications
```
{
  deviceId: "device-789",
  userId: "user-123",
  token: "push-notification-token",
  platform: "ios" | "android"
}
```

### clubapp-dev-idempotency
Prevents duplicate API requests
```
{
  key: "transaction-123",
  response: { ... },
  ttl: 1234567890 + 3600  // Expires after 1 hour
}
```

## Configuration Already Done

Your `.env.production` file is already configured:
```
VITE_API_URL=http://clubapp-dev-alb-505439685.us-east-1.elb.amazonaws.com/api
```

This is automatically used by `src/utils/config.ts`

## Quick Checklist

- [ ] Remove Supabase imports from AuthScreen.tsx
- [ ] Replace Supabase API URLs with `config.api.baseUrl`
- [ ] Update seedData.ts 
- [ ] Delete or comment out supabase/info.tsx
- [ ] Rebuild frontend
- [ ] Test sign in/sign up
- [ ] Monitor backend logs
