# Quick Start - Deploy SocialClub MVP Under $100/Month

**Goal**: Get production app running for < $100/month  
**Time**: 2-3 hours  
**Cost**: ~$85/month  

---

## 🚀 5-MINUTE OVERVIEW

### What You're Getting
✅ Full-stack app (React frontend + NestJS backend)  
✅ Production AWS infrastructure  
✅ CI/CD pipeline (GitHub Actions)  
✅ Database (PostgreSQL + Redis + DynamoDB)  
✅ Global CDN (CloudFront)  
✅ 94% cost savings vs production  

### Cost Breakdown
```
Total: $85/month

ECS:        $12  ← Backend compute
RDS:        $15  ← Database
Redis:       $7  ← Cache
DynamoDB:    $5  ← Real-time data
S3:         $10  ← Storage
CloudFront: $15  ← CDN
ALB:        $16  ← Load balancer
Route 53:    $5  ← DNS
```

---

## 📋 PREREQUISITES

- [ ] AWS account with access to create resources
- [ ] AWS CLI configured (`aws configure`)
- [ ] Terraform installed (v1.0+)
- [ ] GitHub account
- [ ] Domain name (or use AWS default)

---

## 🎯 STEP 1: Prepare Terraform Variables (30 mins)

### Create `terraform-mvp.tfvars`

```bash
cd infra/terraform
cp terraform.tfvars.example terraform-mvp.tfvars
```

### Edit `terraform-mvp.tfvars`:

```hcl
# MVP Configuration
environment = "mvp"
aws_region  = "us-east-1"

# ECS - SINGLE TASK MVP
ecs_task_cpu              = "256"
ecs_task_memory           = "512"
ecs_desired_count_prod    = 1
ecs_desired_count_staging = 0  # Disable staging
ecs_max_capacity          = 1  # No auto-scaling

# RDS - MICRO INSTANCE
rds_instance_class        = "db.t3.micro"
rds_allocated_storage     = "20"
rds_max_allocated_storage = "100"
rds_backup_retention_days = "7"
rds_multi_az              = false
rds_skip_final_snapshot   = false

# ElastiCache - SINGLE NODE
redis_node_type           = "cache.t3.micro"
redis_num_cache_nodes     = "1"
redis_automatic_failover  = false

# DynamoDB - PAY PER REQUEST
dynamodb_billing_mode     = "PAY_PER_REQUEST"

# S3 - BASIC
enable_versioning         = false
enable_replication        = false

# Network - SINGLE AZ
number_of_azs             = 1
enable_nat_gateway        = false

# CloudFront - PRODUCTION ONLY
disable_staging           = true

# Tags
project_name              = "socialclub"
cost_center               = "mvp"
```

---

## 🏗️ STEP 2: Apply Terraform Configuration (1 hour)

### Validate Configuration

```bash
terraform validate
```

### Plan Infrastructure

```bash
terraform plan -var-file=terraform-mvp.tfvars -out=mvp.tfplan
```

**Review the plan carefully** - check costs, resource counts

### Apply Configuration

```bash
terraform apply mvp.tfplan
```

**Wait 10-15 minutes** for AWS to provision all resources

---

## ✅ STEP 3: Verify Deployment (15 mins)

### Check ECS Cluster

```bash
aws ecs list-clusters --region us-east-1
aws ecs describe-services --cluster socialclub-prod --services backend-service
```

### Check RDS Database

```bash
aws rds describe-db-instances --db-instance-identifier socialclub-mvp-postgres
```

### Check RedisCache

```bash
aws elasticache describe-cache-clusters --cache-cluster-id socialclub-redis-mvp
```

### Get Outputs

```bash
terraform output
```

Save these outputs:
- `alb_dns_name` - Backend URL
- `cloudfront_domain_name` - Frontend URL
- `rds_endpoint` - Database connection
- `redis_endpoint` - Cache connection

---

## 🐳 STEP 4: Deploy Backend (30 mins)

### Build Docker Image

```bash
cd ../..  # Go back to project root
docker build -t socialclub-backend:latest ./backend
```

### Push to ECR

```bash
# Get ECR repository
ECR_URI=$(terraform -chdir=infra/terraform output -raw ecr_repository_uri)

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_URI

# Push image
docker tag socialclub-backend:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

### Update ECS Service

```bash
# Get ECS cluster and service names
CLUSTER=$(terraform -chdir=infra/terraform output -raw ecs_cluster_name)
SERVICE=$(terraform -chdir=infra/terraform output -raw ecs_service_name)

# Force new deployment
aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --force-new-deployment \
  --region us-east-1
```

### Verify Backend is Running

```bash
# Get ALB DNS name
ALB_DNS=$(terraform -chdir=infra/terraform output -raw alb_dns_name)

# Test health endpoint
curl http://$ALB_DNS/api/health
```

---

## 🎨 STEP 5: Deploy Frontend (30 mins)

### Build Frontend

```bash
npm run build
```

### Upload to S3

```bash
# Get S3 bucket
S3_BUCKET=$(terraform -chdir=infra/terraform output -raw s3_frontend_bucket)

# Sync build files
aws s3 sync dist/ s3://$S3_BUCKET/ --delete
```

### Invalidate CloudFront Cache

```bash
# Get CloudFront distribution
CLOUDFRONT_ID=$(terraform -chdir=infra/terraform output -raw cloudfront_distribution_id)

# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*"
```

### Access Frontend

```bash
# Get CloudFront domain
FRONTEND_URL=$(terraform -chdir=infra/terraform output -raw cloudfront_domain_name)
echo "Open in browser: https://$FRONTEND_URL"
```

---

## 🔐 STEP 6: Configure Environment Variables (30 mins)

### Get Secret Values from AWS

```bash
aws secretsmanager get-secret-value \
  --secret-id socialclub/database/database-url \
  --query SecretString \
  --output text
```

### Update Secrets in ECS Task Definition

The backend needs these environment variables:
```
DATABASE_URL=<from-secrets>
REDIS_URL=<from-secrets>
JWT_SECRET=<generate-new>
STRIPE_API_KEY=<your-stripe-key>
```

---

## 📊 STEP 7: Monitor Costs (Ongoing)

### Set Up Cost Alert

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name socialclub-mvp-cost-alert \
  --alarm-description "Alert if monthly costs exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:alerts
```

### Check Weekly Costs

```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### Use AWS Cost Explorer

1. Go to AWS Console → Cost Explorer
2. Select "Cost and Usage"
3. Group by "Service"
4. Set date range to "Last 30 Days"
5. Monitor for cost spikes

---

## ✨ TESTING CHECKLIST

After deployment, test these:

- [ ] Frontend loads (`https://$CLOUDFRONT_ID.cloudfront.net`)
- [ ] Backend API responds (`http://$ALB_DNS/api/health`)
- [ ] Login works
- [ ] Can create account
- [ ] Map loads with venues
- [ ] Can browse users
- [ ] Can send drink offer
- [ ] Database connections work
- [ ] Redis cache works
- [ ] Logs appear in CloudWatch

---

## 🚨 TROUBLESHOOTING

### ECS Task Not Starting

```bash
aws ecs describe-tasks \
  --cluster socialclub-prod \
  --tasks <task-arn> \
  --query 'tasks[0].{Status: lastStatus, StoppedReason: stoppedReason}'
```

### Database Connection Issues

```bash
# Test RDS connectivity
psql -h <rds-endpoint> -U postgres -d socialclub
```

### Redis Connection Issues

```bash
# Test Redis connectivity
redis-cli -h <redis-endpoint> -p 6379 ping
```

### High Costs

Check these services:
1. **NAT Gateway** - Should be 0
2. **Data Transfer** - Check CloudFront setup
3. **RDS** - Should be t3.micro
4. **ECS** - Should be 1 task
5. **ElastiCache** - Should be 1 node

---

## 📈 WHEN TO SCALE

### Scale ECS (Add tasks)
- ECS CPU > 70% for 5+ minutes
- Response time > 1 second
- Error rate > 1%
- Daily active users > 1,000

**Cost**: +$12/month per task

### Scale RDS (Upgrade instance)
- Storage > 18 GB (of 20 GB)
- Database connections > 80
- Query time > 1 second
- CPU > 70%

**Cost**: +$15/month for t3.small

### Scale Redis (Add nodes)
- Memory > 400 MB (of 512 MB)
- Evictions > 0
- Hit rate < 80%

**Cost**: +$7/month per node

### Scale DynamoDB (Switch to provisioned)
- Monthly cost > $50
- Predictable traffic pattern
- > 100k requests/day

**Cost**: Variable based on capacity

---

## 🎯 MVP SUCCESS METRICS

Track these weekly:

```
Week 1:
  - Cost: Should be < $30 (pro-rata)
  - Uptime: Should be 99%+
  - Response time: Should be < 500ms
  - Error rate: Should be < 0.1%

Month 1:
  - Cost: Should be ~$85
  - Users: Track growth
  - API requests: Monitor DynamoDB usage
  - Storage: Monitor S3 growth
```

---

## 🎉 SUCCESS!

You now have:
✅ Production-grade app under $100/month  
✅ Scalable infrastructure  
✅ CI/CD pipeline ready  
✅ Monitoring & alerts set up  
✅ Easy upgrade path  

### Next Steps

1. **Marketing**: Get first users
2. **Monitoring**: Watch costs & performance
3. **Feedback**: Collect user feedback
4. **Iterate**: Build features based on feedback
5. **Scale**: Upgrade when needed

---

## 📚 USEFUL COMMANDS

### Monitor Logs
```bash
aws logs tail /aws/ecs/socialclub-backend --follow
```

### Check Performance
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=backend-service \
  --start-time 2025-11-01T00:00:00Z \
  --end-time 2025-11-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

### Get System Info
```bash
terraform output
```

### Destroy MVP (to stop costs)
```bash
terraform destroy -var-file=terraform-mvp.tfvars
```

---

**Status**: ✅ **Ready to Deploy!**

**Questions?** Check:
- AWS_MVP_COST_OPTIMIZATION.md (detailed)
- AWS_ARCHITECTURE_COMPLETE.md (architecture)
- GitHub Actions workflows (.github/workflows/)

🚀 **Let's Launch!**
