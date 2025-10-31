# 🔴 **DEPLOYMENT BLOCKING ISSUE - GITHUB OIDC AUTHENTICATION**

**Status**: BLOCKED | **Severity**: CRITICAL | **Date**: Oct 31, 2025

---

## ❌ **THE PROBLEM**

GitHub Actions fails at: **"Configure AWS credentials (OIDC)"**

```
Error: Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

**Why**: GitHub OIDC provider is NOT configured in AWS. AWS cannot authenticate GitHub Actions.

---

## ✅ **THE FIX (4 Steps)**

### **Step 1: Create OIDC Provider**
```bash
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
  --region us-east-1
```

### **Step 2: Create IAM Role**
```bash
aws iam create-role \
  --role-name github-actions-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Federated":"arn:aws:iam::425687053209:oidc-provider/token.actions.githubusercontent.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"token.actions.githubusercontent.com:aud":"sts.amazonaws.com"},"StringLike":{"token.actions.githubusercontent.com:sub":"repo:shafkat1/socialclub-client-web:*"}}}]}' \
  --region us-east-1
```

### **Step 3: Attach Permissions**
```bash
aws iam put-role-policy \
  --role-name github-actions-role \
  --policy-name github-actions-policy \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["ec2:*","ecs:*","rds:*","elasticache:*","s3:*","cloudfront:*","route53:*","acm:*","iam:*","elasticloadbalancing:*","ecr:*","logs:*","cloudformation:*","kms:*","secretsmanager:*","dynamodb:*"],"Resource":"*"}]}' \
  --region us-east-1
```

### **Step 4: Get Role ARN & Add to GitHub**
```bash
aws iam get-role --role-name github-actions-role --query "Role.Arn" --output text --region us-east-1
```

Copy output → Go to GitHub → Settings → Secrets → Add new secret:
- **Name**: `AWS_ROLE_ARN`
- **Value**: `arn:aws:iam::425687053209:role/github-actions-role`

---

## 🎯 **NEXT STEPS**

1. Run 4 AWS commands above
2. Copy role ARN from step 4
3. Add GitHub secret `AWS_ROLE_ARN`
4. Retrigger GitHub Actions workflow
5. Monitor deployment (25-30 minutes)

---

For complete details, see: `OIDC_ISSUE_COMPLETE_ANALYSIS.md`
