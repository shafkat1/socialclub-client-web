# Database Architecture Analysis: PostgreSQL vs DynamoDB

## Executive Summary

Your application uses **BOTH PostgreSQL and DynamoDB** intentionally for different purposes:

| Database | Purpose | Use Case |
|----------|---------|----------|
| **PostgreSQL (RDS)** | PRIMARY - Relational data | Structured, queryable, ACID transactions |
| **DynamoDB** | SUPPLEMENTARY - Real-time/NoSQL | High-performance, auto-scaling, TTL data |
| **Redis (ElastiCache)** | CACHE LAYER | Fast data retrieval, session storage |

**Note**: This is NOT because of the mobile app. The mobile app would use the same backend API and databases as the web app.

---

## PostgreSQL: Your Primary Database

### What's Stored in PostgreSQL?

**Your Prisma schema defines 9 models in PostgreSQL:**

1. **User** (Authentication & Profiles)
   - Email, phone, display name
   - OAuth IDs (Google, Facebook, Instagram, Apple, TikTok, Snapchat, Twitter)
   - Phone/email verification status
   - Profile image, bio

2. **Group** (Friend Groups)
   - Group name
   - Member list
   - Current venue

3. **GroupMember** (Relationships)
   - Group-to-user relationships
   - Owner status
   - Join dates

4. **Venue** (Bars, Clubs, Pubs)
   - Venue name, description
   - Location (latitude, longitude, address)
   - Cover image
   - Cover image

5. **Order** (Drink Purchases)
   - Buyer & recipient info
   - Venue reference
   - Amount (in cents)
   - Payment method (Stripe, Apple Pay, Google Pay)
   - Stripe payment intent ID
   - 24-hour expiry
   - Order status (PENDING, PAID, ACCEPTED, REJECTED, REDEEMED, EXPIRED, CANCELLED)

6. **Redemption** (Bartender Verification)
   - Order references
   - Bartender ID
   - QR code
   - Status (PENDING, SCANNED, REDEEMED, CANCELLED)

7. **Presence** (User Location at Venues)
   - User at venue reference
   - Drink interest flags (wantsToBuy, wantsToReceive)
   - Location (latitude, longitude)
   - 24-hour expiry
   - Last seen timestamp

8. **Device** (Push Notifications)
   - Device token
   - Platform (iOS, Android, web)
   - App version, OS version
   - Push notification enabled status

9. **AuditLog** (Security Audit Trail)
   - User action tracking
   - Resource changes
   - IP address, user agent

### PostgreSQL Characteristics ✅

```
✅ ACID Transactions
   └─ Ensures data consistency for financial transactions

✅ Complex Queries
   └─ Find all users at a venue, orders in last 24 hours, etc.

✅ Relationships (Foreign Keys)
   └─ Maintains data integrity across tables

✅ Backups & Recovery
   └─ Point-in-time restore capability
   └─ 7-day backup retention

✅ Security
   └─ Encryption at rest
   └─ Subnet isolation (private VPC)
   └─ No public access
```

---

## DynamoDB: Supplementary NoSQL Storage

### Why DynamoDB if We Have PostgreSQL?

DynamoDB is optimized for **specific access patterns** that PostgreSQL is less efficient at:

| Scenario | PostgreSQL | DynamoDB | Winner |
|----------|-----------|----------|--------|
| Complex join queries | ⚡ Fast | ❌ Slow | PostgreSQL |
| High-throughput writes | 🐌 Slower | ⚡ Lightning | DynamoDB |
| Real-time updates | 🐌 Can stall | ⚡ Consistent | DynamoDB |
| TTL (auto-expire) data | ❌ Manual cleanup | ✅ Built-in | DynamoDB |
| Large file storage | ❌ Poor | ✅ Efficient | DynamoDB |

### Your 4 DynamoDB Tables

#### 1. **clubapp-dev-presence**
```
Purpose: Track which users are CURRENTLY at which venues

PostgreSQL Presence Table:
  └─ PRIMARY KEY: userId (UNIQUE)
     └─ Stores: userId, venueId, wantsToBuy, wantsToReceive, expiresAt

Why DynamoDB Copy?
  ❌ PostgreSQL Presence table becomes BOTTLENECK during peak hours
     • Every user checking venue map = 100+ queries/second
     • Every user checking who's at venue = Heavy GROUP BY query
     
  ✅ DynamoDB Presence table:
     • Key: userId + venueId
     • GSI: venueId (query "who's at venue 123")
     • TTL: 4 hours (auto-expire when user leaves)
     • Pay-per-request scaling (unlimited concurrent reads)

Scenario:
  🎉 Friday night, 1,000 users at a venue
  • PostgreSQL: SELECT * FROM Presence WHERE venueId = 'venue-123'
    └─ Gets expensive with 1,000+ rows
  • DynamoDB: Query venueId in Presence table
    └─ Lightning fast, scales automatically
```

#### 2. **clubapp-dev-venue-counts**
```
Purpose: Store LIVE visitor count per venue

Data: { venueId: "venue-123", count: 42, updatedAt: timestamp }

Why DynamoDB?
  ✅ Counter updates are FAST in DynamoDB
     └─ Atomic counters: no transactions needed
  
  ❌ PostgreSQL:
     └─ UPDATE venue_counts SET count = count + 1 WHERE venueId = ?
     └─ Lock contention with high-frequency updates
     └─ Slower for real-time counters

Use Case:
  • User checks "How many people at this venue?"
  • Need instant response: 42 people
  • DynamoDB: O(1) read
  • PostgreSQL: Index scan required
```

#### 3. **clubapp-dev-devices**
```
Purpose: Store device tokens for push notifications

PostgreSQL Device Table:
  └─ Stores: userId, deviceToken, platform, appVersion, osVersion

Why DynamoDB Copy?
  ✅ Fast device lookup by deviceToken
  ✅ Rapid "send notification to all users at venue X" queries
  ✅ TTL support for inactive devices
  
Example:
  • Bartender scans QR code
  • System needs to notify recipient
  • Query: "Get all device tokens for userId: 'user-456'"
  • DynamoDB: O(1) + auto-cleanup of old tokens via TTL
```

#### 4. **clubapp-dev-idempotency**
```
Purpose: Prevent duplicate API requests

Data: { key: "txn-123", response: {...}, ttl: timestamp }

Why DynamoDB?
  ✅ TTL auto-expires stale entries
  ✅ Serves as a quick-lookup cache
  ✅ No need to query/join with other tables

Example:
  • User clicks "Buy drink" button (slow network)
  • Button double-clicked by mistake
  • First request: POST /orders/create
    └─ Generate key: hash(userId + venueId + timestamp)
    └─ DynamoDB: Check if key exists
    └─ Not found: Process order
    └─ Store response with TTL = 1 hour
  • Second request with same params
    └─ DynamoDB: Find key
    └─ Return cached response
    └─ Prevents double-charging
```

---

## Real Data Flow Example

### Scenario: User Checks Venue on Friday Night

```
┌─────────────────────────────────────────────────────────┐
│ Frontend: User opens TreatMe app                        │
│ Action: "Show me venues near my location"               │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ Backend API receives request:                           │
│ GET /api/venues?lat=40.7128&lng=-74.0060&radius=1km   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ Backend queries PostgreSQL:                            │
│                                                        │
│ SELECT * FROM Venue                                    │
│ WHERE (lat, lng) NEAR (40.7128, -74.0060)            │
│ ORDER BY distance LIMIT 10                            │
│                                                        │
│ ✅ PostgreSQL is great at:                            │
│    • Geo-spatial queries                              │
│    • Complex WHERE clauses                            │
│    • Joins (Venue + Order + User info)                │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
                           ↓
    Returns: [Venue1, Venue2, Venue3, ...]
                           ↓
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ For each venue, enrich with real-time data:           │
│                                                        │
│ For Venue1:                                            │
│   1. Query DynamoDB venue-counts (fast counter)       │
│      └─ Get: 42 people at this venue                  │
│                                                        │
│   2. Query DynamoDB presence (fast list)              │
│      └─ Get: Which friends are there                  │
│                                                        │
│   3. Query PostgreSQL for menu & specials             │
│      └─ Get: Drink list, tonight's deals              │
│                                                        │
│ ✅ DynamoDB is great at:                              │
│    • Real-time counts                                 │
│    • Fast lookups by specific key                     │
│    • Auto-scaling for peak loads                      │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
                           ↓
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ Redis caches the enriched result:                     │
│                                                        │
│ KEY: venues:40.7128:-74.0060:1km                      │
│ VALUE: { venues: [...], timestamp: ... }             │
│ TTL: 5 minutes                                        │
│                                                        │
│ ✅ Redis is great at:                                 │
│    • Sub-millisecond retrieval                        │
│    • Temporary data with expiry                       │
│    • Reducing database load                           │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend: Display venues with:                         │
│ • 42 people at Bar X                                   │
│ • John, Sarah, Mike are there (friends)               │
│ • $5 draft beers tonight                              │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture Pattern: Polyglot Persistence

This is called **"Polyglot Persistence"** - using multiple databases optimized for different jobs:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    Your Application                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
  │                          │                          │
  ↓                          ↓                          ↓
┌──────────────────┐  ┌────────────────┐  ┌──────────────────────┐
│   PostgreSQL     │  │   DynamoDB     │  │ Redis (ElastiCache)  │
│                  │  │                │  │                      │
│ • Relational     │  │ • Real-time    │  │ • Session cache      │
│ • ACID safe      │  │ • NoSQL        │  │ • Query cache        │
│ • Consistent     │  │ • Auto-scale   │  │ • Ultra-fast         │
│ • Backups        │  │ • TTL support  │  │ • Temporary data     │
│ • Complex joins  │  │ • Key-value    │  │ • Pub/Sub messaging  │
│                  │  │                │  │                      │
│ User accounts    │  │ User presence  │  │ Page results         │
│ Orders/payments  │  │ Venue counts   │  │ User sessions        │
│ Drinks/venues    │  │ Device tokens  │  │ API rate limits      │
│ Audit logs       │  │ Deduplication │  │ WebSocket data       │
└──────────────────┘  └────────────────┘  └──────────────────────┘
```

---

## Cost Analysis

### Monthly Costs (Estimated)

| Component | Cost | Justification |
|-----------|------|---------------|
| PostgreSQL (db.t4g.micro) | ~$32 | Small instance, cost-optimized |
| DynamoDB (pay-per-request) | ~$5-15 | Only for 4 specific tables, low volume |
| ElastiCache Redis (micro) | ~$10 | Single node, minimal data |
| **Total** | **~$47-57/month** | Includes redundancy & backups |

### Alternative: PostgreSQL Only

❌ **Problematic:**
```
• Venue counts become bottleneck at 100+ users/venue
• Presence queries slow down during peak hours
• Real-time features laggy on Friday nights
• Manual TTL cleanup increases database overhead
• Higher RDS costs to handle peak load
  └─ Would need db.t4g.medium at $65+/month
  └─ DynamoDB overhead would make total ~$75+/month
```

### Alternative: DynamoDB Only

❌ **Problematic:**
```
• Can't do complex queries efficiently
• No ACID transactions for payments
• Can't do geo-spatial searches easily
• Costly to duplicate all data in DynamoDB
• No backup/recovery capabilities
• Not suitable for relational data
```

✅ **Best Approach: Both (What You Have)**
```
• PostgreSQL: Complex business logic, transactions, backups
• DynamoDB: Real-time performance at scale
• Redis: Instant responses, reduce database load
• Total cost: $47-57/month (sweet spot)
```

---

## Mobile App Consideration

### Answer: Mobile App Uses Same Databases

The mobile app (iOS/Android) **does NOT need separate databases**:

```
┌──────────────────────────────────┐
│     Mobile App (iOS/Android)     │
└──────────────────────────────────┘
                ↓
          Makes HTTP/REST API calls to:
                ↓
┌──────────────────────────────────────────────┐
│  Your Backend API (NestJS on ECS)            │
│  http://clubapp-dev-alb-...amazonaws.com/api │
└──────────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────────────────────┐
│ Uses the SAME databases:                                 │
│ ├─ PostgreSQL (user accounts, orders, venues)            │
│ ├─ DynamoDB (presence, counts, devices, deduplication)   │
│ └─ Redis (cache, sessions)                               │
└──────────────────────────────────────────────────────────┘
```

**Key Point**: The database choice is transparent to clients.
- Web app (React) → Same API
- Mobile app (Swift/Kotlin) → Same API
- Both get data from same databases

---

## Summary Table

| Aspect | PostgreSQL | DynamoDB | Redis |
|--------|-----------|----------|-------|
| **Best For** | Relational data, transactions | Real-time, auto-scaling | Caching, speed |
| **Data in App** | Users, Orders, Venues | Presence, Counts | Cached results |
| **Query Speed** | Medium | Fast | Lightning |
| **Consistency** | ACID | Eventually consistent | In-memory |
| **Cost** | $32/month | $5-15/month | $10/month |
| **Backups** | Yes (auto) | Not needed | Not persistent |
| **TTL Support** | Manual | Automatic | Automatic |
| **Scalability** | Vertical | Horizontal | Horizontal |

---

## Recommendation

✅ **Your current setup is correct:**
- **PostgreSQL**: Primary database for all relational data
- **DynamoDB**: Supplement for high-performance, real-time access patterns
- **Redis**: Cache layer for instant responses

This design is **production-grade** and used by companies like Uber, Netflix, and others for similar use cases.
