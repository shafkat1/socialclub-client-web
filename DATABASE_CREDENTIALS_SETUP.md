# Database Credentials Setup Guide

## Problem

The AWS Secrets Manager secret `socialclub/database/database-url` contains **placeholder values**:

```
postgresql://user:password@host:5432/dbname
```

These are NOT the actual credentials - they're just placeholders that were set when the secret was created.

## Solution

You need to set up the **real credentials** by:

1. Setting a real password on the RDS master user
2. Updating the Secrets Manager secret with the real connection URL

---

## Step-by-Step Setup

### STEP 1: Reset RDS Master Password

**AWS Console Method:**

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Click **Databases** in the left sidebar
3. Find and click **clubapp-dev-postgres**
4. Click the **Modify** button (top right)
5. Scroll down to **Credential settings** section
6. Under **Master password**, enter a **new strong password**
   - Example: `MySecurePassword123!@#`
   - Keep it somewhere safe!
7. Scroll to the bottom and click **Apply immediately**
8. Wait for the modification to complete (status will show "Modifying" then "Available")

**AWS CLI Method (if you prefer):**

```bash
aws rds modify-db-instance \
  --db-instance-identifier clubapp-dev-postgres \
  --master-user-password YOUR_NEW_PASSWORD \
  --apply-immediately \
  --region us-east-1
```

Replace `YOUR_NEW_PASSWORD` with a strong password.

---

### STEP 2: Update AWS Secrets Manager Secret

**Console Method:**

1. Go to [AWS Secrets Manager](https://console.aws.amazon.com/secretsmanager/)
2. Search for: **socialclub/database/database-url**
3. Click on it to open the secret details
4. Click the **Edit secret** button
5. In the **Secret value** section, replace the entire value with:

```
postgresql://app:YOUR_PASSWORD@clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com:5432/postgres
```

Replace `YOUR_PASSWORD` with the password you set in Step 1.

6. Click **Save**

**AWS CLI Method:**

```bash
aws secretsmanager update-secret \
  --secret-id socialclub/database/database-url \
  --secret-string 'postgresql://app:YOUR_PASSWORD@clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com:5432/postgres' \
  --region us-east-1
```

Replace `YOUR_PASSWORD` with the password from Step 1.

---

### STEP 3: Test Connection with psql

Once you've completed Steps 1 and 2, test the connection:

```bash
psql --host=clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=app \
     --password \
     --dbname=postgres
```

When prompted for password, enter the password you set in Step 1.

**Expected Output:**

```
Password for user app:
psql (15.0, server 15.5)
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, compression: off)
Type "help" for help.

postgres=>
```

---

## Your Final Credentials

| Parameter | Value |
|-----------|-------|
| **Username** | `app` |
| **Password** | [The password you set in Step 1] |
| **Host** | `clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com` |
| **Port** | `5432` |
| **Database** | `postgres` |

---

## Useful PostgreSQL Commands (After Connecting)

```sql
-- List all databases
\l

-- List all tables
\dt

-- Show table structure
\d table_name

-- Count rows in a table
SELECT COUNT(*) FROM table_name;

-- Exit psql
\q
```

---

## Security Notes

⚠️ **Important:**
- Store the password securely (password manager, AWS Secrets Manager, etc.)
- Never commit the password to version control
- Never share the password in chat, email, or documentation
- The database is in a private VPC - direct connections from outside may timeout
- Use AWS Systems Manager Session Manager or a bastion host for production access

---

## If You Forgot the Password

If you forgot the password you set:

1. Go back to AWS RDS Console
2. Modify the instance again and set a new password
3. Update the Secrets Manager secret with the new password

There's no way to retrieve the old password - AWS doesn't store it. You can only reset it to a new value.
