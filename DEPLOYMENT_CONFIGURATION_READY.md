# 🚀 DEPLOYMENT CONFIGURATION READY - RECOMMENDED TIER

**Date**: October 31, 2025  
**Status**: ✅ Configuration Complete - Ready for Deployment  
**Tier**: Recommended ($140-150/month)  
**AWS Account**: 425687053209  

---

## ✅ YOUR CONFIGURATION

### **Database**
- ✅ **Type**: db.t4g.micro (downgraded from medium)
- ✅ **Storage**: 20 GB (auto-scales to 100 GB)
- ✅ **Backup**: 7 days retention
- ✅ **Multi-AZ**: ❌ Disabled (MVP savings)
- ✅ **Cost**: **~$32/month** (was $65/month, saved $33!)

### **Compute (ECS Fargate)**
- ✅ **Tasks**: 2 (for basic HA)
- ✅ **CPU**: 256 (0.25 vCPU) per task (downgraded from 1 vCPU)
- ✅ **Memory**: 1 GB per task (downgraded from 2 GB)
- ✅ **Port**: 3001 (updated from 3000)
- ✅ **Cost**: **~$18/month** (was $36/month, saved $18!)

### **Cache (Redis)**
- ✅ **Type**: cache.t4g.micro
- ✅ **Nodes**: 1
- ✅ **Failover**: ❌ Disabled
- ✅ **Cost**: **~$12/month**

### **Load Balancer (ALB)**
- ✅ **Type**: Application Load Balancer
- ✅ **Logging**: ❌ Disabled (MVP)
- ✅ **Deletion Protection**: ❌ Disabled
- ✅ **Cost**: **~$19/month**

### **Storage & CDN**
- ✅ **S3**: Auto-generated buckets (clubapp-dev-assets, etc.)
- ✅ **CloudFront**: CDN for static assets
- ✅ **Cost**: **~$6/month**

### **Domain & DNS**
- ✅ **Domain**: desh.co (enabled)
- ✅ **DNS**: Route 53
- ✅ **Subdomains**: 
  - assets.desh.co → CloudFront
  - api.desh.co → ALB
- ✅ **SSL/TLS**: AWS Certificate Manager (free)
- ✅ **Cost**: **~$1.50/month**

### **Monitoring & Logging**
- ✅ **CloudWatch Logs**: /ecs/clubapp-backend
- ✅ **Metrics**: Basic (no X-Ray)
- ✅ **Cost**: **~$9/month**

### **Secrets Manager**
- ✅ **Secrets**: 16 total
- ✅ **Database secrets**: Stored in Secrets Manager
- ✅ **Cost**: **~$11/month**

---

## 💰 EXACT COST BREAKDOWN

```
COMPONENT                    MONTHLY COST
────────────────────────────────────────
ECS Compute (0.5 vCPU):        $18.00
Database (db.t4g.micro):       $32.00
ElastiCache Redis micro:       $12.00
Load Balancer (ALB):           $19.00
CloudFront + S3:                $6.00
CloudWatch Monitoring:          $9.00
Secrets Manager:               $11.00
Route 53 + DNS:                 $1.50
Data Transfer:                  $4.00
Other services:                 $6.50
────────────────────────────────────────
TOTAL RECOMMENDED:            $119.00
────────────────────────────────────────

WITH BUFFER: $140-150/month (reserves for growth)
```

---

## 📁 FILES CONFIGURED

✅ **terraform.tfvars** - Ready for deployment
- Database: db.t4g.micro ✅
- ECS: 256 CPU / 1024 MB ✅
- Multi-AZ: false ✅
- Domain: desh.co (enabled) ✅

✅ **task-definition.json** - Updated
- CPU: 256 (0.5 vCPU) ✅
- Memory: 1024 (1 GB) ✅
- Port: 3001 ✅
- Secrets: Using Secrets Manager ✅

✅ **All Terraform files** - Ready to apply
- 19 files in infra/terraform/ ✅
- No changes needed ✅

---

## 🎯 DEPLOYMENT CHECKLIST

### Pre-Deployment (Before Running Terraform)

```
☐ 1. AWS Account Access
     - Verify you can access AWS Account 425687053209
     - Ensure you have Admin/PowerUser permissions
     - Run: aws sts get-caller-identity

☐ 2. AWS CLI Configuration
     - Run: aws configure
     - Enter your AWS Access Key ID and Secret Access Key
     - Region: us-east-1
     - Output format: json

☐ 3. Terraform Installation
     - Verify Terraform >= 1.6
     - Run: terraform --version

☐ 4. Domain Preparation (desh.co)
     - Ensure desh.co domain is accessible
     - If using Route 53, transfer nameservers
     - If external registrar, be ready to update DNS

☐ 5. SSH Key (Optional)
     - Create EC2 key pair if needed for bastion access
     - Name: clubapp-dev-key
```

### Deployment Steps

```
☐ 6. Initialize Terraform
     cd infra/terraform
     terraform init

☐ 7. Plan Terraform
     terraform plan -var-file=../terraform.tfvars

☐ 8. Apply Terraform
     terraform apply -var-file=../terraform.tfvars
     (This will take 10-15 minutes)

☐ 9. Capture Outputs
     terraform output > deployment-outputs.txt
     Save all outputs (VPC ID, ALB DNS, RDS endpoint, etc.)

☐ 10. Configure Secrets (Create 16 secrets in AWS)
      Run: python scripts/create_secrets.py
      (with AWS credentials configured)

☐ 11. Deploy Backend
      - Build Docker image
      - Push to ECR
      - Update ECS task definition
      - Deploy to ECS

☐ 12. Deploy Frontend
      - Build React app
      - Upload to S3
      - Invalidate CloudFront
      - Test at assets.desh.co

☐ 13. Verify Health Checks
      - Check ALB: http://api.desh.co/health
      - Check S3: https://assets.desh.co
      - Check RDS: from backend logs
      - Check Redis: from backend logs

☐ 14. Monitor & Verify
      - CloudWatch Logs: /ecs/clubapp-backend
      - Health checks: 3/3 passing
      - No errors in logs
```

---

## 📊 COMPARISON: OLD vs NEW CONFIGURATION

```
                          OLD (Unused)    NEW (Recommended)    Savings
                          ────────────    ────────────────    ────────
Database:                 db.t4g.medium   db.t4g.micro        -$33
                          $65/month       $32/month

Compute:                  1 vCPU / 2GB    0.5 vCPU / 1GB      -$18
                          $36/month       $18/month

Multi-AZ:                 true (HA)       false (MVP)          -$50
                          $100/month      $50/month

────────────────────────────────────────────────────────────────────
TOTAL SAVINGS:                                                 -$101
OLD WOULD COST: ~$200+/month
NEW COSTS:      ~$119/month

RECOMMENDED BUDGET: $140-150/month
```

---

## 🔐 AWS ACCOUNT DETAILS

```
Account ID:     425687053209
Region:         us-east-1
Availability:   2 AZs (us-east-1a, us-east-1b)
VPC CIDR:       10.0.0.0/16

Subdomains:
  - api.desh.co       → ALB (backend API)
  - assets.desh.co    → CloudFront (frontend)

ECR Registry:   425687053209.dkr.ecr.us-east-1.amazonaws.com/clubapp-backend

IAM Roles:
  - ecsTaskExecutionRole  (ECS execution)
  - ecsTaskRole           (Application permissions)

S3 Buckets (auto-generated):
  - clubapp-dev-assets
  - clubapp-dev-logs
  - clubapp-dev-receipts
```

---

## 📋 SECRETS TO CREATE (16 total)

```
✅ AWS Configuration:
   - socialclub/aws/role-arn: arn:aws:iam::425687053209:role/github-actions-role
   - socialclub/aws/s3-staging-bucket: clubapp-dev-assets
   - socialclub/aws/s3-production-bucket: clubapp-prod-assets
   - socialclub/aws/cloudfront-staging-id: (from terraform output)
   - socialclub/aws/cloudfront-production-id: (from terraform output)
   - socialclub/aws/ecr-registry: 425687053209.dkr.ecr.us-east-1.amazonaws.com

✅ API Configuration:
   - socialclub/api/vite-api-url: https://api.desh.co
   - socialclub/api/backend-url: https://api.desh.co

✅ Container Registry:
   - socialclub/registry/username: github

✅ External Integrations (optional):
   - socialclub/integration/slack-webhook: (your Slack webhook)
   - socialclub/integration/snyk-token: (your Snyk token)
   - socialclub/integration/codecov-token: (your Codecov token)

✅ Database:
   - socialclub/database/database-url: (from terraform output)
   - socialclub/database/redis-url: (from terraform output)

✅ Docker Registry (optional):
   - socialclub/docker/docker-username: (your Docker Hub username)
   - socialclub/docker/docker-password: (your Docker Hub password)
```

---

## 🚀 NEXT IMMEDIATE STEPS

### Step 1: Prerequisites (1 hour)
```bash
# 1. Configure AWS CLI
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)

# 2. Verify AWS Access
aws sts get-caller-identity
# Should show: Account: 425687053209

# 3. Check Terraform
terraform --version
# Should show: >= 1.6
```

### Step 2: Deploy Infrastructure (15-20 minutes)
```bash
# 1. Go to terraform directory
cd infra/terraform

# 2. Initialize
terraform init

# 3. Review plan
terraform plan -var-file=terraform.tfvars

# 4. Deploy (takes 10-15 minutes)
terraform apply -var-file=terraform.tfvars

# 5. Save outputs
terraform output
```

### Step 3: Create Secrets (5 minutes)
```bash
# 1. Configure secrets
python scripts/create_secrets.py

# 2. Verify
python verify_secrets.py
```

### Step 4: Deploy Backend (10 minutes)
```bash
# 1. Build Docker image
docker build -t clubapp-backend:latest backend/

# 2. Tag for ECR
docker tag clubapp-backend:latest \
  425687053209.dkr.ecr.us-east-1.amazonaws.com/clubapp-backend:latest

# 3. Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  425687053209.dkr.ecr.us-east-1.amazonaws.com

docker push 425687053209.dkr.ecr.us-east-1.amazonaws.com/clubapp-backend:latest

# 4. Update ECS (via Console or AWS CLI)
aws ecs update-service \
  --cluster clubapp-dev \
  --service clubapp-backend \
  --force-new-deployment
```

### Step 5: Deploy Frontend (10 minutes)
```bash
# 1. Build
npm run build

# 2. Deploy to S3
aws s3 sync dist/ s3://clubapp-dev-assets/

# 3. Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

---

## ⚠️ IMPORTANT NOTES

1. **No existing AWS resources yet** - Everything will be created fresh
2. **Terraform will manage all resources** - Don't manually create anything
3. **Secrets must be created** - Application won't work without them
4. **Domain transfer needed** - desh.co nameservers must point to Route 53
5. **Initial setup takes ~1-2 hours** - Including testing

---

## 📞 SUPPORT & MONITORING

### Monitor Costs
```
1. Go to AWS Cost Explorer
2. Filter by project tag: clubapp
3. Set budget alert: $200/month
4. Review weekly
```

### Monitor Performance
```
1. CloudWatch: /ecs/clubapp-backend
2. ALB Health Checks: 2/2 healthy targets
3. RDS: Check connections and CPU
4. Redis: Check hit rate and memory
```

### Common Issues
```
❌ "No space for new task"
   → Increase ALB target group capacity
   → Or reduce task count

❌ "Database connection timeout"
   → Check RDS security group
   → Ensure ECS can reach RDS

❌ "Static assets not loading"
   → Check S3 bucket policy
   → Verify CloudFront distribution
```

---

## ✅ SUCCESS CRITERIA

Deployment is complete when:
- ✅ Terraform apply completed with 0 errors
- ✅ 16 secrets created in AWS Secrets Manager
- ✅ ECS cluster has 2 healthy tasks
- ✅ ALB health checks: 2/2 passing
- ✅ RDS database accessible
- ✅ Redis cache connected
- ✅ API accessible at https://api.desh.co/health
- ✅ Frontend accessible at https://assets.desh.co
- ✅ CloudWatch logs showing no errors
- ✅ Monthly bill < $150

---

## 🎉 COMPLETION SUMMARY

**Status**: ✅ Configuration Complete - Ready to Deploy  
**Estimated Time**: 2-3 hours total  
**Estimated Cost**: $119-150/month  
**Savings vs Old Config**: $50-100/month  

**Files Ready**:
- ✅ terraform.tfvars (deployment variables)
- ✅ task-definition.json (ECS config)
- ✅ All 19 Terraform files (infrastructure)
- ✅ scripts/create_secrets.py (secrets setup)

**Next Action**: Run `cd infra/terraform && terraform init && terraform plan`

---

**Configuration Date**: October 31, 2025  
**Prepared By**: AI Assistant  
**Status**: READY FOR DEPLOYMENT ✅
