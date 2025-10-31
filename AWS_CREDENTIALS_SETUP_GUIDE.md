# AWS Credentials Setup & Automated Secrets Creation

## Status Check

- ✅ AWS CLI installed: version 2.31.24
- ❌ AWS credentials NOT configured

---

## Step 1: Create AWS Access Keys

### Via AWS Console

1. **Log in to AWS Console**
   - Go to https://console.aws.amazon.com/

2. **Navigate to IAM**
   - Click on your account name (top right) → "My Security Credentials"
   - OR go to Services → IAM → Users → Select your username

3. **Create Access Key**
   - Click on the "Security credentials" tab
   - Under "Access keys for use with CLI, SDK, & API operations", click "Create access key"
   - Choose "Application running outside AWS"
   - Click "Create access key"

4. **Save Your Credentials**
   - You'll see:
     - Access Key ID (starts with AKIA...)
     - Secret Access Key (save this securely!)
   - **IMPORTANT**: Store these securely - you won't see the secret key again!

---

## Step 2: Configure AWS CLI

### Run Configuration Command

Open PowerShell and run:

```powershell
aws configure
```

### Enter Your Credentials

You'll be prompted for:

```
AWS Access Key ID [None]: AKIA...your-access-key-id...
AWS Secret Access Key [None]: ...your-secret-access-key...
Default region name [None]: us-east-1
Default output format [None]: json
```

**Example:**
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]: json
```

### Verify Configuration

After running `aws configure`, verify it worked:

```powershell
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

---

## Step 3: Run the Automated Secrets Creation Script

### Navigate to Project Directory

```powershell
cd C:\ai4\desh\socialclub-client-web
```

### Make Script Executable

```powershell
icacls scripts/create-aws-secrets.sh /grant Everyone:F
```

### Run the Script

```powershell
./scripts/create-aws-secrets.sh us-east-1
```

Or if you have bash/git bash installed:

```bash
bash scripts/create-aws-secrets.sh us-east-1
```

### Expected Output

You should see:

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                  🔐 AWS SECRETS MANAGER SETUP                                 ║
╚════════════════════════════════════════════════════════════════════════════════╝

✓ AWS CLI configured correctly
ℹ Using region: us-east-1

📋 AWS CONFIGURATION SECRETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creating secret: socialclub/aws/role-arn
✓ Secret 'socialclub/aws/role-arn' created/updated

[... more secrets being created ...]

✅ SECRETS CREATION COMPLETE
✓ All 16 secrets have been created/updated in AWS Secrets Manager
```

---

## Step 4: Update Secret Values

The script creates all 16 secrets with **placeholder values**. You now need to update them with your actual values.

### Update Each Secret

```powershell
aws secretsmanager update-secret `
  --secret-id socialclub/aws/role-arn `
  --secret-string "arn:aws:iam::YOUR_ACCOUNT_ID:role/github-actions-role" `
  --region us-east-1
```

### Or Use AWS Console

1. Go to AWS Secrets Manager
2. For each secret, click on it and update the value
3. Refer to `AWS_SECRETS_MANUAL_SETUP.md` for what each value should be

### Required Values to Update

| Secret | Where to Get | Example |
|--------|-------------|---------|
| `socialclub/aws/role-arn` | AWS IAM → Roles | `arn:aws:iam::123456789:role/github-actions-role` |
| `socialclub/aws/s3-staging-bucket` | S3 bucket name | `socialclub-frontend-staging` |
| `socialclub/aws/s3-production-bucket` | S3 bucket name | `socialclub-frontend-production` |
| `socialclub/aws/cloudfront-staging-id` | CloudFront distribution | `E1234567890ABC` |
| `socialclub/aws/cloudfront-production-id` | CloudFront distribution | `E0987654321XYZ` |
| `socialclub/aws/ecr-registry` | ECR registry URL | `123456789.dkr.ecr.us-east-1.amazonaws.com` |
| `socialclub/api/vite-api-url` | Your backend URL | `https://api-staging.socialclub.com` |
| `socialclub/api/backend-url` | Your backend URL | `https://api-staging.socialclub.com` |
| `socialclub/registry/username` | GitHub | `github` |
| `socialclub/integration/slack-webhook` | Slack | `https://hooks.slack.com/...` |
| `socialclub/integration/snyk-token` | Snyk | Your token |
| `socialclub/integration/codecov-token` | CodeCov | Your token |
| `socialclub/database/database-url` | RDS endpoint | `postgresql://user:pass@host:5432/db` |
| `socialclub/database/redis-url` | Redis endpoint | `redis://host:6379` |
| `socialclub/docker/docker-username` | Docker Hub | Your username |
| `socialclub/docker/docker-password` | Docker Hub | Your token/password |

---

## Step 5: Verify All Secrets Are Created

### List All Secrets

```powershell
aws secretsmanager list-secrets `
  --filters Key=name,Values=socialclub `
  --region us-east-1 `
  --query 'SecretList[*].[Name,Description]' `
  --output table
```

### Expected Output

```
------------------------------------------  ----------------------------------
|  Name                                   |  Description                     |
------------------------------------------  ----------------------------------
|  socialclub/aws/role-arn                |  GitHub Actions IAM role ARN...  |
|  socialclub/aws/s3-staging-bucket       |  S3 bucket for staging frontend  |
|  socialclub/aws/s3-production-bucket    |  S3 bucket for production...     |
|  ... 13 more secrets ...
------------------------------------------  ----------------------------------
```

### Retrieve a Specific Secret

```powershell
aws secretsmanager get-secret-value `
  --secret-id socialclub/aws/role-arn `
  --region us-east-1 `
  --query 'SecretString' `
  --output text
```

---

## Troubleshooting

### Error: "Unable to locate credentials"

**Solution:**
```powershell
aws configure
# Then enter your credentials as shown in Step 2
```

### Error: "User: ... is not authorized"

**Solution:**
Make sure your AWS IAM user has permissions:
- `secretsmanager:CreateSecret`
- `secretsmanager:UpdateSecret`
- `secretsmanager:PutSecretValue`

Contact your AWS administrator to add these permissions.

### Error: "Invalid region: 'us-east-1'"

**Solution:**
Region is already valid. Try:
```powershell
aws ec2 describe-regions --region-names us-east-1
```

### Script Doesn't Run

**Solution 1 - Using PowerShell:**
```powershell
# Make sure you're in the right directory
cd C:\ai4\desh\socialclub-client-web

# Try bash if installed
bash scripts/create-aws-secrets.sh us-east-1
```

**Solution 2 - Using Git Bash:**
```bash
cd /c/ai4/desh/socialclub-client-web
bash scripts/create-aws-secrets.sh us-east-1
```

---

## Next Steps After Setup

1. ✅ Configure AWS CLI (`aws configure`)
2. ✅ Run the script (`./scripts/create-aws-secrets.sh us-east-1`)
3. ✅ Update all secret values with your actual credentials
4. ✅ Verify all 16 secrets are created
5. ✅ Add secrets to GitHub Actions:
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Create matching GitHub secrets

---

## Security Best Practices

✅ **Never share your Access Keys**
✅ **Rotate access keys regularly**
✅ **Use IAM roles when possible**
✅ **Enable MFA on AWS account**
✅ **Use Secrets Manager for sensitive data**
✅ **Enable CloudTrail logging**
✅ **Use least privilege IAM policies**

---

## Quick Commands Reference

```powershell
# Configure AWS
aws configure

# Verify AWS configuration
aws sts get-caller-identity

# List secrets
aws secretsmanager list-secrets --filters Key=name,Values=socialclub --region us-east-1 --query 'SecretList[*].Name' --output table

# Get secret value
aws secretsmanager get-secret-value --secret-id socialclub/aws/role-arn --region us-east-1 --query 'SecretString' --output text

# Update secret
aws secretsmanager update-secret --secret-id socialclub/aws/role-arn --secret-string "new-value" --region us-east-1

# Delete secret (with 7-day recovery)
aws secretsmanager delete-secret --secret-id socialclub/aws/role-arn --recovery-window-in-days 7 --region us-east-1
```

---

**Created**: October 31, 2025  
**Version**: 1.0  
**Status**: Ready for Implementation
