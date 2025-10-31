# ✅ DEPLOYMENT CHECKLIST

**Status**: Ready to Begin  
**Estimated Time**: 60-70 minutes  
**Date Started**: _______________

---

## 📋 PRE-DEPLOYMENT (Before You Start)

- [ ] Read this entire checklist
- [ ] Read `TERRAFORM_INSTALLATION_GUIDE.md`
- [ ] Verify AWS account access (Account: 425687053209)
- [ ] Verify AWS CLI is installed: `aws --version`
- [ ] Verify AWS credentials: `aws sts get-caller-identity`
- [ ] Have Terraform download link ready: https://www.terraform.io/downloads.html
- [ ] Have Docker installed: `docker --version`
- [ ] Have Git installed: `git --version`

---

## 🔧 STEP 1: INSTALL TERRAFORM (5 minutes)

**Time**: ___:___ - ___:___

### 1.1 Download Terraform
- [ ] Go to https://www.terraform.io/downloads.html
- [ ] Download Terraform 1.13.4 for Windows (AMD64)
- [ ] Select the `.zip` file

### 1.2 Extract Terraform
- [ ] Create folder: `C:\terraform`
- [ ] Extract downloaded `.zip` to `C:\terraform`
- [ ] Verify `terraform.exe` exists in `C:\terraform`

### 1.3 Add to PATH
- [ ] Press `Win + X` and select "System"
- [ ] Click "Advanced system settings"
- [ ] Click "Environment Variables"
- [ ] Find "Path" under System variables
- [ ] Click "Edit" and add new entry: `C:\terraform`
- [ ] Click OK three times
- [ ] **Close and reopen terminal**

### 1.4 Verify Installation
- [ ] Open new PowerShell terminal
- [ ] Run: `terraform version`
- [ ] Should show: `Terraform v1.13.4`
- [ ] ✅ Record time: ___:___

---

## 🏗️ STEP 2: INITIALIZE TERRAFORM (2 minutes)

**Time**: ___:___ - ___:___

### 2.1 Navigate to Terraform Directory
```powershell
cd C:\ai4\socialclub-deploy\infra\terraform
```
- [ ] Verify you're in correct directory
- [ ] Run: `ls` (or `dir` on Windows)
- [ ] Should see: `terraform.tfvars`, `main.tf`, `variables.tf`

### 2.2 Initialize Terraform
```powershell
terraform init
```
- [ ] Wait for initialization to complete
- [ ] Should see: "Terraform has been successfully configured!"
- [ ] Check for `.terraform/` directory
- [ ] ✅ Record time: ___:___

---

## 📊 STEP 3: PLAN DEPLOYMENT (3 minutes)

**Time**: ___:___ - ___:___

### 3.1 Review Configuration
```powershell
terraform validate
```
- [ ] Should show: "Success! The configuration is valid."

### 3.2 Create Deployment Plan
```powershell
terraform plan -var-file=terraform.tfvars
```
- [ ] Review the plan output carefully
- [ ] Should show: `Plan: XX to add, 0 to change, 0 to destroy`
- [ ] Verify resources include: VPC, RDS, ECS, S3, CloudFront, etc.
- [ ] ✅ Record time: ___:___

**⚠️ IMPORTANT**: Review the plan carefully before proceeding!

---

## 🚀 STEP 4: APPLY INFRASTRUCTURE (20 minutes)

**Time**: ___:___ - ___:___

### 4.1 Deploy to AWS
```powershell
terraform apply -var-file=terraform.tfvars
```

### 4.2 Confirm Deployment
- [ ] When prompted: "Do you want to perform these actions?"
- [ ] Type: `yes`
- [ ] Press Enter
- [ ] **DO NOT INTERRUPT** - This takes ~20 minutes

### 4.3 Monitor Progress
- [ ] Watch for creation messages:
  - `aws_vpc.main: Creating...`
  - `aws_rds_instance.main: Creating...` (Takes longest - 10+ min)
  - `aws_ecs_cluster.main: Creating...`
  - And more...

### 4.4 Verify Completion
- [ ] Should see: "Apply complete!"
- [ ] Note any outputs (ALB endpoint, RDS endpoint, etc.)
- [ ] ✅ Record time: ___:___

---

## 🔐 STEP 5: CREATE AWS SECRETS (5 minutes)

**Time**: ___:___ - ___:___

### 5.1 Create Secrets
```powershell
cd C:\ai4\socialclub-deploy
python scripts/create_secrets.py
```
- [ ] Script will create 16 secrets in AWS Secrets Manager
- [ ] Watch for: `[CREATE] socialclub/...`
- [ ] At end should see: "SECRETS CREATION COMPLETE"

### 5.2 Verify Secrets
```powershell
python scripts/verify_secrets.py
```
- [ ] Script will list all 16 secrets
- [ ] Verify all 16 secrets are created
- [ ] ✅ Record time: ___:___

---

## 🐳 STEP 6: DEPLOY BACKEND (15 minutes)

**Time**: ___:___ - ___:___

### 6.1 Build Docker Image
```powershell
cd C:\ai4\socialclub-deploy
docker build -t clubapp-backend:latest backend/
```
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Should see: "Successfully tagged clubapp-backend:latest"

### 6.2 Get ECR Repository URL
```powershell
aws ecr describe-repositories --query 'repositories[?repositoryName==`clubapp-backend`].repositoryUri' --output text
```
- [ ] Note the ECR URI (format: 425687053209.dkr.ecr.us-east-1.amazonaws.com/clubapp-backend)
- [ ] ECR URI: _________________________________

### 6.3 Tag Docker Image
```powershell
docker tag clubapp-backend:latest <ECR_URI>:latest
```
- [ ] Replace `<ECR_URI>` with URI from above

### 6.4 Login to ECR
```powershell
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ECR_URI>
```
- [ ] Should see: "Login Succeeded"

### 6.5 Push Image to ECR
```powershell
docker push <ECR_URI>:latest
```
- [ ] Wait for push to complete
- [ ] Should see: "latest: digest: sha256:..."
- [ ] ✅ Record time: ___:___

---

## 🎨 STEP 7: BUILD FRONTEND (10 minutes)

**Time**: ___:___ - ___:___

### 7.1 Install Dependencies
```powershell
cd C:\ai4\socialclub-deploy
npm install
```
- [ ] Wait for installation to complete

### 7.2 Build Frontend
```powershell
npm run build
```
- [ ] Wait for build to complete
- [ ] Should see: "dist/" directory created
- [ ] Should see: "✓ built in XXms"
- [ ] ✅ Record time: ___:___

---

## 📤 STEP 8: DEPLOY FRONTEND (10 minutes)

**Time**: ___:___ - ___:___

### 8.1 Get S3 Bucket Name
```powershell
aws s3 ls | grep clubapp
```
- [ ] Note the assets bucket (format: clubapp-dev-assets)
- [ ] S3 Bucket: _________________________________

### 8.2 Upload to S3
```powershell
aws s3 sync dist/ s3://<BUCKET_NAME>/ --delete
```
- [ ] Replace `<BUCKET_NAME>` with bucket name from above
- [ ] Wait for sync to complete
- [ ] Should see: "upload: dist/index.html..."
- [ ] ✅ Record time: ___:___

---

## ✅ STEP 9: VERIFICATION (10 minutes)

**Time**: ___:___ - ___:___

### 9.1 Get Infrastructure Outputs
```powershell
cd C:\ai4\socialclub-deploy\infra\terraform
terraform output
```
- [ ] Record outputs:
  - ALB Endpoint: _________________________________
  - RDS Endpoint: _________________________________
  - CloudFront Domain: _________________________________
  - ECR Repository: _________________________________

### 9.2 Verify AWS Infrastructure
```powershell
# Check ECS tasks
aws ecs list-clusters --region us-east-1

# Check RDS database
aws rds describe-db-instances --query 'DBInstances[*].DBInstanceIdentifier' --output text

# Check S3 buckets
aws s3 ls

# Check CloudFront
aws cloudfront list-distributions --query 'DistributionList.Items[*].DomainName' --output text
```
- [ ] All resources appear to be created
- [ ] ECS cluster has running tasks
- [ ] RDS instance is available
- [ ] S3 buckets exist
- [ ] CloudFront distribution exists

### 9.3 Test Backend API
```powershell
curl http://<ALB_ENDPOINT>/api/health
```
- [ ] Replace `<ALB_ENDPOINT>` with ALB endpoint from step 9.1
- [ ] Should return health check response
- [ ] ✅ Backend is running

### 9.4 Test Frontend
- [ ] Open browser
- [ ] Go to: `http://<CLOUDFRONT_DOMAIN>`
- [ ] Replace with CloudFront domain from step 9.1
- [ ] Should load application
- [ ] ✅ Frontend is running

### 9.5 Check CloudWatch Logs
```powershell
aws logs describe-log-groups --query 'logGroups[*].logGroupName' --output text | grep clubapp
```
- [ ] Should see log groups for backend
- [ ] ✅ Logging is working

---

## 🎉 FINAL CHECKLIST

### All Systems Go
- [ ] Terraform completed successfully
- [ ] AWS infrastructure is created (14 services)
- [ ] Secrets are created (16 secrets)
- [ ] Backend Docker image is pushed to ECR
- [ ] Backend is running on ECS
- [ ] Frontend is built and uploaded to S3
- [ ] Frontend is accessible via CloudFront
- [ ] API health check passes
- [ ] CloudWatch logs are available
- [ ] All resources verified in AWS console

### Post-Deployment
- [ ] Update DNS records (optional - for production domain)
- [ ] Configure monitoring alerts
- [ ] Set up automated backups (RDS)
- [ ] Configure auto-scaling policies
- [ ] Test error scenarios
- [ ] Review CloudWatch logs for errors
- [ ] Verify CI/CD pipelines in GitHub

---

## 📊 DEPLOYMENT SUMMARY

| Step | Expected Time | Actual Time | Status |
|------|----------------|------------|--------|
| 1. Install Terraform | 5 min | ___:___ | ☐ |
| 2. Initialize Terraform | 2 min | ___:___ | ☐ |
| 3. Plan Deployment | 3 min | ___:___ | ☐ |
| 4. Apply Infrastructure | 20 min | ___:___ | ☐ |
| 5. Create Secrets | 5 min | ___:___ | ☐ |
| 6. Deploy Backend | 15 min | ___:___ | ☐ |
| 7. Build Frontend | 10 min | ___:___ | ☐ |
| 8. Deploy Frontend | 10 min | ___:___ | ☐ |
| 9. Verification | 10 min | ___:___ | ☐ |
| | **Total: 80 min** | **___:___** | **✅** |

**Start Time**: ___:___  
**End Time**: ___:___  
**Total Duration**: ___:___

---

## 🐛 TROUBLESHOOTING

If you encounter issues, check these:

### Issue: "terraform: command not found"
- [ ] Terraform not in PATH
- [ ] Add to PATH and restart terminal
- [ ] Verify: `terraform version`

### Issue: "Error: error requesting STS AssumeRole"
- [ ] AWS credentials issue
- [ ] Run: `aws configure`
- [ ] Verify: `aws sts get-caller-identity`

### Issue: "Error: RDS is taking very long"
- [ ] Normal - RDS takes 10-15 minutes
- [ ] Monitor in AWS console
- [ ] Don't interrupt the process

### Issue: "Docker login fails"
- [ ] Re-authenticate to ECR
- [ ] Run the login command again
- [ ] Verify AWS credentials

### Issue: "S3 upload fails"
- [ ] Verify S3 bucket name
- [ ] Check AWS permissions
- [ ] Verify bucket exists: `aws s3 ls`

### Issue: "Frontend not loading"
- [ ] Check CloudFront cache
- [ ] Verify S3 bucket contents: `aws s3 ls s3://<bucket>/`
- [ ] Invalidate CloudFront cache

---

## 📞 NEED HELP?

**Documentation**:
- TERRAFORM_INSTALLATION_GUIDE.md - Detailed setup guide
- DEPLOYMENT_READY_FINAL.md - Project overview
- AWS_COST_BREAKDOWN_2025.md - Cost analysis
- GITHUB_ACTIONS_SETUP.md - CI/CD setup

**Resources**:
- Terraform Docs: https://registry.terraform.io/
- AWS Docs: https://docs.aws.amazon.com/
- GitHub Issues: https://github.com/shafkat1/socialclub-client-web/issues

---

## ✅ COMPLETION SIGN-OFF

- [ ] All steps completed successfully
- [ ] Application is live and accessible
- [ ] All services verified and running
- [ ] Documentation reviewed
- [ ] Ready for production use

**Deployed By**: _______________________  
**Date**: _______________________  
**Time**: _______________________  

**🎉 CONGRATULATIONS! YOUR APPLICATION IS NOW LIVE!** 🎉

---

**Last Updated**: October 31, 2025  
**Version**: 1.0  
**Status**: Ready for Deployment
