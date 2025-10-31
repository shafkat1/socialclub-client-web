# 💳 Stripe Payment Integration Guide

**Task 4 of 6 Critical Tasks** | **Status**: Implementation Ready | **Est. Time**: 8-12 hours

---

## 🎯 Overview

This guide covers integrating Stripe for:
- ✅ Payment processing for drink orders
- ✅ Handling payment intents & confirmations
- ✅ Webhook processing for payment events
- ✅ Error handling & retries
- ✅ Security (PCI compliance)

---

## 📋 Prerequisites

1. **Stripe Account** - Sign up at https://dashboard.stripe.com
2. **API Keys** - Get Publishable Key & Secret Key
3. **Environment Variables** - Add to `.env.production`

---

## 🔧 Setup Steps

### Step 1: Install Dependencies

```bash
cd backend
npm install stripe
npm install @nestjs/stripe  # NestJS integration package
npm install --save-dev @types/stripe
```

### Step 2: Add Environment Variables

```env
# .env.production
STRIPE_SECRET_KEY=sk_live_51234567890...
STRIPE_PUBLISHABLE_KEY=pk_live_0987654321...
STRIPE_WEBHOOK_SECRET=whsec_1234567890...

# Frontend
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_0987654321...
```

### Step 3: Create Stripe Module

```typescript
// backend/src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { StripeModule } from '@nestjs/stripe';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [
    StripeModule.forRoot({
      apiKey: process.env.STRIPE_SECRET_KEY,
      apiVersion: '2024-04-10',
    }),
  ],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
```

---

## 💰 Implement Payment Service

```typescript
// backend/src/modules/payment/payment.service.ts
import { Injectable } from '@nestjs/common';
import { InjectStripe } from '@nestjs/stripe';
import Stripe from 'stripe';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectStripe() private stripe: Stripe,
    private prisma: PrismaService,
  ) {}

  // ============================================
  // CREATE PAYMENT INTENT
  // ============================================
  async createPaymentIntent(
    orderId: string,
    amount: number,  // in cents
    userId: string,
  ) {
    // Get order details
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Create payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        orderId,
        buyerId: order.buyerId,
        recipientId: order.recipientId,
        venueId: order.venueId,
      },
      statement_descriptor: 'TreatMe - Drink',
    });

    // Store payment intent ID in database
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
    };
  }

  // ============================================
  // CONFIRM PAYMENT
  // ============================================
  async confirmPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || !order.stripePaymentIntentId) {
      throw new Error('Order or payment intent not found');
    }

    // Retrieve payment intent from Stripe
    const intent = await this.stripe.paymentIntents.retrieve(
      order.stripePaymentIntentId,
    );

    // Check if payment succeeded
    if (intent.status === 'succeeded') {
      // Update order status
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      return { success: true, status: 'PAID' };
    }

    return { success: false, status: intent.status };
  }

  // ============================================
  // PROCESS WEBHOOK
  // ============================================
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      
      case 'payment_intent.payment_failed':
        return this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      
      case 'charge.refunded':
        return this.handleRefund(event.data.object as Stripe.Charge);
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSucceeded(intent: Stripe.PaymentIntent) {
    const { orderId } = intent.metadata;
    
    // Mark order as paid
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    console.log(`✅ Payment succeeded for order: ${orderId}`);
  }

  private async handlePaymentFailed(intent: Stripe.PaymentIntent) {
    const { orderId } = intent.metadata;
    
    // Mark order as failed
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'FAILED' },
    });

    console.log(`❌ Payment failed for order: ${orderId}`);
  }

  private async handleRefund(charge: Stripe.Charge) {
    // Handle refund logic
    console.log(`💰 Refund processed: ${charge.id}`);
  }
}
```

---

## 🔌 Create Payment Controller

```typescript
// backend/src/modules/payment/payment.controller.ts
import { Controller, Post, Body, UseGuards, Request, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ============================================
  // CREATE PAYMENT INTENT
  // ============================================
  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Request() req,
    @Body() dto: { orderId: string; amount: number },
  ) {
    return this.paymentService.createPaymentIntent(
      dto.orderId,
      dto.amount,
      req.user.sub,
    );
  }

  // ============================================
  // CONFIRM PAYMENT
  // ============================================
  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(
    @Request() req,
    @Body() dto: { orderId: string },
  ) {
    return this.paymentService.confirmPayment(dto.orderId);
  }

  // ============================================
  // WEBHOOK (No Auth Required)
  // ============================================
  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    // Verify webhook signature
    const event = this.paymentService.verifyWebhookSignature(body, signature);
    return this.paymentService.handleWebhook(event);
  }
}
```

---

## 🎨 Frontend Payment Component

```typescript
// src/components/PaymentModal.tsx
import { useState } from 'react';
import { loadStripe } from '@stripe/js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/button';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function PaymentModal({ orderId, amount, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Create payment intent
      const response = await fetch(`${config.api.baseUrl}/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId, amount }),
      });

      const { clientSecret } = await response.json();

      // Step 2: Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {},
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        // Step 3: Confirm with backend
        await fetch(`${config.api.baseUrl}/payment/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ orderId }),
        });

        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <Button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

---

## 🔒 Webhook Setup

### 1. Get Webhook Secret

```bash
stripe listen --forward-to localhost:3001/api/payment/webhook
```

### 2. Add to Environment

```env
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890...
```

### 3. Verify Webhook Signature

```typescript
verifyWebhookSignature(body: any, signature: string) {
  return this.stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
}
```

---

## 🧪 Testing Payments

### Test Card Numbers

| Use | Card Number | Expiry | CVC |
|-----|-------------|--------|-----|
| Success | 4242 4242 4242 4242 | 12/25 | 123 |
| Decline | 4000 0000 0000 0002 | 12/25 | 123 |
| Requires Auth | 4000 0025 0000 3155 | 12/25 | 123 |

### Test Payment Flow

```bash
# 1. Create order
curl -X POST http://localhost:3001/api/orders \
  -H 'Authorization: Bearer TOKEN' \
  -d '{"recipientId":"user-123","venueId":"venue-123","amount":1500}'

# Response: { "id": "order-123", ... }

# 2. Create payment intent
curl -X POST http://localhost:3001/api/payment/create-intent \
  -H 'Authorization: Bearer TOKEN' \
  -d '{"orderId":"order-123","amount":1500}'

# 3. Process payment on frontend with Stripe Elements
# 4. Confirm payment
curl -X POST http://localhost:3001/api/payment/confirm \
  -H 'Authorization: Bearer TOKEN' \
  -d '{"orderId":"order-123"}'
```

---

## 🛡️ Security Checklist

- [ ] Use HTTPS in production
- [ ] Never log sensitive card data
- [ ] Validate amounts on backend
- [ ] Verify webhook signatures
- [ ] Handle PCI compliance
- [ ] Implement rate limiting
- [ ] Store only last 4 digits of card
- [ ] Use idempotency keys for retry safety

---

## 📊 Order Status Lifecycle with Payment

```
┌─────────────┐
│   PENDING   │ ← Order created
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  PAYMENT    │ ← User filling in card details
│  PROCESSING │
└──────┬──────┘
       │
       ├─ SUCCESS ─────┐
       │               │
       └─ FAILED ──┐   │
                   │   │
                   ▼   ▼
              ┌─────────────┐
              │    PAID     │ ← Payment confirmed
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │  ACCEPTED   │ ← Recipient accepted
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │  REDEEMED   │ ← Bartender scanned
              └─────────────┘
```

---

## 🚀 Next Steps After Payment Integration

1. ✅ All payment tests passing
2. → Task 5: Push Notifications
3. → Task 6: Security Hardening
4. → Full System Testing

---

**Status**: 🟡 **Ready for Implementation**  
**Estimated Time**: 8-12 hours  
**Priority**: CRITICAL (Revenue-blocking)
