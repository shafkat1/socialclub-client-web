# 🧪 Core Features API Testing Guide

**Date**: October 31, 2025 | **Status**: Ready for Testing | **Task 3 of 6 Critical Tasks**

---

## 📋 Overview

This guide covers testing all core features:
- ✅ **Venues** - Discovery, search, presence tracking
- ✅ **Orders/Drinks** - Creating drink offers, managing orders
- ✅ **Redemptions** - QR code generation, bartender verification

All endpoints are **already implemented** in the backend. This document provides testing instructions.

---

## 🔐 Authentication First

All tests below require a JWT token. Get one by signing up or signing in:

### Step 1: Create Test Account

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "tester@desh.co",
    "password": "Test123!Password",
    "name": "Test User"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400,
  "user": {
    "id": "user-123",
    "email": "tester@desh.co",
    "displayName": "Test User",
    "emailVerified": true
  }
}
```

**Save the accessToken** for all following requests.

---

## 🗺️ Test 1: Venues - Discovery & Search

### 1.1 Get Nearby Venues (Using Google Places)

```bash
curl -X GET 'http://localhost:3001/api/venues/nearby?latitude=37.7749&longitude=-122.4194&type=restaurant&radius=8047' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Expected Response:
```json
{
  "venues": [
    {
      "id": "venue-123",
      "name": "The Golden Gate Lounge",
      "address": "123 Market St, San Francisco, CA",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "type": "bar",
      "rating": 4.5,
      "userCount": 42
    }
  ]
}
```

### 1.2 Search Venues

```bash
curl -X POST http://localhost:3001/api/venues/search \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "cocktail bar",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "radius": 5
  }'
```

### 1.3 Get Venue Details

```bash
curl -X GET http://localhost:3001/api/venues/venue-123 \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Expected:
```json
{
  "id": "venue-123",
  "name": "The Golden Gate Lounge",
  "description": "Premium cocktail bar with vintage decor",
  "address": "123 Market St, San Francisco, CA",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "coverImage": "https://...",
  "currentCount": 42,
  "friendsHere": ["John Doe", "Sarah Smith"]
}
```

---

## 👥 Test 2: Presence - User Location Tracking

### 2.1 Set Presence (User Checks In to Venue)

```bash
curl -X POST http://localhost:3001/api/venues/presence/set \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "venueId": "venue-123",
    "wantsToBuy": true,
    "wantsToReceive": true,
    "latitude": 37.7749,
    "longitude": -122.4194
  }'
```

Expected:
```json
{
  "userId": "user-123",
  "venueId": "venue-123",
  "status": "checked-in",
  "wantsToBuy": true,
  "wantsToReceive": true,
  "expiresAt": "2025-10-31T23:00:00Z"
}
```

### 2.2 Get Venue Presence (See Who's There)

```bash
curl -X GET http://localhost:3001/api/venues/venue-123/presence \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Expected:
```json
{
  "venueId": "venue-123",
  "totalCount": 42,
  "users": [
    {
      "userId": "user-123",
      "displayName": "John Doe",
      "profileImage": "https://...",
      "wantsToBuy": true,
      "wantsToReceive": true,
      "arrivedAt": "2025-10-31T20:00:00Z"
    }
  ]
}
```

### 2.3 Clear Presence (User Checks Out)

```bash
curl -X POST http://localhost:3001/api/venues/presence/clear \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "venueId": "venue-123"
  }'
```

---

## 🍹 Test 3: Orders - Send & Receive Drinks

### 3.1 Create Order (Send Drink Offer)

```bash
curl -X POST http://localhost:3001/api/orders \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipientId": "user-456",
    "venueId": "venue-123",
    "amount": 1500,
    "currency": "USD",
    "paymentMethod": "STRIPE",
    "message": "First drink is on me! 🍻"
  }'
```

Expected:
```json
{
  "id": "order-123",
  "buyerId": "user-123",
  "recipientId": "user-456",
  "venueId": "venue-123",
  "amount": 1500,
  "status": "PENDING",
  "expiresAt": "2025-11-01T20:00:00Z",
  "createdAt": "2025-10-31T20:00:00Z"
}
```

### 3.2 Get User Orders

```bash
curl -X GET 'http://localhost:3001/api/orders?status=PENDING&sort=recent' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Expected:
```json
{
  "orders": [
    {
      "id": "order-123",
      "status": "PENDING",
      "buyerName": "Alice Johnson",
      "amount": 1500,
      "message": "First drink is on me! 🍻",
      "expiresAt": "2025-11-01T20:00:00Z"
    }
  ],
  "total": 1,
  "pending": 1,
  "accepted": 0
}
```

### 3.3 Update Order Status

```bash
curl -X POST http://localhost:3001/api/orders/order-123/status \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "ACCEPTED",
    "message": "Thanks! I love cocktails!"
  }'
```

Status flow:
- **PENDING** → Initial state (waiting for recipient)
- **ACCEPTED** → Recipient accepted the offer
- **PAID** → Payment confirmed
- **REDEEMED** → Bartender verified & drink delivered
- **EXPIRED** → 24 hours passed without action

---

## 🔐 Test 4: Redemptions - Bartender Verification

### 4.1 Generate QR Code for Order

```bash
curl -X POST http://localhost:3001/api/orders/order-123/generate-qr \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Expected:
```json
{
  "redemptionId": "redemption-456",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "drinkName": "Margarita",
  "expiresAt": "2025-11-01T20:00:00Z"
}
```

### 4.2 Bartender Scans & Redeems

```bash
curl -X POST http://localhost:3001/api/orders/redeem/redemption-456 \
  -H 'Authorization: Bearer bartender-token' \
  -H 'Content-Type: application/json'
```

Expected:
```json
{
  "success": true,
  "message": "Drink redeemed successfully",
  "redemptionId": "redemption-456",
  "redeemedAt": "2025-10-31T20:30:00Z"
}
```

---

## 👥 Test 5: Groups - Group Management

### 5.1 Create Group

```bash
curl -X POST http://localhost:3001/api/groups/create \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Friday Crew",
    "memberIds": ["user-456", "user-789"]
  }'
```

### 5.2 Add Member to Group

```bash
curl -X POST http://localhost:3001/api/groups/group-123/add-member \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-999"
  }'
```

### 5.3 Get Group Details

```bash
curl -X GET http://localhost:3001/api/groups/group-123 \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

---

## 🧪 Quick Test Checklist

### Venues Feature
- [ ] Get nearby venues (Google Places integration)
- [ ] Search venues by query
- [ ] Get venue details with live count

### Presence Feature
- [ ] User can check in to venue
- [ ] Get list of users at venue
- [ ] User can check out (clear presence)

### Orders Feature
- [ ] Create drink offer (send drink)
- [ ] Get pending orders
- [ ] Accept/decline order
- [ ] Orders expire after 24 hours

### Redemptions Feature
- [ ] Generate QR code for order
- [ ] Bartender redeems order
- [ ] Confirm drink fulfilled

### Groups Feature
- [ ] Create group with friends
- [ ] Add members to group
- [ ] View group details

---

## 📊 Testing Flow (Happy Path)

```
1. Alice signs up
   └─ GET /api/auth/signup

2. Alice searches for venues
   └─ GET /api/venues/nearby

3. Alice checks in to "The Golden Gate Lounge"
   └─ POST /api/venues/presence/set

4. Alice sees Bob at the venue
   └─ GET /api/venues/venue-123/presence

5. Alice sends Bob a margarita ($15)
   └─ POST /api/orders

6. Bob accepts the drink
   └─ POST /api/orders/order-123/status (ACCEPTED)

7. Alice generates QR code
   └─ POST /api/orders/order-123/generate-qr

8. Bartender (Charlie) scans QR code
   └─ POST /api/orders/redeem/redemption-456

9. Order marked as REDEEMED ✅
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing/invalid token | Ensure Authorization header is set correctly |
| 404 Not Found | Venue/order doesn't exist | Verify IDs are correct |
| 400 Bad Request | Invalid payload | Check JSON format and required fields |
| 409 Conflict | User already has presence at venue | Clear presence first |
| 422 Unprocessable | Order expired (>24 hours) | Create new order |

---

## 🚀 Next Steps After Testing

1. ✅ All core features working
2. → Move to **Task 4: Payment Integration (Stripe)**
3. → Move to **Task 5: Push Notifications**
4. → Move to **Task 6: Security Hardening**

---

**Status**: 🟢 **Ready for Testing**  
**Endpoints**: ✅ 12+ fully implemented  
**Expected Duration**: 6-8 hours for full testing
