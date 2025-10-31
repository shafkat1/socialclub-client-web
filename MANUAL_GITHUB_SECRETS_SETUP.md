# 📋 MANUAL GitHub Repository Secrets Setup

**Important**: You must do this manually in GitHub because you own the repository.

---

## 🔴 Current Problem

✅ Code is in GitHub  
✅ GitHub Actions workflows exist  
❌ **Secrets are NOT configured**  
❌ **Deployment cannot start without secrets**

---

## ✅ Solution: Add 16 GitHub Secrets (5 minutes)

### Step 1: Go to GitHub Repository Settings

1. Open: **https://github.com/shafkat1/socialclub-client-web**
2. Click the **"Settings"** tab
3. On the left sidebar, click **"Secrets and variables"**
4. Click **"Actions"**

You should see a page that says **"New repository secret"** button

---

### Step 2: Add Each Secret One By One

Click **"New repository secret"** and add these secrets in order:

#### **Critical Secrets (MUST HAVE)**

```
SECRET #1
Name: AWS_ROLE_ARN
Value: arn:aws:iam::425687053209:role/github-actions-role
[Click Add secret]

SECRET #2
Name: AWS_REGION
Value: us-east-1
[Click Add secret]

SECRET #3
Name: AWS_S3_STAGING_BUCKET
Value: clubapp-dev-assets
[Click Add secret]

SECRET #4
Name: AWS_S3_PRODUCTION_BUCKET
Value: clubapp-dev-assets
[Click Add secret]

SECRET #5
Name: AWS_CLOUDFRONT_STAGING_ID
Value: E32TNLEZPNE766
[Click Add secret]

SECRET #6
Name: AWS_CLOUDFRONT_PRODUCTION_ID
Value: E32TNLEZPNE766
[Click Add secret]

SECRET #7
Name: AWS_ECR_REGISTRY
Value: 425687053209.dkr.ecr.us-east-1.amazonaws.com
[Click Add secret]

SECRET #8
Name: VITE_API_URL
Value: https://api.desh.co/api
[Click Add secret]

SECRET #9
Name: BACKEND_API_URL
Value: https://api.desh.co/api
[Click Add secret]
```

#### **Optional Secrets**

```
SECRET #10
Name: SLACK_WEBHOOK
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
(or leave blank if you don't want Slack notifications)
[Click Add secret]

SECRET #11
Name: SNYK_TOKEN
Value: your-snyk-token
[Click Add secret]

SECRET #12
Name: CODECOV_TOKEN
Value: your-codecov-token
[Click Add secret]

SECRET #13
Name: DOCKER_USERNAME
Value: your-docker-username
[Click Add secret]

SECRET #14
Name: DOCKER_PASSWORD
Value: your-docker-password
[Click Add secret]
```

---

## 📸 Visual Steps

### Step 1: Go to Settings
```
GitHub.com → Your Repo → Settings Tab
```

### Step 2: Find Secrets
```
Left Sidebar → Secrets and variables → Actions
```

### Step 3: Add Secret
```
Green "New repository secret" button → Fill in Name and Value → Add secret
```

### Step 4: Repeat
```
Repeat for all 16 secrets
```

---

## ✅ After Adding Secrets

Once all secrets are added, the deployment will start automatically on the next push!

To trigger deployment immediately:

```bash
cd C:\ai4\socialcloud-deploy
git add .
git commit -m "Trigger deployment with secrets configured"
git push origin main
```

Then check: **https://github.com/shafkat1/socialclub-client-web/actions**

---

## 🎯 Expected Timeline After Adding Secrets

| Step | Time | What Happens |
|------|------|---|
| Push code | 2 min | GitHub Actions triggered |
| Frontend build | 5 min | React app builds with Vite |
| Frontend deploy | 3 min | Files upload to S3 |
| CloudFront | 2 min | Cache invalidated |
| **Frontend Live** | **~10 min** | **✅ Website up** |
| Backend build | 5 min | Docker image created |
| ECR push | 2 min | Image pushed to registry |
| Terraform | 5 min | Infrastructure updated |
| ECS deploy | 5 min | Backend deployed |
| Health check | 2 min | Services verified |
| **Backend Live** | **~25 min** | **✅ API up** |

---

## ✨ Success Indicators

### Frontend Ready (10 min)
- Navigate to: https://d1r3q3asi8jhsv.cloudfront.net
- Should see the application loading

### Backend Ready (25 min)
- Run: `curl https://api.desh.co/api/health`
- Should return a 200 OK response

### Full Success (30-40 min total)
- Frontend and backend both working
- Application fully deployed
- Ready for testing

---

## 🔧 Troubleshooting

### "I can't find the Settings tab"
1. Make sure you're logged into GitHub as **shafkat1**
2. Make sure you're viewing **YOUR** repository (shafkat1/socialclub-client-web)
3. Refresh the page (F5)

### "The secret isn't showing up"
1. After clicking "Add secret", it should appear in the list
2. Scroll down to see all secrets
3. They should show as dots (hidden values)

### "Deployment still failed after adding secrets"
1. Check that you added ALL 9 critical secrets minimum
2. Check for typos in secret values (especially AWS IDs)
3. Try pushing a new commit to trigger the workflow again

---

## 📝 Checklist

Before triggering deployment, verify:

- [ ] Signed into GitHub as shafkat1
- [ ] In repository: shafkat1/socialclub-client-web
- [ ] In Settings → Secrets and variables → Actions
- [ ] Added AWS_ROLE_ARN secret
- [ ] Added AWS_REGION secret
- [ ] Added AWS_S3_STAGING_BUCKET secret
- [ ] Added AWS_S3_PRODUCTION_BUCKET secret
- [ ] Added AWS_CLOUDFRONT_STAGING_ID secret
- [ ] Added AWS_CLOUDFRONT_PRODUCTION_ID secret
- [ ] Added AWS_ECR_REGISTRY secret
- [ ] Added VITE_API_URL secret
- [ ] Added BACKEND_API_URL secret
- [ ] All secrets show in the list

---

## 🚀 Final Step

After adding all secrets:

```bash
# Trigger deployment
cd C:\ai4\socialclub-deploy
git add .
git commit -m "Deployment ready with all secrets configured"
git push origin main

# Watch it deploy
# https://github.com/shafkat1/socialclub-client-web/actions
```

---

## 📊 Current Status

| Item | Status |
|------|--------|
| Code in GitHub | ✅ YES |
| Workflows configured | ✅ YES |
| Secrets added | ❌ NO - **YOU NEED TO DO THIS** |
| Deployment started | ❌ NO - waiting for secrets |
| Frontend live | ❌ NO - waiting for deployment |
| Backend live | ❌ NO - waiting for deployment |

---

**Once you add the secrets, your application will be deployed automatically! 🎉**
