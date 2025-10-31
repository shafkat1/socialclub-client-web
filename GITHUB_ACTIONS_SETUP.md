# GitHub Actions Setup Guide

## Overview

This document provides complete instructions for setting up GitHub Actions CI/CD pipelines for the SocialClub application. The setup includes automated testing, building, Docker image creation, and deployment to AWS.

## Prerequisites

1. GitHub repository with admin access
2. AWS account with appropriate permissions
3. Docker Hub or GitHub Container Registry account
4. Slack workspace (optional, for notifications)
5. Snyk account (optional, for security scanning)

---

## Part 1: GitHub Repository Setup

### Step 1: Create Workflow Directories

```bash
mkdir -p .github/workflows
```

### Step 2: Add Workflow Files

Place the following files in `.github/workflows/`:
- `frontend.yml` - Frontend CI/CD pipeline
- `backend.yml` - Backend CI/CD pipeline

Both files are already created in this repository.

---

## Part 2: AWS Setup (GitHub OIDC)

### Step 1: Create IAM Role for GitHub Actions

```bash
# The setup script should create this role with OIDC trust relationship
infra/scripts/setup-github-oidc.sh
```

### Step 2: Create IAM Policy for Frontend Deployment

Create policy: `socialclub-frontend-deploy-policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::socialclub-frontend-staging/*",
        "arn:aws:s3:::socialclub-frontend-production/*",
        "arn:aws:s3:::socialclub-frontend-staging",
        "arn:aws:s3:::socialclub-frontend-production"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 3: Create IAM Policy for Backend Deployment

Create policy: `socialclub-backend-deploy-policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
        "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole"
      ]
    }
  ]
}
```

### Step 4: Attach Policies to GitHub Actions Role

```bash
aws iam attach-role-policy \
  --role-name github-actions-role \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/socialclub-frontend-deploy-policy

aws iam attach-role-policy \
  --role-name github-actions-role \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/socialclub-backend-deploy-policy
```

---

## Part 3: GitHub Secrets Configuration

### Step 1: Navigate to Repository Secrets

1. Go to GitHub repository settings
2. Click "Secrets and variables" → "Actions"
3. Click "New repository secret"

### Step 2: Add Required Secrets

Add all secrets below in GitHub repository settings:

#### AWS Configuration
```
AWS_ROLE_ARN
Value: arn:aws:iam::ACCOUNT_ID:role/github-actions-role
Description: AWS IAM role ARN for OIDC

AWS_S3_STAGING_BUCKET
Value: socialclub-frontend-staging
Description: S3 bucket for staging frontend

AWS_S3_PRODUCTION_BUCKET
Value: socialclub-frontend-production
Description: S3 bucket for production frontend

AWS_CLOUDFRONT_STAGING_ID
Value: E1234567890ABC
Description: CloudFront distribution ID for staging

AWS_CLOUDFRONT_PRODUCTION_ID
Value: E0987654321XYZ
Description: CloudFront distribution ID for production

AWS_ECR_REGISTRY
Value: ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
Description: ECR registry URL

AWS_ECR_REPOSITORY
Value: socialclub-backend
Description: ECR repository name
```

#### API Configuration
```
VITE_API_URL
Value: https://api.socialclub.com (production) or https://api-staging.socialclub.com
Description: Backend API URL for frontend

BACKEND_URL
Value: https://api.socialclub.com
Description: Backend health check URL
```

#### Docker & Container Registry
```
DOCKER_USERNAME
Value: your-docker-username
Description: Docker Hub username (if using Docker Hub)

DOCKER_PASSWORD
Value: your-docker-password
Description: Docker Hub password or token

REGISTRY_USERNAME
Value: ${{ github.actor }}
Description: GitHub Container Registry username (auto-filled)
```

#### Notification
```
SLACK_WEBHOOK
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
Description: Slack webhook for deployment notifications (optional)
```

#### Security Scanning
```
SNYK_TOKEN
Value: your-snyk-api-token
Description: Snyk security scanning token (optional)
```

#### Code Coverage
```
CODECOV_TOKEN
Value: your-codecov-token
Description: Codecov token for coverage reports (optional)
```

### Step 3: Create Environment-Specific Secrets (Optional)

For more granular control, create environment secrets:

**Staging Environment**:
- Name: `staging`
- Click "Add environment secret"
- Add staging-specific variables

**Production Environment**:
- Name: `production`
- Click "Add environment secret"
- Add production-specific variables

---

## Part 4: Environment Variables Configuration

### Frontend Environment Variables

Create `.env.production` in the root directory:

```bash
VITE_API_URL=https://api.socialclub.com
VITE_APP_ENV=production
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Backend Environment Variables

Create `backend/.env.production` in the backend directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
SHADOW_DATABASE_URL=postgresql://user:password@host:5432/shadow_dbname

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-very-secure-jwt-secret-min-32-characters
JWT_EXPIRY=24h

# External Services
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=socialclub-uploads

SENDGRID_API_KEY=your-sendgrid-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
STRIPE_SECRET_KEY=your-stripe-secret-key

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=production

# CORS
CORS_ORIGIN=https://socialclub.com,https://api.socialclub.com

# Server
PORT=3000
SWAGGER_ENABLED=false
```

---

## Part 5: Database Setup

### Step 1: Prepare Database Migrations

Ensure all Prisma migrations are in `backend/prisma/migrations/`:

```bash
cd backend
npx prisma migrate status
```

### Step 2: Create Database in RDS

```bash
# Create database in AWS RDS
aws rds create-db-instance \
  --db-instance-identifier socialclub-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password "your-secure-password" \
  --allocated-storage 20
```

### Step 3: Retrieve Database Connection String

```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier socialclub-db \
  --query 'DBInstances[0].Endpoint.Address'

# Format: postgresql://user:password@endpoint:5432/dbname
```

---

## Part 6: S3 Buckets Setup

### Step 1: Create S3 Buckets for Frontend

```bash
# Staging bucket
aws s3 mb s3://socialclub-frontend-staging

# Production bucket
aws s3 mb s3://socialclub-frontend-production

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket socialclub-frontend-staging \
  --versioning-configuration Status=Enabled

# Block public access (optional, if using CloudFront)
aws s3api put-public-access-block \
  --bucket socialclub-frontend-production \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### Step 2: Create S3 Bucket for Backend Uploads

```bash
aws s3 mb s3://socialclub-uploads

# Enable CORS
aws s3api put-bucket-cors \
  --bucket socialclub-uploads \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedOrigins": ["https://socialclub.com"],
      "MaxAgeSeconds": 3000
    }]
  }'
```

---

## Part 7: ECR (Elastic Container Registry) Setup

### Step 1: Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name socialclub-backend \
  --region us-east-1

# Get repository URI
aws ecr describe-repositories \
  --repository-names socialclub-backend \
  --query 'repositories[0].repositoryUri'
```

### Step 2: Set Lifecycle Policy (Auto-delete old images)

```bash
aws ecr put-lifecycle-policy \
  --repository-name socialclub-backend \
  --lifecycle-policy-text '{
    "rules": [
      {
        "rulePriority": 1,
        "description": "Keep last 10 images",
        "selection": {
          "tagStatus": "any",
          "countType": "imageCountMoreThan",
          "countNumber": 10
        },
        "action": {
          "type": "expire"
        }
      }
    ]
  }'
```

---

## Part 8: ECS Cluster Setup

### Step 1: Create ECS Clusters

```bash
# Staging cluster
aws ecs create-cluster \
  --cluster-name socialclub-staging \
  --capacity-providers FARGATE FARGATE_SPOT

# Production cluster
aws ecs create-cluster \
  --cluster-name socialclub-production \
  --capacity-providers FARGATE FARGATE_SPOT
```

### Step 2: Register Task Definition

```bash
# Update backend/task-definition.json with your values
aws ecs register-task-definition \
  --cli-input-json file://backend/task-definition.json
```

### Step 3: Create ECS Services

```bash
# Staging service
aws ecs create-service \
  --cluster socialclub-staging \
  --service-name socialclub-backend-staging \
  --task-definition socialclub-backend-staging:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"

# Production service (similar)
```

---

## Part 9: CloudFront Distribution Setup

### Step 1: Create CloudFront Distribution

```bash
# Create distribution pointing to S3 bucket
# Replace with your S3 bucket endpoint
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

**cloudfront-config.json** template:

```json
{
  "CallerReference": "socialclub-production-1",
  "Comment": "SocialClub Production Frontend",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "socialclub-frontend-production.s3.us-east-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "Enabled": true
}
```

---

## Part 10: SSL/TLS Certificate (ACM)

### Step 1: Request Certificate

```bash
aws acm request-certificate \
  --domain-name socialclub.com \
  --subject-alternative-names '*.socialclub.com' \
  --region us-east-1
```

### Step 2: Validate Certificate

- Check your email for validation link from AWS
- Click to validate domain ownership

### Step 3: Attach to CloudFront

Update CloudFront distribution to use the certificate.

---

## Part 11: Route53 DNS Setup

### Step 1: Create DNS Records

```bash
# Get CloudFront domain name
aws cloudfront list-distributions --query 'DistributionList.Items[0].DomainName'

# Create Route53 record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "socialclub.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d111111abcdef8.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

---

## Part 12: Testing the Pipelines

### Step 1: Trigger Frontend Pipeline

```bash
# Create and push to develop branch
git checkout -b feature/test
git commit --allow-empty -m "Test frontend pipeline"
git push origin feature/test

# Create pull request to develop branch
```

### Step 2: Trigger Backend Pipeline

```bash
# Create and push to develop branch
git checkout -b feature/test-backend
git commit --allow-empty -m "Test backend pipeline"
git push origin feature/test-backend
```

### Step 3: Monitor Pipeline Execution

1. Go to GitHub repository → "Actions"
2. View workflow runs
3. Check logs for each job

---

## Troubleshooting

### Common Issues

**Issue**: "AWS credentials not found"
**Solution**: Verify AWS_ROLE_ARN secret is set correctly in GitHub

**Issue**: "Deployment failed - S3 access denied"
**Solution**: Check IAM policy permissions and bucket names in secrets

**Issue**: "ECR login failed"
**Solution**: Verify AWS_ECR_REGISTRY secret and IAM permissions

**Issue**: "Docker build failed"
**Solution**: Check Dockerfile path and ensure all dependencies are in npm ci

**Issue**: "Tests failing in CI"
**Solution**: 
- Check DATABASE_URL environment variable
- Ensure database migrations ran
- Check test configuration in jest.config.js

---

## Security Best Practices

1. ✅ Use GitHub OIDC instead of AWS Access Keys
2. ✅ Rotate secrets regularly
3. ✅ Use different secrets for staging and production
4. ✅ Enable branch protection rules requiring CI checks
5. ✅ Use signed commits
6. ✅ Enable repository secret encryption
7. ✅ Audit GitHub Actions logs regularly
8. ✅ Use least privilege IAM policies
9. ✅ Store sensitive data in AWS Secrets Manager
10. ✅ Enable MFA on AWS account

---

## Monitoring & Logs

### View Workflow Logs

```bash
# Using GitHub CLI
gh workflow view frontend.yml --repo owner/repo
gh run list --repo owner/repo
```

### Configure Alerts

- Set up Slack notifications for deployments
- Configure CloudWatch alarms for ECS services
- Set up Sentry alerts for errors

---

## Summary

You should now have:
✅ GitHub Actions workflows for frontend and backend
✅ AWS OIDC authentication configured
✅ S3 buckets ready for frontend hosting
✅ ECR repository ready for backend Docker images
✅ ECS clusters ready for backend deployment
✅ CloudFront distribution for CDN
✅ Route53 DNS configuration
✅ All required secrets configured

Next steps:
1. Test pipelines with dummy commits
2. Deploy to staging environment
3. Run integration tests
4. Promote to production
