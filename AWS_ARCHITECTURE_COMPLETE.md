# AWS Architecture for SocialClub Client Web

**Project**: SocialClub Client Web (Full-Stack Social Networking Platform)  
**Date**: October 31, 2025  
**Status**: ✅ Architecture Complete & Ready for Deployment  
**Architecture Type**: Multi-AZ, Auto-Scaling, Highly Available  

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET / USERS                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │        Route 53 (DNS)                  │
        │   socialclub.example.com              │
        └────────────┬───────────────────────────┘
                     │
        ┌────────────▼───────────────────────────┐
        │     CloudFront (CDN)                   │
        │  - Cache frontend assets              │
        │  - SSL/TLS termination                │
        │  - Geographic distribution            │
        └────────────┬───────────────────────────┘
                     │
        ┌────────────▼──────────────────────────┐
        │    Application Load Balancer          │
        │  - Route to services                  │
        │  - Health checks                      │
        │  - SSL/TLS termination                │
        └────────────┬──────────────────────────┘
                     │
        ┌────────────▼────────────────────────────────────────┐
        │              VPC (Virtual Private Cloud)            │
        │                                                     │
        │  ┌──────────────┐  ┌──────────────────────────┐   │
        │  │  Public      │  │  Private Subnets         │   │
        │  │  Subnets     │  │  (Multi-AZ)              │   │
        │  │              │  │                          │   │
        │  │  NAT         │  │  ┌────────────────────┐ │   │
        │  │  Gateways    │  │  │ ECS Fargate        │ │   │
        │  │              │  │  │ Backend Services   │ │   │
        │  │              │  │  │ (NestJS API)       │ │   │
        │  │              │  │  └────────────────────┘ │   │
        │  │              │  │                          │   │
        │  └──────────────┘  │  ┌────────────────────┐ │   │
        │                    │  │ RDS PostgreSQL     │ │   │
        │                    │  │ (Multi-AZ)         │ │   │
        │                    │  │ Primary DB         │ │   │
        │                    │  └────────────────────┘ │   │
        │                    │                          │   │
        │                    │  ┌────────────────────┐ │   │
        │                    │  │ ElastiCache Redis  │ │   │
        │                    │  │ (Cache layer)      │ │   │
        │                    │  └────────────────────┘ │   │
        │                    │                          │   │
        │                    │  ┌────────────────────┐ │   │
        │                    │  │ DynamoDB           │ │   │
        │                    │  │ (NoSQL for         │ │   │
        │                    │  │  real-time data)   │ │   │
        │                    │  └────────────────────┘ │   │
        │                    └──────────────────────────┘   │
        │                                                     │
        │  ┌──────────────┐  ┌──────────────────────────┐   │
        │  │  S3 Buckets  │  │  Security Groups         │   │
        │  │  - Frontend  │  │  - ALB                   │   │
        │  │  - Backend   │  │  - ECS                   │   │
        │  │  - Logs      │  │  - RDS                   │   │
        │  │  - Assets    │  │  - ElastiCache           │   │
        │  └──────────────┘  └──────────────────────────┘   │
        └─────────────────────────────────────────────────────┘
                     │
        ┌────────────▼───────────────────────────┐
        │   AWS Secrets Manager                  │
        │   - Database credentials               │
        │   - API keys                           │
        │   - JWT secrets                        │
        │   - Integration tokens                 │
        └────────────────────────────────────────┘
                     │
        ┌────────────▼───────────────────────────┐
        │   CloudWatch                           │
        │   - Logs & monitoring                  │
        │   - Metrics & dashboards               │
        │   - Alarms                             │
        └────────────────────────────────────────┘
```

---

## 📦 AWS SERVICES DEPLOYMENT

### 1. **Frontend Infrastructure**

#### S3 (Simple Storage Service)
```
socialclub-frontend-staging/
├── index.html
├── assets/
│   ├── js/
│   ├── css/
│   └── images/
└── robots.txt

socialclub-frontend-production/
├── index.html
├── assets/
└── robots.txt
```
**Purpose**: Store frontend build artifacts  
**Configuration**:
- Versioning enabled
- Block public access except for CloudFront
- Server-side encryption
- Cross-region replication (optional)

#### CloudFront (CDN)
```
Staging Distribution:
  Domain: staging-app.socialclub.example.com
  Origin: socialclub-frontend-staging.s3.amazonaws.com
  Cache TTL: 3600s
  
Production Distribution:
  Domain: app.socialclub.example.com
  Origin: socialclub-frontend-production.s3.amazonaws.com
  Cache TTL: 86400s
```
**Features**:
- Global content delivery
- SSL/TLS certificate (ACM)
- Compression enabled
- Cache invalidation on deployment
- Geographic restriction (optional)

---

### 2. **Backend Infrastructure**

#### ECS Fargate (Container Orchestration)
```
Staging Cluster: socialclub-staging
  Service: backend-service
    - Task: 2 (min)
    - Task: 5 (max)
    - CPU: 512
    - Memory: 1024 MB
    - Port: 3001
    
Production Cluster: socialclub-production
  Service: backend-service
    - Task: 3 (min)
    - Task: 10 (max)
    - CPU: 1024
    - Memory: 2048 MB
    - Port: 3001
```

**Auto-Scaling Policy**:
- Scale up: CPU > 70%, Memory > 75%
- Scale down: CPU < 30%, Memory < 50%
- Cooldown period: 300 seconds

**Deployment Process**:
1. Push image to ECR
2. Update ECS task definition
3. Deploy new task definition
4. Rolling deployment (no downtime)

#### ECR (Elastic Container Registry)
```
Repository: socialclub/backend
  Image Tags: 
    - latest (always current)
    - v1.0.0 (specific release)
    - staging (staging environment)
    - production (production environment)
```

---

### 3. **Database Infrastructure**

#### RDS PostgreSQL (Primary Database)
```
Instance Type: db.t3.small (staging) → db.r6g.xlarge (production)
Multi-AZ: Yes
Backup:
  - Retention: 30 days
  - Automated backups: Daily
  - Manual snapshots: Before major changes
  
Engine Version: PostgreSQL 15.x
Storage:
  - Allocated: 100 GB
  - Auto-scaling: Yes (max 1000 GB)
  - Type: gp3 (general purpose)
  - IOPS: 3000

Encryption:
  - At rest: KMS
  - In transit: SSL/TLS
  - Password: AWS Secrets Manager
```

**Database Schema** (via Prisma):
```prisma
- Users table
- Venues table  
- Orders table
- Messages table
- Groups table
- Presence/Check-ins table
- Redemptions table
- Friends table
- Friendships table
```

#### DynamoDB (NoSQL - Real-time Data)
```
Tables:
  - user-sessions
    Partition Key: userId
    Sort Key: sessionId
    TTL: 24 hours
    
  - real-time-presence
    Partition Key: venueId
    Sort Key: userId
    TTL: 1 hour
    
  - message-cache
    Partition Key: conversationId
    Sort Key: timestamp
    TTL: 7 days
    
  - activity-log
    Partition Key: userId
    Sort Key: timestamp
    TTL: 30 days

Billing Mode: Pay-per-request (development)
              Provisioned (production)
```

#### ElastiCache Redis (Cache Layer)
```
Engine: Redis 7.x
Node Type: cache.t3.small (staging) → cache.r6g.xlarge (production)
Number of Nodes: 1 (staging) → 3 (production multi-AZ)
Port: 6379

Data:
  - Session tokens (TTL: 24h)
  - User preferences (TTL: 7d)
  - Venue rankings (TTL: 1h)
  - Message queue (TTL: 24h)
  - Rate limiting (TTL: 1min)

Encryption:
  - At rest: enabled
  - In transit: enabled
  - Auth token: AWS Secrets Manager
```

---

### 4. **Networking**

#### VPC (Virtual Private Cloud)
```
CIDR Block: 10.0.0.0/16

Availability Zones: 3 (us-east-1a, us-east-1b, us-east-1c)

Public Subnets (NAT Gateway access):
  - AZ-1: 10.0.1.0/24
  - AZ-2: 10.0.2.0/24
  - AZ-3: 10.0.3.0/24

Private Subnets (ECS, RDS, ElastiCache):
  - AZ-1: 10.0.11.0/24
  - AZ-2: 10.0.12.0/24
  - AZ-3: 10.0.13.0/24

Data Subnets (Database replication):
  - AZ-1: 10.0.21.0/24
  - AZ-2: 10.0.22.0/24
  - AZ-3: 10.0.23.0/24
```

#### Security Groups
```
ALB Security Group:
  Inbound:
    - HTTP (80) from 0.0.0.0/0
    - HTTPS (443) from 0.0.0.0/0
  Outbound:
    - All traffic

ECS Task Security Group:
  Inbound:
    - 3001 from ALB
  Outbound:
    - 5432 to RDS
    - 6379 to ElastiCache
    - 443 to AWS API
    - 443 to external APIs

RDS Security Group:
  Inbound:
    - 5432 from ECS
  Outbound:
    - All

ElastiCache Security Group:
  Inbound:
    - 6379 from ECS
  Outbound:
    - All
```

#### Application Load Balancer (ALB)
```
Name: socialclub-alb
Scheme: internet-facing
Type: Application Load Balancer

Listeners:
  HTTP (80) → Redirect to HTTPS
  HTTPS (443) → Target Group

Target Group:
  Name: backend-targets
  Protocol: HTTP
  Port: 3001
  Path-based routing: /api/* → ECS
  
Health Check:
  Path: /api/health
  Interval: 30s
  Timeout: 5s
  Healthy threshold: 2
  Unhealthy threshold: 2
```

#### Route 53 (DNS)
```
Domain: socialclub.example.com

Records:
  app.socialclub.example.com → CloudFront distribution
  api.socialcloud.example.com → ALB
  cdn.socialclub.example.com → CloudFront
  mail.socialclub.example.com → MX (if needed)
  
Health Checks:
  - API health endpoint
  - Frontend availability
  - Alert on failure
```

---

### 5. **Security & Compliance**

#### IAM (Identity & Access Management)
```
Roles:
  - ECS Task Role
    Policies:
      - s3:GetObject (frontend assets)
      - secretsmanager:GetSecretValue
      - dynamodb:* (own tables)
      - cloudwatch:PutMetricData
      
  - GitHub Actions OIDC Role
    Policies:
      - ecr:PushImage
      - ecs:UpdateService
      - s3:PutObject (frontend)
      - cloudfront:CreateInvalidation
      - terraform:* (limited)
      
  - CI/CD Pipeline Role
    Policies:
      - secretsmanager:GetSecretValue
      - kms:Decrypt
```

#### ACM (AWS Certificate Manager)
```
Certificate: socialclub.example.com
  - *.socialclub.example.com (wildcard)
  
Validation: DNS CNAME
Auto-renewal: Enabled
```

#### KMS (Key Management Service)
```
Key: socialclub-master-key
  - S3 encryption
  - RDS encryption
  - ElastiCache encryption
  - SecretsManager encryption

Key Policy:
  - Root account admin
  - IAM roles for services
  - CloudWatch for monitoring
```

#### Secrets Manager
```
Secrets (16 total):
  AWS Credentials:
    - socialclub/aws/role-arn
    - socialclub/aws/ecr-registry
    
  Database:
    - socialclub/database/database-url
    - socialclub/database/redis-url
    
  API Keys:
    - socialclub/api/vite-api-url
    - socialclub/api/backend-url
    
  Integration:
    - socialclub/integration/stripe-key
    - socialclub/integration/twilio-key
    - socialclub/integration/sendgrid-key
    
  And 8 more...

Rotation:
  - Database password: 30 days
  - API keys: 90 days
  - Integration tokens: as needed
```

---

### 6. **Monitoring & Logging**

#### CloudWatch
```
Logs:
  - /aws/ecs/socialclub-backend
    Log Retention: 30 days
    
  - /aws/rds/postgresql
    Log Retention: 7 days
    
  - /aws/elasticache/redis
    Log Retention: 3 days
    
  - /aws/lambda/functions
    Log Retention: 14 days

Metrics:
  - CPU utilization
  - Memory utilization
  - Network throughput
  - RDS database size
  - ElastiCache evictions
  - ALB response time
  - Error rate

Dashboards:
  - Application overview
  - Backend performance
  - Database health
  - Cache statistics
  - Error tracking

Alarms:
  - High CPU (>80%)
  - High memory (>85%)
  - Database connections >80%
  - Error rate > 1%
  - ALB unhealthy targets
  - RDS storage > 80%
```

#### Sentry (Error Tracking)
```
Project: socialclub-backend
Events captured:
  - JavaScript errors
  - Backend exceptions
  - Performance degradation
  - Release tracking
  
Alert Policies:
  - New issue alert
  - Spike detection
  - Regression detection
```

---

## 📊 TERRAFORM CONFIGURATION FILES

### Current Files in `infra/terraform/`

```
✅ acm.tf                  - SSL/TLS certificate
✅ alb_cert.tf             - ALB certificate configuration
✅ backend-bootstrap.tf    - Terraform backend (S3 + DynamoDB)
✅ backend.tf              - Backend infrastructure
✅ cloudfront.tf           - CloudFront CDN configuration
✅ dynamodb.tf             - DynamoDB tables
✅ ecs.tf                  - ECS clusters & services
✅ iam.tf                  - IAM roles & policies
✅ locals.tf               - Local variables
✅ networking.tf           - VPC, subnets, security groups
✅ outputs.tf              - Output values
✅ providers.tf            - AWS provider configuration
✅ rds.tf                  - RDS PostgreSQL database
✅ redis.tf                - ElastiCache Redis
✅ route53.tf              - DNS configuration
✅ s3.tf                   - S3 buckets
✅ secrets_rotation.tf     - Secrets rotation policy
✅ terraform.tfvars.example - Variable examples
✅ variables.tf            - Variable definitions
✅ versions.tf             - Terraform version lock
```

---

## 🚀 DEPLOYMENT FLOW

### Environment: Staging
```
1. Developer pushes code to develop branch
2. GitHub Actions triggered
3. Tests run
4. Docker image built & pushed to ECR
5. Terraform validates configuration
6. Frontend deployed to S3 (staging bucket)
7. CloudFront cache invalidated
8. Backend deployed to ECS (staging cluster)
9. Smoke tests run
10. Slack notification sent
```

### Environment: Production
```
1. Merge to main branch with approval
2. GitHub Actions triggered
3. All tests + security scans run
4. Docker image built & pushed to ECR (latest tag)
5. Terraform applies infrastructure changes
6. Frontend deployed to S3 (production bucket)
7. CloudFront cache invalidated (full)
8. Backend deployed to ECS (production, rolling)
9. Health checks verified
10. Notification sent to team
```

---

## 💰 COST ESTIMATION

### Monthly Cost Breakdown (Approximate)

| Service | Staging | Production | Total |
|---------|---------|-----------|-------|
| ECS Fargate | $45 | $200 | $245 |
| RDS PostgreSQL | $60 | $400 | $460 |
| ElastiCache Redis | $30 | $150 | $180 |
| DynamoDB | $25 | $100 | $125 |
| S3 | $20 | $50 | $70 |
| CloudFront | $15 | $200 | $215 |
| ALB | $16 | $16 | $32 |
| Route 53 | $5 | $5 | $10 |
| CloudWatch | $10 | $30 | $40 |
| KMS | $5 | $5 | $10 |
| Secrets Manager | $5 | $5 | $10 |
| NAT Gateway | $20 | $45 | $65 |
| **Total** | **$251** | **$1,206** | **$1,457** |

---

## ✅ ARCHITECTURE READINESS CHECKLIST

- [x] VPC & Networking configured
- [x] Security groups defined
- [x] IAM roles & policies created
- [x] S3 buckets configured
- [x] CloudFront distribution
- [x] Route 53 DNS setup
- [x] ACM SSL certificates
- [x] RDS PostgreSQL database
- [x] ElastiCache Redis
- [x] DynamoDB tables
- [x] ECS clusters
- [x] Application Load Balancer
- [x] CloudWatch monitoring
- [x] AWS Secrets Manager
- [x] KMS encryption
- [x] Terraform templates
- [x] GitHub Actions workflow
- [x] Docker configuration
- [x] Health checks
- [x] Auto-scaling policies

---

## 🎯 DEPLOYMENT CHECKLIST

**Pre-Deployment**:
- [ ] Update Terraform variables
- [ ] Configure AWS credentials
- [ ] Setup GitHub OIDC
- [ ] Create AWS secrets (16 total)
- [ ] Verify domain DNS records
- [ ] Setup SSL certificates

**Terraform Apply**:
```bash
cd infra/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

**Post-Deployment**:
- [ ] Verify all resources created
- [ ] Test frontend on CloudFront
- [ ] Test backend API health
- [ ] Verify database connectivity
- [ ] Check CloudWatch logs
- [ ] Monitor for errors
- [ ] Run smoke tests
- [ ] Scale up to production values

---

## 📞 SUPPORT & DOCUMENTATION

- **Terraform Docs**: `infra/terraform/README.md`
- **Architecture Diagram**: This document
- **GitHub Actions**: `.github/workflows/`
- **AWS Console**: https://console.aws.amazon.com

---

**Status**: ✅ **COMPLETE & READY FOR DEPLOYMENT**  
**Last Updated**: October 31, 2025  
**Next Step**: Apply Terraform configuration to AWS

🚀 **Ready to Deploy SocialClub Client Web to AWS!**
