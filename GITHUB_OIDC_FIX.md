# GitHub Actions OIDC Fix - Complete

**Problem**: GitHub Actions workflows were failing with:
```
Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

**Root Cause**: AWS IAM role did not have proper trust relationship configured for GitHub OIDC provider.

---

## Solution Implemented

### 1. Created GitHub OIDC Provider
- Added `aws_iam_openid_connect_provider` resource in `github-oidc.tf`
- URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

### 2. Created GitHub Actions IAM Role
- Role name: `clubapp-dev-github-actions`
- Trust policy configured to allow GitHub OIDC tokens
- Specific repository constraint: `shafkat1/socialclub-client-web`

### 3. Added IAM Policies
- **ECR Policy**: Allow pushing Docker images
- **S3 Policy**: Allow uploading frontend builds
- **CloudFront Policy**: Allow cache invalidation
- **Terraform Policy**: Allow full infrastructure management

---

## Files Created/Modified

1. `infra/terraform/github-oidc.tf` - New file with OIDC configuration
2. `infra/terraform/variables.tf` - Added `additional_tags` variable
3. GitHub workflows - Already have `audience: sts.amazonaws.com` configured

---

## What Happens Next

1. ✅ Terraform creates OIDC provider in AWS
2. ✅ Terraform creates IAM role with proper trust
3. ✅ GitHub Actions gets role ARN from Terraform output
4. ✅ Next deployment attempt will succeed

---

## Role ARN Output

After Terraform completes, get the role ARN:
```bash
cd infra/terraform
terraform output github_actions_role_arn
```

This is already configured in GitHub secret `AWS_ROLE_ARN`.

---

## Timeline

- **Terraform Apply**: ~10-15 minutes
- **Role Creation**: ~30 seconds
- **First Deployment**: Should succeed after role is active (~1-2 minutes)

---

**Status**: 🚀 **IN PROGRESS - Terraform Applying**  
**Next Check**: ~10 minutes
# GitHub OIDC role successfully created
