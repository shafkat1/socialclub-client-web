# Database Connection Guide - AWS RDS PostgreSQL

## Quick Connection Details

| Property | Value |
|----------|-------|
| **Host** | clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com |
| **Port** | 5432 |
| **Username** | user |
| **Password** | (See instructions below) |
| **Database** | dbname |
| **Engine** | PostgreSQL |
| **Status** | Available ✅ |

---

## Method 1: Using psql Command Line (Recommended)

### Step 1: Install PostgreSQL Client

#### Windows:
1. Download PostgreSQL installer: https://www.postgresql.org/download/windows/
2. Run the installer
3. When prompted, install the "Command Line Tools" component
4. Complete the installation

#### macOS:
```bash
brew install postgresql
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get install postgresql-client
```

### Step 2: Get Password from AWS Secrets Manager

The password is stored in AWS Secrets Manager. You can retrieve it using:

```bash
aws secretsmanager get-secret-value \
  --secret-id socialclub/database/database-url \
  --region us-east-1 \
  --output text
```

This will return a PostgreSQL connection URL like:
```
postgresql://user:password@clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com:5432/dbname
```

### Step 3: Connect Using psql

**Exact Command:**
```bash
psql \
  --host=clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com \
  --port=5432 \
  --username=user \
  --password \
  --dbname=dbname
```

**When prompted:** Enter the password from Step 2

**Expected Output:**
```
Password for user user:
psql (15.0, server 15.5)
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, compression: off)
Type "help" for help.

dbname=>
```

---

## Method 2: Using DBeaver (GUI) - EASIEST

### Step 1: Download and Install

1. Download DBeaver Community Edition: https://dbeaver.io/download/
2. Install on your machine
3. Launch DBeaver

### Step 2: Create New Connection

1. Click **Database** → **New Database Connection**
2. Search for **PostgreSQL**
3. Click **Next**

### Step 3: Enter Connection Details

Fill in the following:

| Field | Value |
|-------|-------|
| **Server Host** | clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com |
| **Port** | 5432 |
| **Database** | dbname |
| **Username** | user |
| **Password** | (From AWS Secrets Manager) |
| **SSL** | Enable (recommended for AWS) |

### Step 4: Test Connection

Click **Test Connection...** - You should see "Connected" message

### Step 5: Finish

Click **Finish** to save the connection

### Step 6: Browse Database

Your database connection will appear in the left panel. Click to expand and explore tables, schemas, etc.

---

## Method 3: Using AWS Systems Manager Session Manager (For Private VPC)

If the direct connection times out (database is in private VPC), use Session Manager:

### Step 1: Create a Bastion Host (Jump Box)

The database is in a private VPC and not directly accessible from your local machine. You need to:

1. Launch an EC2 instance in the same VPC (with public IP)
2. Or use AWS Systems Manager Session Manager for shell access

### Step 2: Connect via Session Manager

```bash
aws ssm start-session --target i-xxxxx --region us-east-1
```

### Step 3: Connect from Bastion

Once connected to the EC2 instance, run:

```bash
psql \
  --host=clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com \
  --port=5432 \
  --username=user \
  --password \
  --dbname=dbname
```

---

## Useful psql Commands

### After Connecting

| Command | Description |
|---------|-------------|
| `\dt` | List all tables |
| `\d table_name` | Show table structure |
| `\l` | List all databases |
| `\du` | List users/roles |
| `\dn` | List schemas |
| `SELECT * FROM table_name;` | Query table |
| `\q` | Exit psql |
| `\h` | Show help |

### Common Queries

```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Count records in a table
SELECT COUNT(*) FROM table_name;

-- Show current user
SELECT current_user;

-- Show current database
SELECT current_database();

-- List tables with row counts
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## Troubleshooting

### Error: "connection timeout"

**Reason:** Database is in a private VPC and not publicly accessible

**Solution:** 
- Use AWS Systems Manager Session Manager (Method 3)
- Or use backend API instead of direct connection

### Error: "password authentication failed"

**Reason:** Wrong password

**Solution:**
- Retrieve the correct password from AWS Secrets Manager
- Verify you're using the correct username

### Error: "could not translate host name"

**Reason:** Unable to resolve hostname (DNS issue)

**Solution:**
- Check your internet connection
- Verify the hostname is correct
- Try pinging the host: `ping clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com`

### Error: "role 'user' does not exist"

**Reason:** Wrong username

**Solution:**
- Username should be: `user`
- Or check AWS RDS console for correct master username

---

## Alternative: Query via Backend API

Instead of connecting directly, you can use the backend API:

```bash
# Create a test user via API
curl -X POST http://clubapp-dev-alb-505439685.us-east-1.elb.amazonaws.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'

# Get user profile
curl -X GET http://clubapp-dev-alb-505439685.us-east-1.elb.amazonaws.com/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Security Notes

⚠️ **Important:**
- Never share the database password
- Don't store credentials in code
- Always use SSL/TLS for connections
- The database is in a private VPC for security
- Direct connections from local machine may timeout - use bastion or API

---

## Connection String for Applications

### Environment Variable Format:
```
postgresql://user:password@clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com:5432/dbname
```

### Prisma ORM:
```
DATABASE_URL="postgresql://user:password@clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com:5432/dbname"
```

### Node.js pg Library:
```javascript
const pool = new Pool({
  host: 'clubapp-dev-postgres.c1jtbcb1z2w1.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'dbname',
  user: 'user',
  password: 'password',
  ssl: true
});
```

---

## Still Having Issues?

If you continue to have connection issues, try:

1. **Check AWS RDS Console:** Verify database is "Available"
2. **Check Security Groups:** Ensure port 5432 is allowed
3. **Check Network ACLs:** Verify inbound/outbound rules
4. **Use VPC Endpoint:** Create a VPC endpoint for private access
5. **Contact AWS Support:** For infrastructure-level issues
