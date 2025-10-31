# 🔐 **GITHUB OIDC AUTHENTICATION ISSUE - COMPLETE ANALYSIS**

**Date**: October 31, 2025  
**Status**: 🔴 **BLOCKING - Needs AWS Configuration**  
**Severity**: 🔴 **CRITICAL** - Prevents all deployments

---

## ❌ **THE PROBLEM**

GitHub Actions workflow fails during "Deploy Infrastructure with Terraform" step:

```
❌ FAILED: Configure AWS credentials (OIDC)
Error: Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

**What this means**: 
- GitHub Actions is trying to use OpenID Connect (OIDC) to authenticate with AWS
- AWS is rejecting the authentication attempt
- No deployment can proceed without this authentication working

---

## 🔍 **ROOT CAUSE ANALYSIS**

The error occurs at this line in the workflow:
```yaml
- name: Configure AWS credentials (OIDC)
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}  ← This role must exist in AWS
    aws-region: ${{ env.AWS_REGION }}
```

The workflow expects:
1. ✅ A GitHub secret named `AWS_ROLE_ARN` containing an IAM role ARN
2. ✅ That IAM role to exist in AWS
3. ✅ That role to have a trust policy allowing GitHub to assume it
4. ✅ That role to have permissions for the required AWS services
5. ✅ An OIDC provider registered in AWS for `token.actions.githubusercontent.com`

**What's missing**: AWS infrastructure is not configured for GitHub OIDC.

---

## ✅ **WHAT NEEDS TO BE DONE**

### **Part 1: Set Up GitHub OIDC Provider in AWS**

```bash
# Check if OIDC provider already exists
aws iam list-open-id-connect-providers --region us-east-1
```

**If NOT found**, create it:
```bash
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
  --region us-east-1
```

**Expected output**: 
```json
{
  "OpenIDConnectProviderArn": "arn:aws:iam::425687053209:oidc-provider/token.actions.githubusercontent.com"
}
```

---

### **Part 2: Create IAM Role for GitHub Actions**

Create the role with correct trust policy:

```bash
aws iam create-role \
  --role-name github-actions-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Federated": "arn:aws:iam::425687053209:oidc-provider/token.actions.githubusercontent.com"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
          "StringEquals": {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
          },
          "StringLike": {
            "token.actions.githubusercontent.com:sub": "repo:shafkat1/socialclub-client-web:*"
          }
        }
      }
    ]
  }' \
  --region us-east-1
```

**Expected output**:
```json
{
  "Role": {
    "RoleName": "github-actions-role",
    "Arn": "arn:aws:iam::425687053209:role/github-actions-role",
    ...
  }
}
```

---

### **Part 3: Attach Permissions to Role**

The role needs permissions for Terraform, ECS, ECR, S3, etc:

```bash
aws iam put-role-policy \
  --role-name github-actions-role \
  --policy-name github-actions-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ec2:*",
          "ecs:*",
          "rds:*",
          "elasticache:*",
          "s3:*",
          "cloudfront:*",
          "route53:*",
          "acm:*",
          "iam:PassRole",
          "iam:GetRole",
          "iam:CreateRole",
          "iam:AttachRolePolicy",
          "iam:PutRolePolicy",
          "elasticloadbalancing:*",
          "ecr:*",
          "logs:*",
          "cloudformation:*",
          "kms:*",
          "secretsmanager:*",
          "dynamodb:*"
        ],
        "Resource": "*"
      }
    ]
  }' \
  --region us-east-1
```

---

### **Part 4: Get Role ARN and Add to GitHub**

Get the role ARN:
```bash
aws iam get-role \
  --role-name github-actions-role \
  --query "Role.Arn" \
  --output text \
  --region us-east-1
```

**Expected output**:
```
arn:aws:iam::425687053209:role/github-actions-role
```

Add to GitHub:
1. Go to: https://github.com/shafkat1/socialclub-client-web/settings/secrets/actions
2. Click "New repository secret"
3. **Name**: `AWS_ROLE_ARN`
4. **Value**: `arn:aws:iam::425687053209:role/github-actions-role`
5. Click "Add secret"

---

## 📋 **COMPLETE COMMAND SCRIPT**

Run these commands in sequence in your terminal:

```bash
# 1. Create OIDC Provider
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
  --region us-east-1

# 2. Create Role with Trust Policy
aws iam create-role \
  --role-name github-actions-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Federated": "arn:aws:iam::425687053209:oidc-provider/token.actions.githubusercontent.com"},
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"},
        "StringLike": {"token.actions.githubusercontent.com:sub": "repo:shafkat1/socialclub-client-web:*"}
      }
    }]
  }' \
  --region us-east-1

# 3. Attach Permissions
aws iam put-role-policy \
  --role-name github-actions-role \
  --policy-name github-actions-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["ec2:*","ecs:*","rds:*","elasticache:*","s3:*","cloudfront:*","route53:*","acm:*","iam:*","elasticloadbalancing:*","ecr:*","logs:*","cloudformation:*","kms:*","secretsmanager:*","dynamodb:*"],
      "Resource": "*"
    }]
  }' \
  --region us-east-1

# 4. Get and Display Role ARN
echo "GitHub Secret Value (AWS_ROLE_ARN):"
aws iam get-role --role-name github-actions-role --query "Role.Arn" --output text --region us-east-1
```

---

## 🎯 **NEXT STEPS**

1. **Run the AWS commands** above to set up OIDC infrastructure
2. **Copy the role ARN** from step 4
3. **Add GitHub secret** `AWS_ROLE_ARN` with the ARN value
4. **Verify other GitHub secrets** exist (see section below)
5. **Retrigger the workflow** to test
6. **Monitor deployment** in Actions tab

---

## 🔒 **REQUIRED GITHUB SECRETS**

Verify all these secrets exist in GitHub:

| Secret | Value | Status |
|--------|-------|--------|
| `AWS_ROLE_ARN` | `arn:aws:iam::425687053209:role/github-actions-role` | ❌ MISSING |
| `AWS_ECR_REGISTRY` | `425687053209.dkr.ecr.us-east-1.amazonaws.com` | ❓ CHECK |
| `AWS_S3_STAGING_BUCKET` | `socialclub-frontend-staging` | ❓ CHECK |
| `AWS_S3_PRODUCTION_BUCKET` | `socialclub-frontend-production` | ❓ CHECK |
| `AWS_CLOUDFRONT_STAGING_ID` | From CloudFront console | ❓ CHECK |
| `AWS_CLOUDFRONT_PRODUCTION_ID` | From CloudFront console | ❓ CHECK |

Check GitHub secrets at: https://github.com/shafkat1/socialclub-client-web/settings/secrets/actions

---

## 🔍 **VERIFICATION CHECKLIST**

Before retriggering the workflow:

- [ ] AWS OIDC provider created (`token.actions.githubusercontent.com`)
- [ ] `github-actions-role` IAM role exists
- [ ] Role has correct trust policy (allows OIDC token)
- [ ] Permissions policy attached to role (includes EC2, ECS, S3, etc.)
- [ ] GitHub secret `AWS_ROLE_ARN` is set with correct value
- [ ] All other required GitHub secrets are present
- [ ] Workflow file references correct secret names

---

## 🚀 **DEPLOYMENT TIMELINE**

After OIDC is fixed:

| Step | Time | Status |
|------|------|--------|
| Lint & Test | 3-5 min | ✅ Should pass (all fixes applied) |
| Build & Docker | 5-10 min | ⏳ Waiting for OIDC |
| Terraform | 5-10 min | ⏳ Waiting for OIDC |
| Backend Deploy | 5-10 min | ⏳ Waiting for OIDC |
| Frontend Deploy | 3-5 min | ⏳ Waiting for OIDC |
| **TOTAL** | **~25-30 min** | 🟡 BLOCKED |

---

## ✅ **SUCCESS INDICATORS**

Once deployed successfully, you should see:

✅ All GitHub Actions workflows: PASSING  
✅ Backend running on: `https://api.socialclub.com`  
✅ Frontend running on: `https://socialclub.desh.co`  
✅ Terraform state stored in S3  
✅ ECS tasks healthy in AWS  
✅ CloudFront caching static assets  

---

**Current Blocker**: 🔴 GitHub OIDC not configured in AWS  
**Next Action**: Run AWS commands above to set up OIDC infrastructure
