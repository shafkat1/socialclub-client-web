# 🔔 Firebase Cloud Messaging (Push Notifications) Implementation Guide

**Task 5 of 6 Critical Tasks** | **Status**: Implementation Ready | **Est. Time**: 6-8 hours

---

## 🎯 Overview

This guide covers implementing Firebase Cloud Messaging (FCM) for:
- ✅ Device token registration & management
- ✅ Sending push notifications for drink orders
- ✅ Real-time order updates
- ✅ Friend requests & group invitations
- ✅ Bartender notifications
- ✅ Cross-platform support (iOS, Android, Web)

---

## 📋 Prerequisites

1. **Firebase Project** - Create at https://console.firebase.google.com
2. **Service Account Key** - Download JSON from Firebase Console
3. **Frontend Firebase Config** - Get from Firebase Console Settings

---

## 🔧 Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install firebase-admin
npm install @nestjs/config
```

### Step 2: Backend Firebase Configuration

```typescript
// backend/src/modules/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  providers: [
    {
      provide: 'FIREBASE_APP',
      useFactory: () => {
        return admin.initializeApp({
          credential: admin.credential.cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          ),
        });
      },
    },
    NotificationsService,
    PrismaService,
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

### Step 3: Notifications Service

```typescript
// backend/src/modules/notifications/notifications.service.ts
import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class NotificationsService {
  private messaging: admin.messaging.Messaging;

  constructor(
    @Inject('FIREBASE_APP') private firebaseApp: admin.app.App,
    private prisma: PrismaService,
  ) {
    this.messaging = admin.messaging(this.firebaseApp);
  }

  // ============================================
  // DEVICE TOKEN MANAGEMENT
  // ============================================
  async registerDeviceToken(userId: string, dto: {
    token: string;
    platform: 'ios' | 'android' | 'web';
    appVersion?: string;
    osVersion?: string;
  }) {
    // Store device token in DynamoDB & PostgreSQL
    const device = await this.prisma.device.create({
      data: {
        userId,
        deviceToken: dto.token,
        platform: dto.platform,
        appVersion: dto.appVersion,
        osVersion: dto.osVersion,
      },
    });

    console.log(`✅ Device token registered for user ${userId}`);
    return device;
  }

  async unregisterDeviceToken(token: string) {
    await this.prisma.device.deleteMany({
      where: { deviceToken: token },
    });

    console.log(`✅ Device token unregistered`);
  }

  // ============================================
  // SEND SINGLE NOTIFICATION
  // ============================================
  async sendToUser(userId: string, notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
    icon?: string;
    clickAction?: string;
  }) {
    // Get all device tokens for user
    const devices = await this.prisma.device.findMany({
      where: { userId },
    });

    if (devices.length === 0) {
      console.warn(`No devices found for user ${userId}`);
      return;
    }

    // Send to all devices
    const registrationTokens = devices.map(d => d.deviceToken);

    try {
      const response = await this.messaging.sendMulticast({
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        webpush: {
          notification: {
            icon: notification.icon || '/logo-192x192.png',
            badge: '/logo-192x192.png',
            click_action: notification.clickAction,
          },
          fcmOptions: {
            link: notification.clickAction,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              'mutable-content': 1,
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        tokens: registrationTokens,
      });

      console.log(`✅ Notification sent to ${response.successCount} devices`);
      
      // Remove failed tokens
      if (response.failureCount > 0) {
        const failedTokens = response.responses
          .map((resp, idx) => !resp.success ? registrationTokens[idx] : null)
          .filter(Boolean);
        
        await this.prisma.device.deleteMany({
          where: { deviceToken: { in: failedTokens } },
        });
      }

      return response;
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // ============================================
  // NOTIFICATION SCENARIOS
  // ============================================

  // When someone sends a drink offer
  async notifyDrinkReceived(recipientId: string, senderName: string, drinkName: string) {
    return this.sendToUser(recipientId, {
      title: '🍹 Drink Offer!',
      body: `${senderName} sent you a ${drinkName}!`,
      data: {
        type: 'drink_offer',
        action: 'navigate_to_orders',
      },
      clickAction: '/orders/pending',
    });
  }

  // When drink order is accepted
  async notifyDrinkAccepted(buyerId: string, recipientName: string) {
    return this.sendToUser(buyerId, {
      title: '✅ Drink Accepted!',
      body: `${recipientName} accepted your drink offer!`,
      data: {
        type: 'order_accepted',
        action: 'navigate_to_orders',
      },
      clickAction: '/orders/accepted',
    });
  }

  // When drink is ready to redeem
  async notifyDrinkReady(recipientId: string, senderName: string) {
    return this.sendToUser(recipientId, {
      title: '🍻 Your Drink is Ready!',
      body: `${senderName} is ready to give you the drink!`,
      data: {
        type: 'drink_ready',
        action: 'show_qr',
      },
      clickAction: '/redemptions/pending',
    });
  }

  // When drink is redeemed
  async notifyDrinkRedeemed(buyerId: string, recipientName: string) {
    return this.sendToUser(buyerId, {
      title: '🎉 Cheers!',
      body: `${recipientName} redeemed your drink!`,
      data: {
        type: 'drink_redeemed',
        action: 'show_success',
      },
    });
  }

  // When friend request received
  async notifyFriendRequest(userId: string, senderName: string) {
    return this.sendToUser(userId, {
      title: '👋 New Friend Request',
      body: `${senderName} sent you a friend request!`,
      data: {
        type: 'friend_request',
        action: 'navigate_to_friends',
      },
      clickAction: '/friends/requests',
    });
  }

  // When group invitation received
  async notifyGroupInvite(userId: string, groupName: string, inviterName: string) {
    return this.sendToUser(userId, {
      title: '👥 Group Invitation',
      body: `${inviterName} invited you to join ${groupName}!`,
      data: {
        type: 'group_invite',
        action: 'navigate_to_groups',
      },
      clickAction: '/groups',
    });
  }

  // When friend checks in nearby
  async notifyFriendNearby(userId: string, friendName: string, venueName: string) {
    return this.sendToUser(userId, {
      title: '📍 Friend Nearby',
      body: `${friendName} just checked in to ${venueName}!`,
      data: {
        type: 'friend_nearby',
        action: 'navigate_to_venue',
      },
    });
  }

  // Bartender notification for QR scan
  async notifyBartenderQRScanned(bartenderId: string, drinkName: string, buyerName: string) {
    return this.sendToUser(bartenderId, {
      title: '📱 QR Code Scanned',
      body: `Redeem ${drinkName} for ${buyerName}`,
      data: {
        type: 'qr_scanned',
        action: 'show_redemption',
      },
    });
  }
}
```

### Step 4: Notifications Controller

```typescript
// backend/src/modules/notifications/notifications.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ============================================
  // DEVICE TOKEN REGISTRATION
  // ============================================
  @Post('register-device')
  @UseGuards(JwtAuthGuard)
  async registerDevice(@Request() req, @Body() dto: {
    token: string;
    platform: 'ios' | 'android' | 'web';
    appVersion?: string;
    osVersion?: string;
  }) {
    return this.notificationsService.registerDeviceToken(req.user.sub, dto);
  }

  @Post('unregister-device')
  @UseGuards(JwtAuthGuard)
  async unregisterDevice(@Request() req, @Body() dto: { token: string }) {
    return this.notificationsService.unregisterDeviceToken(dto.token);
  }

  // ============================================
  // TEST NOTIFICATION
  // ============================================
  @Post('send-test')
  @UseGuards(JwtAuthGuard)
  async sendTestNotification(@Request() req) {
    return this.notificationsService.sendToUser(req.user.sub, {
      title: '🧪 Test Notification',
      body: 'If you see this, push notifications are working!',
      data: { type: 'test' },
    });
  }
}
```

---

## 📱 Frontend Setup

### Step 1: Install Firebase

```bash
npm install firebase
```

### Step 2: Initialize Firebase

```typescript
// src/utils/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Request permission and get token
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
      
      console.log('FCM Token:', token);
      return token;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }
}
```

### Step 3: Register Device Token

```typescript
// In your App.tsx or Auth component
import { useEffect } from 'react';
import { requestNotificationPermission } from './utils/firebase';
import { api } from './utils/api';

export function App() {
  useEffect(() => {
    // Request notification permission on app load
    if ('serviceWorker' in navigator && 'Notification' in window) {
      requestNotificationPermission().then(token => {
        if (token) {
          // Send token to backend
          api.registerDeviceToken({
            token,
            platform: 'web',
          });
        }
      });
    }
  }, []);

  return <div>{/* app content */}</div>;
}
```

### Step 4: Handle Incoming Notifications

```typescript
// Create public/firebase-messaging-sw.js (Service Worker)
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/logo-192x192.png',
    badge: '/logo-192x192.png',
    tag: payload.data?.type || 'notification',
    data: payload.data,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const clickAction = event.notification.data?.action;
  if (clickAction) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
```

---

## 🧪 Testing Push Notifications

### Test 1: Register Device Token

```bash
curl -X POST http://localhost:3001/api/notifications/register-device \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "device-token-from-firebase",
    "platform": "web",
    "appVersion": "1.0.0"
  }'
```

### Test 2: Send Test Notification

```bash
curl -X POST http://localhost:3001/api/notifications/send-test \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Test 3: Integration Test (Send drink offer → Notification)

```bash
# 1. User A sends drink to User B
curl -X POST http://localhost:3001/api/orders \
  -H 'Authorization: Bearer TOKEN_A' \
  -d '{"recipientId":"user-b-id","amount":1500}'

# 2. User B receives notification automatically via notifyDrinkReceived()
# 3. User B accepts the order
curl -X POST http://localhost:3001/api/orders/order-123/status \
  -H 'Authorization: Bearer TOKEN_B' \
  -d '{"status":"ACCEPTED"}'

# 4. User A receives notification automatically
```

---

## 📊 Notification Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    EVENT TRIGGERS                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. Drink Offer Sent                              │  │
│  │    └─ notifyDrinkReceived() → Recipient          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 2. Drink Offer Accepted                          │  │
│  │    └─ notifyDrinkAccepted() → Sender             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 3. QR Code Scanned                               │  │
│  │    └─ notifyBartenderQRScanned() → Bartender     │  │
│  │    └─ notifyDrinkReady() → Recipient             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 4. Drink Redeemed                                │  │
│  │    └─ notifyDrinkRedeemed() → Sender             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 5. Friend Nearby                                 │  │
│  │    └─ notifyFriendNearby() → User                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│           FIREBASE CLOUD MESSAGING                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Send to User via Device Tokens (DynamoDB)              │
│  ├─ Send multicast message to all devices              │
│  ├─ Store in Firebase Messaging Service                │
│  └─ Queue for offline delivery                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│         DEVICE NOTIFICATIONS                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Browser/App receives notification                      │
│  ├─ Show system notification                           │
│  ├─ Play sound/vibration                              │
│  ├─ Show badge                                         │
│  └─ Open app on click                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Checklist

- [ ] Store Firebase credentials in environment variables
- [ ] Validate VAPID key in production
- [ ] Implement rate limiting on device registration
- [ ] Validate user permissions before sending notifications
- [ ] Monitor failed device tokens and clean up
- [ ] Use Firebase Security Rules for message access
- [ ] Implement notification preference settings
- [ ] Log all notification sends for auditing

---

## 🚀 Environment Variables

```env
# Backend
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'

# Frontend
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
VITE_FIREBASE_VAPID_KEY=BCxyz...
```

---

## 🎯 Next Steps

1. ✅ Setup Firebase Project
2. ✅ Implement backend notifications module
3. ✅ Register device tokens on frontend
4. ✅ Test notification delivery
5. → Integrate with order workflow
6. → Add notification preferences
7. → Move to Task 6: Security Hardening

---

**Status**: 🟢 **Ready for Implementation**  
**Estimated Time**: 6-8 hours  
**Priority**: CRITICAL (User Engagement)
