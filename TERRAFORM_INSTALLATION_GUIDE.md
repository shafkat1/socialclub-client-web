# 🔧 Terraform Installation & Deployment Guide

**Date**: October 31, 2025  
**Version**: 1.13.4  
**Platform**: Windows 10/11

---

## 📋 QUICK START

If you just want to get started:
1. Download Terraform from: https://www.terraform.io/downloads.html
2. Extract to `C:\terraform`
3. Add `C:\terraform` to Windows PATH
4. Verify: `terraform version`
5. Follow "Deployment Steps" section below

---

## 🔧 INSTALLATION OPTIONS

### Option 1: Manual Installation (Recommended)

#### Step 1: Download
- Go to: https://www.terraform.io/downloads.html
- Download: **Terraform 1.13.4 for Windows (AMD64)**
- Choose the `.zip` file (about 150 MB)

#### Step 2: Extract
```
C:\terraform\
└── terraform.exe
```

#### Step 3: Add to PATH
**Method A: Using GUI**
1. Press `Win + X` → Select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find "Path"
5. Click "Edit"
6. Click "New"
7. Type: `C:\terraform`
8. Click OK → OK → OK
9. **Restart your terminal** (important!)

**Method B: Using PowerShell (Administrator)**
```powershell
# Copy and paste this into PowerShell (Run as Administrator)
$TerraformPath = "C:\terraform"
$CurrentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($CurrentPath -notlike "*$TerraformPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$CurrentPath;$TerraformPath", "User")
    Write-Host "Terraform path added to PATH"
    Write-Host "Please restart your terminal for changes to take effect"
}
```

#### Step 4: Verify Installation
```bash
terraform version
```

Expected output:
```
Terraform v1.13.4
on windows_amd64
```

---

### Option 2: Using Winget (Windows 11+)

```powershell
winget install HashiCorp.Terraform
terraform version
```

---

### Option 3: Using Scoop

```powershell
# Install scoop first if you don't have it
iwr -useb get.scoop.sh | iex

# Then install terraform
scoop install terraform
terraform version
```

---

## 🚀 DEPLOYMENT STEPS

### Prerequisites
- ✅ Terraform installed and verified
- ✅ AWS credentials configured (`~/.aws/credentials`)
- ✅ Repository cloned to `C:\ai4\socialclub-deploy`

### Step 1: Navigate to Terraform Directory
```bash
cd C:\ai4\socialclub-deploy\infra\terraform
```

Verify you're in the right location:
```bash
ls  # or: dir (for Windows)
```

Should show: `terraform.tfvars`, `main.tf`, `variables.tf`, etc.

### Step 2: Initialize Terraform
```bash
terraform init
```

**What this does:**
- Downloads AWS provider plugin
- Sets up local state management
- Creates `.terraform/` directory

**Expected output:**
```
Initializing the backend...
Initializing modules...
Terraform has been successfully configured!
```

**Troubleshooting:**
- If it fails, try: `terraform init -upgrade`
- If slow, wait patiently (first run downloads plugins ~100 MB)

### Step 3: Review Configuration
```bash
terraform validate
```

Should show:
```
Success! The configuration is valid.
```

### Step 4: Plan Deployment
```bash
terraform plan -var-file=terraform.tfvars
```

**What this shows:**
- All resources that will be created
- VPC, subnets, RDS, ECS, CloudFront, etc.
- Estimated changes

**Expected output:**
```
Plan: 87 to add, 0 to change, 0 to destroy.
```

**⚠️ REVIEW THE PLAN CAREFULLY** before proceeding!

### Step 5: Apply Infrastructure (Deploy!)
```bash
terraform apply -var-file=terraform.tfvars
```

**What this does:**
- Creates all AWS resources
- Takes 15-20 minutes
- Your infrastructure is now live!

**When prompted:**
```
Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes
```

Type: `yes` and press Enter

**Progress indicators:**
```
aws_vpc.main: Creating...
aws_rds_instance.main: Creating...  # This takes longest (10+ minutes)
aws_ecs_cluster.main: Creating...
...
```

### Step 6: Get Output Information
```bash
terraform output
```

Shows:
- **ALB endpoint**: Use to access backend API
- **RDS endpoint**: Database connection string
- **CloudFront domain**: CDN for frontend
- **ECR repository**: Docker image registry

Save for later:
```bash
terraform output > deployment-outputs.txt
```

---

## 🔐 AWS SECRETS SETUP

After infrastructure is deployed:

### Step 1: Create AWS Secrets
```bash
cd C:\ai4\socialclub-deploy
python scripts/create_secrets.py
```

Creates 16 secrets in AWS Secrets Manager:
- AWS configuration
- API URLs
- Database connection strings
- Docker registry credentials
- And more

### Step 2: Verify Secrets
```bash
python verify_secrets.py
```

Should show all 16 secrets created successfully.

---

## 🐳 BACKEND DEPLOYMENT

### Step 1: Build Docker Image
```bash
cd C:\ai4\socialclub-deploy
docker build -t clubapp-backend:latest backend/
```

### Step 2: Tag for ECR
```bash
docker tag clubapp-backend:latest \
  425687053209.dkr.ecr.us-east-1.amazonaws.com/clubapp-backend:latest
```

### Step 3: Login to ECR
```bash
aws ecr get-login-password --region us-east-1 --profile myprofile | \
  docker login --username AWS --password-stdin \
  425687053209.dkr.ecr.us-east-1.amazonaws.com
```

### Step 4: Push Image
```bash
docker push 425687053209.dkr.ecr.us-east-1.amazonaws.com/clubapp-backend:latest
```

### Step 5: Update ECS Service
```bash
aws ecs update-service \
  --cluster clubapp-dev \
  --service clubapp-backend \
  --force-new-deployment \
  --region us-east-1 \
  --profile myprofile
```

---

## 🚀 FRONTEND DEPLOYMENT

### Step 1: Build
```bash
cd C:\ai4\socialclub-deploy
npm run build
```

Creates `dist/` directory with optimized files.

### Step 2: Upload to S3
```bash
aws s3 sync dist/ s3://clubapp-dev-assets/ \
  --region us-east-1 \
  --profile myprofile
```

### Step 3: Invalidate CloudFront (Optional)
Get distribution ID from `terraform output`, then:

```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*" \
  --region us-east-1 \
  --profile myprofile
```

---

## ✅ VERIFICATION

Test everything is working:

```bash
# Check infrastructure
terraform output -json

# Check secrets
aws secretsmanager list-secrets \
  --filters Key=name,Values=clubapp \
  --region us-east-1 \
  --profile myprofile

# Check ECS tasks
aws ecs describe-services \
  --cluster clubapp-dev \
  --services clubapp-backend \
  --region us-east-1 \
  --profile myprofile

# Check S3
aws s3 ls s3://clubapp-dev-assets/ --profile myprofile

# Test API
curl https://api.desh.co/health

# Test Frontend
Open browser: https://assets.desh.co
```

---

## 🐛 TROUBLESHOOTING

### "terraform: The term 'terraform' is not recognized"
**Solution**: Terraform not in PATH
- Verify installation: Check `C:\terraform\terraform.exe` exists
- Add to PATH again and restart terminal
- Try full path: `C:\terraform\terraform.exe version`

### "Error: error requesting STS AssumeRole"
**Solution**: AWS credentials issue
- Check credentials: `aws sts get-caller-identity --profile myprofile`
- Verify Access Key ID and Secret Access Key
- Run: `aws configure --profile myprofile` to reconfigure

### "Error: Error acquiring the state lock"
**Solution**: Terraform state lock issue
- Another process is running Terraform
- Wait and try again
- Or: `terraform force-unlock <LOCK_ID>`

### "Error: resource quota exceeded"
**Solution**: AWS account limits
- Request AWS Limit Increase
- Or delete old resources from other projects

### "RDS creation taking very long"
**Normal behavior**: RDS takes 10-15 minutes to create
- Don't interrupt the process
- Monitor AWS console to see progress

### "Docker login fails"
**Solution**: ECR credentials
- Re-authenticate: Run the `docker login` command again
- Check AWS credentials: `aws sts get-caller-identity`

---

## 📊 DEPLOYMENT TIMELINE

| Step | Time | Task |
|------|------|------|
| 1 | 2 min | Terraform init |
| 2 | 3 min | Terraform plan |
| 3-6 | 20 min | Terraform apply |
| 7 | 2 min | Create secrets |
| 8 | 8 min | Build & push backend |
| 9 | 7 min | Build & deploy frontend |
| 10 | 5 min | Verification |
| | **47-57 min** | **TOTAL** |

---

## 📞 SUPPORT

**Getting help:**
- Terraform Docs: https://registry.terraform.io/
- AWS CLI: https://docs.aws.amazon.com/cli/
- GitHub Issues: https://github.com/shafkat1/socialclub-client-web/issues

---

## 🎯 NEXT STEPS

1. ✅ Install Terraform (this guide)
2. ✅ Run `terraform init`
3. ✅ Run `terraform plan` (review carefully!)
4. ✅ Run `terraform apply` (watch it work!)
5. ✅ Create secrets
6. ✅ Deploy backend
7. ✅ Deploy frontend
8. ✅ Verify everything works

**You're now ready to deploy!** 🚀

---

**Last Updated**: October 31, 2025  
**Status**: ✅ READY FOR DEPLOYMENT
