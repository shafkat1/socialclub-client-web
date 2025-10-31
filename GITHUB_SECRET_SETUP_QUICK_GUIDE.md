# 📝 **GITHUB SECRET SETUP - QUICK GUIDE**

## 🟢 **AWS SIDE: COMPLETE** ✅

✅ OIDC Provider: Created  
✅ IAM Role: `github-actions-role` created  
✅ Permissions: Attached (EC2, ECS, RDS, S3, CloudFront, etc.)  
✅ Role ARN: `arn:aws:iam::425687053209:role/github-actions-role`

---

## 🔵 **GITHUB SIDE: YOUR TURN NOW**

### **Copy This Value**
```
arn:aws:iam::425687053209:role/github-actions-role
```

### **Go to This URL**
```
https://github.com/shafkat1/socialclub-client-web/settings/secrets/actions
```

### **Create New Secret**
| Field | Value |
|-------|-------|
| **Name** | `AWS_ROLE_ARN` |
| **Value** | `arn:aws:iam::425687053209:role/github-actions-role` |

### **Click "Add secret"**

---

## 🎯 **EXPECTED RESULT**

After you add the secret, you should see:

```
Repository secrets (1)
┌─────────────────────┐
│ AWS_ROLE_ARN        │ (value is hidden/masked)
└─────────────────────┘
```

---

## ✅ **VERIFICATION**

1. Navigate to: https://github.com/shafkat1/socialclub-client-web/settings/secrets/actions
2. Look for `AWS_ROLE_ARN` in the list
3. If you see it → ✅ SUCCESS
4. If not → Try adding it again

---

## 🚀 **AFTER SECRET IS ADDED**

### **Retrigger Workflow**

1. Go to: https://github.com/shafkat1/socialclub-client-web/actions
2. Find the failed workflow (Backend & Infrastructure Deploy or Backend CI/CD Pipeline)
3. Click "Re-run failed jobs"
4. Watch deployment progress (should take ~25-30 minutes)

### **Expected Workflow Steps** (in order)

✅ Configure AWS credentials (OIDC) → SHOULD NOW PASS  
⏳ Terraform Initialize → Deploy infrastructure  
⏳ Build Backend Docker Image → Create image  
⏳ Deploy Backend to ECS → Run backend  
⏳ Build Frontend → Create React bundle  
⏳ Deploy Frontend to S3 → Upload assets  
⏳ Invalidate CloudFront → Update cache  

**Result**: Full deployment in ~25-30 minutes!

---

## 🎊 **ONCE DEPLOYMENT COMPLETES**

You can access:

- **Backend API**: `https://api.socialclub.com/api`
- **Frontend**: `https://socialclub.desh.co`
- **API Docs**: `https://api.socialclub.com/api/docs`

All services will be running on AWS:
- ✅ ECS (backend service)
- ✅ RDS (database)
- ✅ ElastiCache (Redis)
- ✅ S3 + CloudFront (frontend)
- ✅ Route53 (DNS)
- ✅ ECR (Docker images)

---

## ⚠️ **COMMON MISTAKES TO AVOID**

❌ **Wrong name**: Don't use `AWS_ROLE` or `ROLE_ARN` → Use `AWS_ROLE_ARN`  
❌ **Extra spaces**: Don't add spaces before/after the value  
❌ **Wrong value**: Don't copy only part of the ARN  
❌ **Missing domain**: Make sure it ends with `:role/github-actions-role`

---

**Status**: Ready to add GitHub secret  
**Next Action**: Go to GitHub and create the secret
