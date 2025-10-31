# 🔍 CLUBAPP AWS SETUP AUDIT - EXISTING vs RECOMMENDED

**Date**: October 31, 2025  
**Status**: Audit Complete - Ready for Configuration  
**Tier**: Recommended ($140-150/month)  

---

## ✅ EXISTING CLUBAPP AWS SETUP

### 1. **Project Identifier**
✅ **Project Name**: `clubapp`  
✅ **Environment**: `dev`  
✅ **AWS Region**: `us-east-1`  
✅ **AWS Account ID**: `425687053209`  
✅ **Domain**: `desh.co`  

**Location**: `infra/terraform/terraform.tfvars.example`

---

### 2. **Existing Terraform Infrastructure**

All infrastructure-as-code is already in place:

```
✅ infra/terraform/
   ├── acm.tf                  (SSL/TLS Certificates)
   ├── alb_cert.tf             (ALB Certificates)
   ├── backend.tf              (Terraform state backend)
   ├── backend-bootstrap.tf    (Bootstrap resources)
   ├── cloudfront.tf           (CDN Configuration)
   ├── dynamodb.tf             (DynamoDB tables)
   ├── ecs.tf                  (ECS Fargate - Backend compute)
   ├── iam.tf                  (IAM roles & policies)
   ├── locals.tf               (Local variables)
   ├── networking.tf           (VPC, Subnets, Security Groups)
   ├── outputs.tf              (Terraform outputs)
   ├── providers.tf            (AWS provider config)
   ├── rds.tf                  (PostgreSQL database)
   ├── redis.tf                (ElastiCache Redis cache)
   ├── route53.tf              (DNS records)
   ├── s3.tf                   (S3 buckets)
   ├── secrets_rotation.tf     (RDS secret rotation)
   ├── variables.tf            (Variable definitions)
   ├── versions.tf             (Terraform version)
   └── README.md               (Documentation)
```

**Status**: ✅ All files present and ready

---

### 3. **Existing Backend Configuration**

✅ **Task Definition**: `backend/task-definition.json`

**Current Configuration**:
```json
{
  "family": "clubapp-backend-task",
  "cpu": "1024",              // 1 vCPU
  "memory": "2048",           // 2 GB
  "image": "425687053209.dkr.ecr.us-east-1.amazonaws.com/clubapp-backend:latest",
  "port": "3000",
  "environment": {
    "NODE_ENV": "production",
    "LOG_LEVEL": "info",
    "PORT": "3000",
    "DATABASE_URL": "postgresql://app:***@clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com:5432/postgres"
  },
  "logGroup": "/ecs/clubapp-backend",
  "executionRole": "ecsTaskExecutionRole",
  "taskRole": "ecsTaskRole"
}
```

---

### 4. **Existing Database Setup**

From `infra/terraform/rds.tf`:

```hcl
✅ RDS PostgreSQL Instance
   - Identifier: clubapp-dev-postgres
   - Instance Class: db.t4g.medium
   - Engine: PostgreSQL 16.4
   - Storage: 100 GB (auto-scale to 512 GB)
   - Multi-AZ: true
   - Publicly Accessible: false
   - Backup Retention: 7 days
   - Master User: app
   - Password: auto-generated (24 chars)
```

**Status**: ✅ Already configured for Multi-AZ

---

### 5. **Existing Secrets Manager Setup**

16 secrets are defined in `scripts/create_secrets.py`:

```
✅ AWS Secrets
   - socialclub/aws/role-arn
   - socialclub/aws/s3-staging-bucket
   - socialclub/aws/s3-production-bucket
   - socialclub/aws/cloudfront-staging-id
   - socialclub/aws/cloudfront-production-id
   - socialclub/aws/ecr-registry

✅ API Configuration
   - socialclub/api/vite-api-url
   - socialclub/api/backend-url

✅ Container Registry
   - socialclub/registry/username

✅ External Integrations
   - socialclub/integration/slack-webhook
   - socialclub/integration/snyk-token
   - socialclub/integration/codecov-token

✅ Database
   - socialclub/database/database-url
   - socialclub/database/redis-url

✅ Docker Registry (optional)
   - socialclub/docker/docker-username
   - socialclub/docker/docker-password
```

**Status**: ✅ Template exists, needs values populated

---

## 🤔 QUESTIONS BEFORE CONFIGURATION

Before I proceed with configuring the Recommended tier ($140-150/month), I need to clarify a few things about your existing setup:

### **Q1: Database Instance Type**
The existing task definition shows:
- Current: `db.t4g.medium` (larger, $65/month)
- Recommended MVP: `db.t4g.micro` (smaller, $32/month)

**Question**: Should I keep the **t4g.medium** (your existing setup) or downgrade to **t4g.micro** for cost optimization?

```
t4g.medium cost:     ~$65/month
t4g.micro cost:      ~$32/month
Difference:          -$33/month (47% savings)
```

---

### **Q2: ECS Task Configuration**
The existing task definition shows:
- Current: CPU: 1024 (1 vCPU), Memory: 2048 MB (2 GB)
- Recommended MVP: CPU: 256 (0.25 vCPU), Memory: 512 MB (0.5 GB)

**Question**: Should I keep the **current larger tasks** or scale down to **smaller tasks for MVP**?

```
1 vCPU tasks cost:           ~$36/month
0.5 vCPU tasks cost:         ~$18/month
Difference:                  -$18/month (50% savings)
```

---

### **Q3: Multi-AZ Database**
The RDS is currently configured with:
- Current: `multi_az = true` (high availability, +$50/month)
- Recommended MVP: `multi_az = false` (single AZ, development mode)

**Question**: Should I keep **Multi-AZ for production resilience** or disable it for **MVP cost savings**?

```
With Multi-AZ:       ~$100/month
Without Multi-AZ:    ~$50/month
Difference:          -$50/month (50% savings)
```

---

### **Q4: ECR & Image Registry**
Your existing setup:
- ECR Registry URL: `425687053209.dkr.ecr.us-east-1.amazonaws.com/clubapp-backend:latest`

**Question**: Do you want to keep this **existing AWS account ID and ECR setup**, or should I create a new configuration?

---

### **Q5: Domain Configuration**
Current Terraform config shows:
```
domain_name = "desh.co"
enable_domain = false
```

**Question**: 
- Do you own `desh.co` and want to use it?
- Or should we use AWS Route 53 generated domain (free, auto-generated)?
- Or a different domain you own?

---

### **Q6: Certificate Authority (ACM)**
Current setup includes ACM for:
- `assets.desh.co` (CloudFront)
- `api.desh.co` (ALB)

**Question**: Should these remain the same, or do you want different subdomains?

---

## 📋 RECOMMENDED TIER SUMMARY

Based on your choice of "Recommended" tier at **$140-150/month**, here's what I propose to **KEEP** vs **UPDATE**:

### ✅ KEEP (Existing)
- ✅ Project name: `clubapp`
- ✅ Region: `us-east-1`
- ✅ AWS Account: `425687053209`
- ✅ All Terraform files (they're flexible)
- ✅ ECR setup
- ✅ Secrets Manager structure

### ❓ UPDATE (Awaiting Your Decision)
- ❓ Database Instance Type (medium vs micro?)
- ❓ ECS Task CPU/Memory (1vCPU vs 0.5vCPU?)
- ❓ Multi-AZ setting (high availability vs MVP?)
- ❓ Domain configuration (desh.co vs AWS generated?)
- ❓ ALB/CloudFront domains (same subdomains?)

---

## ⚠️ IMPORTANT NOTES

1. **No Existing Resources in AWS Yet**
   - The Terraform files are configured but likely haven't been applied
   - The existing task-definition.json shows configuration intent
   - Secrets haven't been created yet

2. **Recommended Tier Configuration**
   - CPU: 0.5 vCPU (2 tasks for HA)
   - Memory: 1 GB per task
   - RDS: db.t4g.micro (or keep medium)
   - Multi-AZ: No (unless you want HA)
   - Estimated cost: $140-150/month

3. **Migration Path**
   - Start with MVP tier (lower cost)
   - Scale to Standard tier when needed
   - Keep existing Terraform for easy scaling

---

## 🎯 NEXT STEPS

Please answer the 6 questions above, and I will:

1. ✅ Create a `terraform.tfvars` file configured for the Recommended tier
2. ✅ Update the task definition for the correct CPU/Memory
3. ✅ Document all AWS resources that will be created
4. ✅ Provide a deployment checklist
5. ✅ Give you exact cost breakdown

---

**Status**: Awaiting your input on the 6 configuration questions  
**Ready to proceed once you clarify preferences**

Please reply with your answers, and I'll prepare the exact configuration for deployment! 🚀
