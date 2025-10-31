# 🔴 **PIPELINES FAILURE ANALYSIS - TROUBLESHOOTING GUIDE**

**Date**: October 31, 2025 - 13:10 UTC  
**Status**: 🔴 **ALL PIPELINES FAILING**  
**Reference**: [GitHub Actions Dashboard](https://github.com/shafkat1/socialclub-client-web/actions)

---

## ❌ **CURRENT ISSUE**

All workflows are showing **FAILED** status across all pipeline types:
- Backend & Infrastructure Deploy  
- Backend CI/CD Pipeline
- Frontend CI/CD Pipeline
- Frontend Deploy

**Symptoms**: Red ❌ indicators for all recent runs

---

## 🔍 **ROOT CAUSE ANALYSIS**

### **Possible Causes (in order of likelihood)**

1. **AWS OIDC Authentication Still Failing**
   - GitHub secret might not be properly recognized
   - OIDC token validation might be failing
   - IAM role permissions might be incomplete

2. **Missing or Incorrect GitHub Secrets**
   - One or more required secrets might be missing
   - Secret values might be incorrect
   - Secrets might not have propagated to GitHub Actions

3. **Infrastructure/Configuration Issues**
   - Terraform state issues
   - AWS permissions insufficient
   - Resource naming conflicts

4. **Code/Build Issues**
   - Compilation errors not caught locally
   - Missing dependencies
   - ESLint or test failures

---

## 🛠️ **TROUBLESHOOTING STEPS**

### **Step 1: Verify GitHub Secrets**

```bash
# Go to GitHub and check these secrets exist:
https://github.com/shafkat1/socialclub-client-web/settings/secrets/actions
```

**Required secrets to verify**:
- [ ] `AWS_ROLE_ARN` = `arn:aws:iam::425687053209:role/github-actions-role`
- [ ] `AWS_S3_STAGING_BUCKET` (if exists)
- [ ] `AWS_S3_PRODUCTION_BUCKET` (if exists)
- [ ] `AWS_CLOUDFRONT_STAGING_ID` (if exists)
- [ ] `AWS_CLOUDFRONT_PRODUCTION_ID` (if exists)

### **Step 2: Check AWS IAM Role**

```bash
# Verify role exists and has correct trust policy
aws iam get-role --role-name github-actions-role --region us-east-1

# Check inline policies
aws iam list-role-policies --role-name github-actions-role --region us-east-1

# Get the policy content
aws iam get-role-policy --role-name github-actions-role \
  --policy-name github-actions-policy --region us-east-1
```

### **Step 3: View Detailed Workflow Logs**

To find what's actually failing:

1. Go to: https://github.com/shafkat1/socialclub-client-web/actions
2. Click on a failed workflow run (e.g., most recent Backend CI/CD Pipeline)
3. Click on the failed job
4. Scroll down to see the error message

**Common error messages to look for**:
```
- "Could not assume role" → OIDC issue
- "Invalid request to STS" → Token issue
- "Access denied" → Permissions issue
- "Syntax error" → Code/configuration issue
```

### **Step 4: Test OIDC Locally (Optional)**

```bash
# Test that the AWS credentials work locally
aws sts get-caller-identity
```

This confirms your AWS CLI is working.

---

## 📋 **QUICK FIX CHECKLIST**

### **For OIDC Authentication Issues**:

```bash
# 1. Verify OIDC provider still exists
aws iam list-open-id-connect-providers --region us-east-1

# 2. Verify role exists
aws iam get-role --role-name github-actions-role --region us-east-1

# 3. Verify trust policy (should allow GitHub)
aws iam get-role --role-name github-actions-role \
  --query 'Role.AssumeRolePolicyDocument' --region us-east-1

# 4. Verify permissions attached
aws iam list-role-policies --role-name github-actions-role --region us-east-1
```

### **For GitHub Secrets Issues**:

1. Delete the secret: `AWS_ROLE_ARN`
2. Wait 30 seconds
3. Recreate it with the exact same value
4. Verify it's visible in the list

### **For Build Issues**:

```bash
# Test locally
cd backend && npm run lint
cd backend && npm test
cd backend && npm run build

# Test frontend  
npm run build
```

---

## 📊 **WORKFLOW FAILURE PATTERNS**

### **If failing at "Configure AWS credentials (OIDC)":**

This is the OIDC authentication step. Check:
- [ ] GitHub secret `AWS_ROLE_ARN` exists
- [ ] AWS role `github-actions-role` exists
- [ ] Role has correct trust policy
- [ ] OIDC provider still registered in AWS

### **If failing at ESLint/Tests:**

Check:
- [ ] Local lint passes: `npm run lint`
- [ ] Local tests pass: `npm test`
- [ ] Test coverage passes: `npm run test:cov`

### **If failing at Docker Build:**

Check:
- [ ] Dockerfile is correct
- [ ] All dependencies are installed
- [ ] NestJS compilation succeeds locally

### **If failing at Terraform:**

Check:
- [ ] `terraform.tfvars` is correct
- [ ] AWS resources don't already exist (naming conflicts)
- [ ] IAM role has required permissions

---

## 🚨 **IMMEDIATE DIAGNOSTIC COMMAND**

Run this to see what's actually failing in the workflows:

```bash
# This will show you the most recent workflow run details
# (You'd need GitHub CLI installed, but helpful to know)
# gh run list --limit 1
# gh run view <RUN_ID> --log
```

**Without GitHub CLI, manually check**:
1. Open: https://github.com/shafkat1/socialclub-client-web/actions
2. Click the first (most recent) failed workflow
3. Look for **RED** step with error details
4. Read the error message carefully

---

## ✅ **NEXT STEPS TO RESOLVE**

### **Priority 1: Check the Actual Error**
- View the failed workflow logs on GitHub
- Identify the specific failing step
- Read the error message

### **Priority 2: Verify AWS Configuration**
- Confirm OIDC provider exists
- Confirm role exists and has permissions
- Confirm GitHub secret is correct

### **Priority 3: Verify GitHub Configuration**  
- Confirm secret exists and is visible
- Re-add secret if needed
- Confirm secret name is exactly `AWS_ROLE_ARN`

### **Priority 4: Retry**
- Once verified, push a new commit to trigger workflows again
- Monitor for success

---

## 📝 **DEBUGGING TEMPLATE**

When you check the logs, document:

```
Failing Workflow: ________________
Failing Job: ________________
Failing Step: ________________
Error Message: ________________
Error Code: ________________
Potential Cause: ________________
Proposed Fix: ________________
```

---

## 🔗 **RESOURCES**

- GitHub Actions Logs: https://github.com/shafkat1/socialclub-client-web/actions
- AWS IAM Console: https://console.aws.amazon.com/iam/
- OIDC Documentation: See `OIDC_ISSUE_COMPLETE_ANALYSIS.md`

---

**Status**: 🔴 Pipelines failing - need to check actual error logs  
**Next Action**: Click on failed workflow, view logs, identify the specific error  
**Goal**: Find the exact error message to determine what's blocking deployment
