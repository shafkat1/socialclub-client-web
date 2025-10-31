# AWS Secrets Manager - Manual Setup Guide

## Overview

This guide provides step-by-step instructions for creating all 16 secrets in AWS Secrets Manager for the SocialClub CI/CD deployment pipeline.

---

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- Access to GitHub, DockerHub, Snyk, CodeCov accounts

---

## Quick Start (Using Script)

If you have AWS CLI configured:

```bash
cd scripts
chmod +x create-aws-secrets.sh
./create-aws-secrets.sh us-east-1
```

Then update all secret values with your actual credentials.

---

## Manual Setup (Via AWS Console)

### Access AWS Secrets Manager

1. Go to AWS Console → Secrets Manager
2. Click "Store a new secret"

---

## Secrets Configuration

### 1️⃣ AWS Configuration Secrets (6 secrets)

#### Secret 1: AWS IAM Role ARN
```
Name: socialclub/aws/role-arn
Description: GitHub Actions IAM role ARN for OIDC

Value (JSON):
{
  "role_arn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/github-actions-role"
}

OR Simple Value:
arn:aws:iam::YOUR_ACCOUNT_ID:role/github-actions-role
```

**How to get this value**:
1. AWS Console → IAM → Roles
2. Search for "github-actions-role"
3. Copy the ARN from role summary (format: `arn:aws:iam::ACCOUNT_ID:role/github-actions-role`)

---

#### Secret 2: S3 Staging Bucket Name
```
Name: socialclub/aws/s3-staging-bucket
Description: S3 bucket for staging frontend

Value: socialclub-frontend-staging
```

**How to create the bucket**:
```bash
aws s3 mb s3://socialclub-frontend-staging --region us-east-1
```

---

#### Secret 3: S3 Production Bucket Name
```
Name: socialclub/aws/s3-production-bucket
Description: S3 bucket for production frontend

Value: socialclub-frontend-production
```

**How to create the bucket**:
```bash
aws s3 mb s3://socialclub-frontend-production --region us-east-1
```

---

#### Secret 4: CloudFront Staging Distribution ID
```
Name: socialclub/aws/cloudfront-staging-id
Description: CloudFront distribution ID for staging

Value: E1234567890ABC
```

**How to get this value**:
1. AWS Console → CloudFront
2. Find your staging distribution
3. Copy the Distribution ID (starts with E)

---

#### Secret 5: CloudFront Production Distribution ID
```
Name: socialclub/aws/cloudfront-production-id
Description: CloudFront distribution ID for production

Value: E0987654321XYZ
```

**How to get this value**:
1. AWS Console → CloudFront
2. Find your production distribution
3. Copy the Distribution ID (starts with E)

---

#### Secret 6: ECR Registry URL
```
Name: socialclub/aws/ecr-registry
Description: ECR registry URL

Value: 123456789.dkr.ecr.us-east-1.amazonaws.com
```

**How to get this value**:
```bash
# Get your AWS Account ID
aws sts get-caller-identity --query 'Account' --output text

# ECR registry format: ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com
# Example: 123456789.dkr.ecr.us-east-1.amazonaws.com
```

---

### 2️⃣ API Configuration Secrets (2 secrets)

#### Secret 7: Vite API URL
```
Name: socialclub/api/vite-api-url
Description: Backend API URL for frontend

Value (staging): https://api-staging.socialclub.com
Value (production): https://api.socialclub.com
```

**Notes**:
- Use staging URL first for testing
- Update to production URL once deployed
- Must include protocol (https://)

---

#### Secret 8: Backend Health Check URL
```
Name: socialclub/api/backend-url
Description: Backend health check URL for deployment verification

Value (staging): https://api-staging.socialclub.com
Value (production): https://api.socialclub.com
```

**Used for**:
- Post-deployment health checks
- Smoke tests to verify backend is running

---

### 3️⃣ Container Registry Secret (1 secret)

#### Secret 9: Container Registry Username
```
Name: socialclub/registry/username
Description: GitHub Container Registry username

Value: github
```

**Note**: GitHub Container Registry uses `github` as username with GitHub PAT as password.

---

### 4️⃣ Integration Secrets (3 secrets - Optional)

#### Secret 10: Slack Webhook
```
Name: socialclub/integration/slack-webhook
Description: Slack webhook for deployment notifications

Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

**How to get this value**:
1. Go to Slack Workspace Settings
2. Click "Apps & Custom Integrations"
3. Search for "Incoming Webhooks"
4. Create new webhook
5. Copy the Webhook URL

**Optional**: Skip if you don't want Slack notifications

---

#### Secret 11: Snyk Token
```
Name: socialclub/integration/snyk-token
Description: Snyk security scanning token

Value: YOUR_SNYK_API_TOKEN
```

**How to get this value**:
1. Go to https://snyk.io
2. Sign up or log in
3. Go to Account Settings → API Token
4. Copy your token

**Optional**: Skip if you don't use Snyk for security scanning

---

#### Secret 12: CodeCov Token
```
Name: socialclub/integration/codecov-token
Description: CodeCov token for coverage reports

Value: YOUR_CODECOV_TOKEN
```

**How to get this value**:
1. Go to https://codecov.io
2. Sign up or log in with GitHub
3. Go to Account → Upload tokens
4. Copy the token

**Optional**: Skip if you don't track code coverage

---

### 5️⃣ Database Secrets (2 secrets)

#### Secret 13: PostgreSQL Connection String
```
Name: socialclub/database/database-url
Description: PostgreSQL connection string

Value: postgresql://username:password@hostname:5432/database_name

Example: postgresql://dbuser:secure_password@db.us-east-1.rds.amazonaws.com:5432/socialclub
```

**How to get this value**:

For AWS RDS:
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier socialclub-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password "YOUR_SECURE_PASSWORD" \
  --allocated-storage 20

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier socialclub-db \
  --query 'DBInstances[0].Endpoint.Address'

# Format: postgresql://admin:YOUR_SECURE_PASSWORD@endpoint:5432/socialclub
```

---

#### Secret 14: Redis Connection String
```
Name: socialclub/database/redis-url
Description: Redis connection string

Value: redis://hostname:6379

Example: redis://redis.us-east-1.elasticache.amazonaws.com:6379
```

**How to get this value**:

For AWS ElastiCache:
```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id socialclub-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1

# Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id socialclub-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint'
```

---

### 6️⃣ Docker Registry Secrets (2 secrets - Optional)

#### Secret 15: Docker Hub Username
```
Name: socialclub/docker/docker-username
Description: Docker Hub username

Value: your_docker_username
```

**Optional**: Only needed if pushing to Docker Hub

---

#### Secret 16: Docker Hub Password
```
Name: socialclub/docker/docker-password
Description: Docker Hub password or personal access token

Value: your_docker_password_or_token
```

**How to get this value**:
1. Go to Docker Hub → Account Settings
2. Click "Security"
3. Generate Access Token (recommended over password)
4. Copy the token

**Optional**: Only needed if pushing to Docker Hub

---

## Summary Table

| # | Name | Type | Required | Value Format |
|---|------|------|----------|--------------|
| 1 | socialclub/aws/role-arn | AWS | Yes | ARN string |
| 2 | socialclub/aws/s3-staging-bucket | AWS | Yes | Bucket name |
| 3 | socialclub/aws/s3-production-bucket | AWS | Yes | Bucket name |
| 4 | socialclub/aws/cloudfront-staging-id | AWS | Yes | Distribution ID |
| 5 | socialclub/aws/cloudfront-production-id | AWS | Yes | Distribution ID |
| 6 | socialclub/aws/ecr-registry | AWS | Yes | Registry URL |
| 7 | socialclub/api/vite-api-url | API | Yes | HTTPS URL |
| 8 | socialclub/api/backend-url | API | Yes | HTTPS URL |
| 9 | socialclub/registry/username | Registry | Yes | Username |
| 10 | socialclub/integration/slack-webhook | Integration | No | Webhook URL |
| 11 | socialclub/integration/snyk-token | Integration | No | API Token |
| 12 | socialclub/integration/codecov-token | Integration | No | Token |
| 13 | socialclub/database/database-url | Database | Yes | Connection string |
| 14 | socialclub/database/redis-url | Database | Yes | Connection string |
| 15 | socialclub/docker/docker-username | Docker | No | Username |
| 16 | socialclub/docker/docker-password | Docker | No | Password/Token |

---

## Verification Steps

### 1. Verify All Secrets Are Created

```bash
aws secretsmanager list-secrets \
  --filters Key=name,Values=socialclub \
  --region us-east-1 \
  --query 'SecretList[*].[Name,Description]' \
  --output table
```

**Expected output**: 16 secrets listed

### 2. Retrieve a Secret Value

```bash
aws secretsmanager get-secret-value \
  --secret-id socialclub/aws/role-arn \
  --region us-east-1 \
  --query 'SecretString' \
  --output text
```

### 3. Update a Secret Value

```bash
aws secretsmanager update-secret \
  --secret-id socialclub/aws/role-arn \
  --secret-string "arn:aws:iam::NEW_ACCOUNT:role/github-actions-role" \
  --region us-east-1
```

---

## Security Best Practices

1. ✅ **Encryption**: All secrets are encrypted at rest using AWS KMS
2. ✅ **Access Control**: Use IAM policies to restrict who can access secrets
3. ✅ **Rotation**: Implement automatic rotation for database passwords
4. ✅ **Auditing**: Enable CloudTrail to audit secret access
5. ✅ **Least Privilege**: Give only necessary permissions to IAM roles
6. ✅ **Monitoring**: Set up CloudWatch alarms for unauthorized access attempts

### Enable Rotation (Optional)

```bash
# For database password rotation
aws secretsmanager rotate-secret \
  --secret-id socialclub/database/database-url \
  --rotation-rules AutomaticallyAfterDays=30 \
  --region us-east-1
```

---

## Next Steps

1. ✅ Create all 16 secrets in AWS Secrets Manager
2. ✅ Verify all secrets are properly created
3. ✅ Add secrets to GitHub Actions:
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Create matching GitHub secrets with values from AWS Secrets Manager
4. ✅ Test the deployment pipeline
5. ✅ Monitor CloudWatch logs for any issues

---

## Troubleshooting

### Secret Creation Failed

**Error**: "User: arn:aws:iam::... is not authorized"

**Solution**:
1. Ensure IAM user/role has `secretsmanager:CreateSecret` permission
2. Check IAM policy attached to your AWS credentials

### Can't Retrieve Secret Value

**Error**: "AccessDeniedException"

**Solution**:
1. Ensure IAM role has `secretsmanager:GetSecretValue` permission
2. Check KMS key policy allows access

### Secret Not Found in GitHub Actions

**Error**: "Secret not found"

**Solution**:
1. Verify secret name matches exactly (case-sensitive)
2. Ensure GitHub secret is created in correct repository
3. Check that GitHub Actions workflow references correct secret names

---

## AWS CLI Cheat Sheet

```bash
# Create a secret
aws secretsmanager create-secret \
  --name my-secret \
  --secret-string "my-value" \
  --region us-east-1

# Update a secret
aws secretsmanager update-secret \
  --secret-id my-secret \
  --secret-string "new-value" \
  --region us-east-1

# Get secret value
aws secretsmanager get-secret-value \
  --secret-id my-secret \
  --region us-east-1

# List all secrets
aws secretsmanager list-secrets --region us-east-1

# Delete a secret (with 7-day recovery window)
aws secretsmanager delete-secret \
  --secret-id my-secret \
  --recovery-window-in-days 7 \
  --region us-east-1

# Add tags to secret
aws secretsmanager tag-resource \
  --secret-id my-secret \
  --tags Key=Environment,Value=production \
  --region us-east-1
```

---

**Last Updated**: October 31, 2025  
**Version**: 1.0  
**Status**: ✅ Ready for Implementation
