# 🔐 GITHUB OIDC ISSUE - COMPLETE ANALYSIS & FIX

## ❌ Current Error
```
Error: Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

## 🔍 ROOT CAUSE
The GitHub Actions workflow is failing because AWS denies the OIDC token. This means:
- GitHub OIDC provider may not exist in AWS
- OR the IAM role doesn't exist  
- OR the trust policy is misconfigured
- OR the role doesn't have the right permissions

## ✅ STEP-BY-STEP FIX

### 1. Verify GitHub OIDC Provider
```bash
aws iam list-open-id-connect-providers --region us-east-1
```

If empty, create it:
```bash
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
  --region us-east-1
```

### 2. Create GitHub Actions IAM Role
```bash
aws iam create-role \
  --role-name github-actions-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::425687053209:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"},
        "StringLike": {"token.actions.githubusercontent.com:sub": "repo:shafkat1/socialclub-client-web:*"}
      }
    }]
  }' \
  --region us-east-1
```

### 3. Attach Permissions to Role
```bash
aws iam put-role-policy \
  --role-name github-actions-role \
  --policy-name github-actions-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "ec2:*","ecs:*","rds:*","elasticache:*","s3:*","cloudfront:*",
        "route53:*","acm:*","iam:*","elasticloadbalancing:*","ecr:*",
        "logs:*","cloudformation:*","kms:*","secretsmanager:*","dynamodb:*"
      ],
      "Resource": "*"
    }]
  }' \
  --region us-east-1
```

### 4. Get Role ARN
```bash
aws iam get-role --role-name github-actions-role \
  --query "Role.Arn" --output text --region us-east-1
```

### 5. Update GitHub Secret
1. Go to: https://github.com/shafkat1/socialclub-client-web/settings/secrets/actions
2. Create or update secret `AWS_ROLE_ARN`
3. Paste the ARN from step 4

## 📋 VERIFICATION
- [ ] OIDC provider created in AWS
- [ ] `github-actions-role` exists
- [ ] Trust policy allows OIDC
- [ ] Permissions attached
- [ ] GitHub secret updated
- [ ] Workflow rerun successful
