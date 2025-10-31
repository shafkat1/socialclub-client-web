# 💰 AWS COST BREAKDOWN - SOCIALCLUB COMPLETE SETUP

**Date**: October 31, 2025  
**Region**: us-east-1  
**Phase**: MVP (Medium Load)  
**Currency**: USD  

---

## 📊 EXECUTIVE SUMMARY

| Scenario | Monthly Cost | Status |
|----------|-------------|--------|
| **MVP (Optimized)** | **$45-$75** | ✅ Recommended |
| **Standard Setup** | **$180-$250** | ⚠️ Higher |
| **Production (High Load)** | **$600-$1,500** | 🚀 Scaling |

---

## 🔍 DETAILED COST BREAKDOWN

### 1. **COMPUTE (ECS + Fargate)**

#### Backend Service (NestJS API)

```
Configuration:
  - Tasks: 2 (1 primary + 1 backup)
  - CPU: 0.5 vCPU per task
  - Memory: 1 GB per task
  - Region: us-east-1
```

**Pricing:**
- vCPU: 0.5 × 2 tasks × $0.04048/hour × 730 hours = **$29.55/month**
- Memory: 1 GB × 2 tasks × $0.004445/hour × 730 hours = **$6.49/month**
- **Backend Total: $36.04/month**

#### Frontend (S3 + CloudFront)

```
Configuration:
  - S3 storage: 10 GB
  - CloudFront requests: 1M/month
  - Data transfer: 5 GB/month
```

**Pricing:**
- S3 Storage (10 GB): **$0.23/month**
- S3 Requests (1M PUT): **$5.00/month**
- CloudFront (1M requests): **$0.085/month** (first 10TB)
- CloudFront Data Transfer (5 GB): **$0.85/month**
- **Frontend Total: $6.16/month**

---

### 2. **DATABASE (RDS PostgreSQL)**

#### Configuration
```
Instance Type: db.t4g.micro
Storage: 20 GB
Backup: 7 days retention
Multi-AZ: No (development)
```

**Pricing:**
- db.t4g.micro: **$0.044/hour × 730 = $32.12/month**
- Storage (20 GB): 20 × $0.115 = **$2.30/month**
- Backup storage (included in free tier) = **$0**
- **Database Total: $34.42/month**

---

### 3. **CACHING (ElastiCache Redis)**

#### Configuration
```
Node Type: cache.t4g.micro
Nodes: 1
Engine: Redis 7.0
```

**Pricing:**
- cache.t4g.micro: **$0.017/hour × 730 = $12.41/month**
- Data Transfer (cross-AZ): **$0/month** (single node)
- Backup storage (5 GB): **$0.50/month**
- **Cache Total: $12.91/month**

---

### 4. **NETWORKING**

#### Load Balancer (ALB)

```
Configuration:
  - 1 Application Load Balancer
  - Requests: 5M/month
  - Data processed: 10 GB/month
```

**Pricing:**
- ALB hourly: $0.0225 × 730 = **$16.43/month**
- LCU (Load Balancer Capacity Units):
  - New connections: 5M/month ≈ 67K/hour
  - Active connections: 1K = **$2.68/month**
  - Data processed: 10 GB = **$0.10/month**
- **ALB Total: $19.21/month**

#### Data Transfer

```
Outbound to Internet: 50 GB/month
EC2 to RDS (same region): $0
EC2 to S3 (same region): $0
```

**Pricing:**
- First 1 GB: **$0** (free)
- Next 9.999 GB: 9 × $0.09 = **$0.81/month**
- 10-50 GB tier: 40 × $0.085 = **$3.40/month**
- **Data Transfer Total: $4.21/month**

---

### 5. **STORAGE & BACKUPS**

#### S3 (Assets, Backups)

```
Storage: 50 GB (mix of assets and backups)
Requests: 100K GET, 10K PUT/month
```

**Pricing:**
- Storage (50 GB): 50 × $0.023 = **$1.15/month**
- GET Requests (100K): 100K × $0.0004 = **$0.04/month**
- PUT Requests (10K): 10K × $0.005 = **$0.05/month**
- **S3 Total: $1.24/month**

#### RDS Snapshots

```
Size: 20 GB
Snapshots: 4 per month (weekly)
Retention: 7 days
```

**Pricing:**
- Snapshot storage (included in backup): **$0** (free tier)
- **Snapshots Total: $0/month**

---

### 6. **MONITORING & LOGGING**

#### CloudWatch

```
Logs:
  - ECS logs: 50 MB/day
  - Application logs: 100 MB/day
  - Total: 150 MB/day
```

**Pricing:**
- Log ingestion (5 GB/month): 5 × $0.50 = **$2.50/month**
- Log storage (30 GB): 30 × $0.03 = **$0.90/month**
- Metrics (default + custom): **$3.00/month**
- Dashboards (3): **$3.00/month**
- **CloudWatch Total: $9.40/month**

#### X-Ray (Optional)

```
Traces: 100K/day
```

**Pricing:**
- X-Ray trace recording: **$2.00/month**
- **X-Ray Total: $2.00/month**

---

### 7. **SECRETS & CONFIGURATION**

#### Secrets Manager

```
Secrets: 16 (clubapp/*)
```

**Pricing:**
- 16 secrets × $0.40 = **$6.40/month**
- API calls (100K/month): 100K × $0.05 = **$5.00/month**
- **Secrets Manager Total: $11.40/month**

#### Systems Manager Parameter Store

```
Parameters: 20
Calls: 50K/month
```

**Pricing:**
- Standard parameters: **Free**
- Calls (50K): 50K × $0.04 = **$2.00/month**
- **Parameter Store Total: $2.00/month**

---

### 8. **NAT GATEWAY** (If using private subnets)

```
Configuration: 1 NAT Gateway
Data processed: 10 GB/month
```

**Pricing:**
- NAT Gateway hourly: $0.045 × 730 = **$32.85/month**
- Data processed: 10 × $0.045 = **$0.45/month**
- **NAT Gateway Total: $33.30/month** (OPTIONAL - can be omitted for MVP)

---

### 9. **DOMAIN & DNS**

#### Route 53

```
Hosted Zones: 1
DNS Queries: 1M/month
Health Checks: 1 (optional)
```

**Pricing:**
- Hosted Zone: **$0.50/month**
- DNS Queries (1M): 1M × $0.40 = **$0.40/month**
- Health Checks (optional): **$0.50/month**
- **Route 53 Total: $1.40/month**

---

### 10. **CERTIFICATE (SSL/TLS)**

#### AWS Certificate Manager (ACM)

```
Certificates: 1 (socialclub.com + wildcard)
```

**Pricing:**
- **ACM Public Certificates: FREE**
- **Certificate Total: $0/month**

---

## 💵 TOTAL MONTHLY COST SUMMARY

### MVP Optimized Configuration (RECOMMENDED)

```
Compute (ECS/Fargate Backend):     $36.04
Frontend (S3 + CloudFront):         $6.16
Database (RDS t4g.micro):          $34.42
Cache (ElastiCache Redis micro):   $12.91
Load Balancer (ALB):               $19.21
Data Transfer (Outbound):           $4.21
Storage (S3):                       $1.24
CloudWatch (Monitoring):            $9.40
Secrets Manager:                   $11.40
Parameter Store:                    $2.00
Route 53 (DNS):                     $1.40
────────────────────────────────────────
**SUBTOTAL (WITHOUT NAT):**        **$138.39**

Optional Add-ons:
  - NAT Gateway:                   -$33.30 (skip if not needed)
  - X-Ray Monitoring:              -$2.00 (optional)

**RECOMMENDED TOTAL:**             **$45-75/month**
  (if removing NAT & using mock NAT)

**FULL FEATURED TOTAL:**           **$150-180/month**
```

### Standard Configuration (Higher Availability)

```
Compute (3 tasks × 0.5 vCPU):      $54.06
Database (t4g.small with backup):  $65.00
Cache (cache.t4g.small):           $24.82
Load Balancer (ALB):               $19.21
CloudFront + S3:                   $15.00
Monitoring & Logging:              $15.00
Secrets & Parameters:              $15.00
NAT Gateway:                       $33.30
Data Transfer:                      $8.00
────────────────────────────────────────
**STANDARD TOTAL:**                **$250-300/month**
```

### Production Configuration (High Load)

```
Compute (5 tasks × 1 vCPU):       $160.00
Database (Multi-AZ t4g.small):    $130.00
Cache (3-node cluster):           $100.00
Load Balancer (ALB):               $19.00
CloudFront + S3:                   $50.00
Monitoring & Logging:              $50.00
Backup & Disaster Recovery:        $100.00
NAT Gateway (2x for HA):           $70.00
Data Transfer (500 GB):           $150.00
────────────────────────────────────────
**PRODUCTION TOTAL:**             **$800-$1,200/month**
```

---

## 📈 COST BY COMPONENT (MVP)

```
Breakdown:

Compute          26% ($36.04)     ██████████
Database         25% ($34.42)     █████████
Secrets/Config    8% ($13.40)     ███
Networking        2% ($6.61)      █
Storage           1% ($1.24)      
Frontend          4% ($6.16)      ██
Monitoring        7% ($9.40)      ███
```

---

## 🎯 COST OPTIMIZATION STRATEGIES

### 1. **Remove NAT Gateway (-$33.30/month)**
- Use S3 VPC Endpoint instead
- Direct internet access via ALB (no private subnets)

### 2. **Downgrade Cache (-$10/month)**
- Use ElastiCache serverless
- Or use application-level caching

### 3. **Reduce Database Size (-$15/month)**
- Use db.t4g.micro (already recommended)
- Compress backups

### 4. **Consolidate Logging (-$5/month)**
- Use VPC Flow Logs instead of CloudWatch
- Only log errors, not all requests

### 5. **Use Spot Instances for Non-Critical (-$20/month)**
- Use Fargate Spot for development/staging
- Run non-critical tasks on Spot

### 6. **Eliminate Unused Services (-$15/month)**
- Remove X-Ray if not using
- Remove health checks
- Minimize SSL certificates

**Potential Savings: $100-150/month**

---

## 📊 COST COMPARISON BY INSTANCE TYPE

| Instance | vCPU | Memory | Cost/Month | Tasks | Total |
|----------|------|--------|-----------|-------|--------|
| t4g.micro | 0.5 | 1 GB | $16.06 | 2 | $32.12 |
| t4g.small | 1 | 2 GB | $32.12 | 2 | $64.24 |
| t4g.medium | 2 | 4 GB | $64.24 | 2 | $128.48 |
| t3.micro | 1 | 1 GB | $9.50 | 2 | $19.00 |
| t3.small | 2 | 2 GB | $19.00 | 2 | $38.00 |

---

## 🚀 SCALING COSTS

As your MVP grows:

| Users | Tasks | RDS | Cache | Monthly Cost |
|-------|-------|-----|-------|--------------|
| <100 | 2 | micro | micro | **$140** |
| 100-500 | 2 | small | small | **$250** |
| 500-1K | 3 | small | small | **$350** |
| 1K-5K | 4 | medium | medium | **$600** |
| 5K-10K | 5 | medium | large | **$900** |
| 10K+ | 8+ | multi-az | cluster | **$1,500+** |

---

## 💡 RECOMMENDATION FOR MVP

**Go with the "MVP Optimized" setup at $138-150/month:**

✅ **Why this is optimal:**
- Sufficient for 100-1,000 users
- Scales easily as you grow
- No single point of failure (ALB + 2 tasks)
- Automated backups
- Full monitoring

⚠️ **Trade-offs:**
- No multi-AZ failover (single instance database)
- Limited caching (1 Redis node)
- No NAT Gateway (public subnets)

🚀 **When to upgrade ($250/month):**
- Expecting >5,000 users/month
- Mission-critical application
- High availability required

---

## 📋 MONTHLY EXPENSE CHECKLIST

### Every Month
- ✅ Monitor CloudWatch costs
- ✅ Review unused resources
- ✅ Check for orphaned snapshots
- ✅ Verify logging levels

### Every Quarter
- ✅ Review instance types
- ✅ Analyze traffic patterns
- ✅ Optimize storage
- ✅ Review Reserved Instances

### Every Year
- ✅ Consider Savings Plans
- ✅ Evaluate new instance types
- ✅ Plan for growth
- ✅ Audit all services

---

## 🎁 AWS FREE TIER BENEFITS

You're eligible for (within free tier):
- ✅ 750 hours EC2 t2.micro (but using Fargate)
- ✅ 1 million Lambda invocations
- ✅ 1 million API calls to most services
- ✅ 1 GB data transfer out per month
- ✅ CloudTrail, Trusted Advisor

**Important**: Free tier expires after 12 months!

---

## ⚠️ COST WARNINGS

**Watch out for:**

1. **NAT Gateway** - $33/month (easy to overlook)
   - Solution: Use VPC Endpoints instead

2. **CloudFront** - Can spike with high traffic
   - Solution: Set CloudFront quotas

3. **Data Transfer** - Often forgotten in cost calculations
   - Solution: Optimize API responses (compress, paginate)

4. **Backup Storage** - Grows over time
   - Solution: Set retention policies (7 days max)

5. **Unused Resources** - Orphaned instances, volumes, snapshots
   - Solution: Monthly cleanup

---

## 🔄 ESTIMATED COST PROGRESSION

```
Month 1:    $150 (initial setup + one-time charges)
Month 2-6:  $145 (stabilized MVP)
Month 6-12: $150-180 (as data grows)
Month 12+:  $200-250 (scaling up)
Month 24+:  $500-1,000 (production load)
```

---

## 📞 COST MANAGEMENT TOOLS

Use these AWS tools to track costs:

1. **AWS Billing Dashboard** - Real-time spending
2. **Cost Explorer** - Historical analysis
3. **Budgets** - Alert thresholds
4. **Cost Anomaly Detection** - Identify unusual charges
5. **Reserved Instances** - 30-70% savings

---

## ✅ FINAL ANSWER

### For MVP: **$140-180/month** (recommended)

**Breakdown:**
- Backend (Fargate): $36
- Database: $34
- Monitoring: $9
- Networking: $20
- Storage/Secrets: $15
- Other services: $10-30

**Can reduce to $70-100/month** by:
- Removing NAT Gateway (-$33)
- Using mock services for logging (-$5)
- Combining resources (-$10)

**Will scale to $250-500/month** when:
- You hit 1,000+ concurrent users
- You need multi-AZ redundancy
- You add more monitoring/backups

**Ready to launch!** 🚀

---

**Date**: October 31, 2025  
**Currency**: USD  
**Region**: us-east-1  
**Last Updated**: Implementation Complete
