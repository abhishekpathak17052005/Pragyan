# MongoDB Atlas Production Setup - Pragyan AI

**Status**: Step-by-step guide for production database setup  
**Provider**: MongoDB Atlas (cloud-hosted MongoDB)  
**Tier**: Free M0 or paid M2+ recommended for production

---

## ⚠️ CRITICAL SECURITY NOTICE

Your current `.env` contains exposed credentials:

```
ap17052005_db_user:Pragyan123@cluster0.7fsqglj.mongodb.net
```

**These credentials must be rotated immediately before any Render deployment.**

---

## Step 1: Create Production MongoDB Atlas Account/Project

### 1.1 If you don't have Atlas account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Start Free**
3. Create account with email and password
4. Verify email
5. Complete setup wizard

### 1.2 If you already have Atlas account

1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a new project (optional but recommended for production)
   - Click **Projects** in left sidebar
   - Click **New Project**
   - Name it: `Pragyan-Production`
   - Click **Create Project**

---

## Step 2: Create Production Database Cluster

### 2.1 Create Cluster

1. In your project, click **Create** → **Build a Database**
2. Choose deployment option:

   **Option A: M0 Sandbox (Free, for testing only)**
   - Limited to 512MB storage
   - No guaranteed performance
   - ✅ Good for testing Render deployment
   - ❌ Not suitable for production

   **Option B: M2 (Paid ~$9/month, recommended for production)**
   - 2GB storage included
   - Autoscaling available
   - Better performance
   - ✅ Recommended for production

   **Option C: M10+ (Paid, for large-scale production)**
   - 10GB+ storage
   - Dedicated infrastructure
   - Advanced monitoring

3. For this guide, we'll use **M0 (Free)** for testing

### 2.2 Configure Cluster

1. Select **M0 Sandbox** tier
2. Choose **Cloud Provider & Region**:
   - Provider: **AWS** (default, works well with Render)
   - Region: **us-east-1** (closest to Render's servers)
   - Click **Create**

3. Wait for cluster to be provisioned (~5-10 minutes)
   - You'll see "Cluster is deploying"
   - Once ready: "Cluster is running"

---

## Step 3: Create Database User

### 3.1 Navigate to Database Access

1. In Atlas left sidebar, click **Database Access**
2. Click **Add New Database User**

### 3.2 Create Production User

1. **Authentication Method**: Select **Password**
2. **Username**: Enter `pragyan_prod_user`
3. **Password**: Click **Generate Secure Password**
   - ✅ DO NOT use: `Pragyan123` or simple passwords
   - Let MongoDB generate a strong one
   - **Copy this password** - you'll need it in a moment
4. **Built-in Role**: Select **readWriteAnyDatabase**
5. Click **Add User**

**Save the credentials:**
```
Username: pragyan_prod_user
Password: [your generated password]
```

---

## Step 4: Configure Network Access

### 4.1 Add IP Allowlist

1. In Atlas left sidebar, click **Network Access**
2. Click **Add IP Address**
3. **For Render (dynamic IPs)**: Select **Allow access from anywhere**
   - Enter: `0.0.0.0/0`
   - Confirm: Click **Confirm**

   ⚠️ **Security Note**: This allows any IP. For production:
   - Consider Render's static IP if available
   - Or use VPC peering (advanced)
   - Or firewall rules on application level

---

## Step 5: Get Connection String

### 5.1 Get Connection URI

1. Go back to **Databases** page
2. Click **Connect** on your cluster
3. Choose **Drivers**
4. Select **Node.js** and version **5.x** (or latest)
5. Copy the connection string:

```
mongodb+srv://pragyan_prod_user:<password>@cluster0.xxxxx.mongodb.net/Pragyan?retryWrites=true&w=majority&appName=Pragyan
```

### 5.2 Format Connection String

Replace `<password>` with the actual password you generated:

```
mongodb+srv://pragyan_prod_user:YOUR_GENERATED_PASSWORD@cluster0.xxxxx.mongodb.net/Pragyan?retryWrites=true&w=majority&appName=Pragyan
```

**Example (do not use):**
```
mongodb+srv://pragyan_prod_user:aB1cD2eF3gH4iJ5kL6mN7oP8@cluster0.abc123.mongodb.net/Pragyan?retryWrites=true&w=majority&appName=Pragyan
```

### 5.3 Save Connection String

**Save this** - you'll use it in Render environment variables:

```
DATABASE_URL=mongodb+srv://pragyan_prod_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/Pragyan?retryWrites=true&w=majority&appName=Pragyan
```

---

## Step 6: Verify Connection (Local Testing)

### 6.1 Test Connection Locally

Create `test-mongodb-connection.ts` in backend/:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Test connection
    const result = await prisma.$queryRaw`db.adminCommand({ ping: 1 })`;
    console.log("✅ MongoDB Atlas connection successful:", result);
    
    // Test database
    const dbCheck = await prisma.user.count();
    console.log("✅ Database accessible, user count:", dbCheck);
  } catch (error) {
    console.error("❌ Connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

### 6.2 Run Test

```bash
cd backend

# Set production DATABASE_URL
$env:DATABASE_URL="mongodb+srv://pragyan_prod_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/Pragyan?retryWrites=true&w=majority&appName=Pragyan"

# Run test
npx ts-node test-mongodb-connection.ts
```

Expected output:
```
✅ MongoDB Atlas connection successful: { ok: 1 }
✅ Database accessible, user count: 0
```

If you get an error:
- ❌ Check username/password is correct (watch for special characters)
- ❌ Verify IP allowlist (should be `0.0.0.0/0` or your IP)
- ❌ Verify database name in connection string

---

## Step 7: Create Database and Collections

### 7.1 Option A: Automatic (Recommended)

Let Prisma create schema automatically:

```bash
cd backend
npx prisma db push
```

This creates:
- Database: `Pragyan`
- Collections: users, assessments, profiles, etc. (based on your schema)

### 7.2 Option B: Manual via Atlas UI

1. Go to **Databases** in Atlas
2. Click your cluster name
3. Click **Collections** tab
4. Click **Create Database**
5. Database name: `Pragyan`
6. Collection name: `users`
7. Click **Create**

Repeat for: assessments, profiles, roadmaps, etc.

---

## Step 8: Seed Initial Data (Optional)

If your app needs seed data:

```bash
cd backend

# Set DATABASE_URL
$env:DATABASE_URL="mongodb+srv://pragyan_prod_user:YOUR_PASSWORD@..."

# Run seeds
npm run seed
npm run seed:roadmaps
npm run seed:career-graph
```

---

## Step 9: Monitor Database

### 9.1 View Metrics

1. In Atlas, go to **Metrics**
2. Watch for:
   - **Operations/sec**: Database throughput
   - **Network I/O**: Bandwidth usage
   - **Storage**: Data size
   - **Connection count**: Active connections

### 9.2 View Logs

1. Go to **Logs** in Atlas
2. Check for errors
3. Monitor query performance

### 9.3 Set Alerts

1. Go to **Alerts**
2. Click **Create Alert**
3. Set triggers for:
   - High CPU usage
   - Many failed connections
   - Replication lag
   - Storage near limit

---

## Step 10: Backup Configuration

### 10.1 Enable Automatic Backups

1. Go to **Backup** in Atlas
2. For paid clusters: Backups are automatic (daily snapshots)
3. For M0: Point-in-time recovery not available
4. Click **Backup Policy** to customize (if paid tier)

### 10.2 Manual Backup

1. Go to **Backup** → **Snapshots**
2. Click **Take Snapshot**
3. Wait for backup to complete
4. Can restore from snapshots in **Restore** tab

---

## Security Best Practices

### ✅ DO

- ✅ Use strong passwords (generated by MongoDB)
- ✅ Restrict IP access (or use VPC peering)
- ✅ Enable authentication for all users
- ✅ Use separate credentials for dev/prod
- ✅ Rotate passwords periodically
- ✅ Monitor audit logs
- ✅ Enable encryption at rest (paid tier)
- ✅ Use TLS for connections (enabled by default)

### ❌ DON'T

- ❌ Share connection strings via Slack/email
- ❌ Commit connection strings to git (use .env)
- ❌ Use `root` or `admin` passwords
- ❌ Allow `0.0.0.0/0` IP access (use specific IPs if possible)
- ❌ Store passwords in code
- ❌ Use same password for dev and prod
- ❌ Disable authentication
- ❌ Use HTTP (Atlas enforces TLS)

---

## Connection String Format Reference

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER_NAME/DATABASE_NAME?PARAMETERS
```

Breaking it down:
- `mongodb+srv://` - Protocol (DNS seedlist, automatic)
- `USERNAME:PASSWORD` - Credentials (URL-encoded if special chars)
- `@CLUSTER_NAME` - Cluster address (from Atlas)
- `/DATABASE_NAME` - Database (auto-created)
- `?retryWrites=true` - Automatic retry on transient failures
- `&w=majority` - Write concern (wait for majority replica)
- `&appName=Pragyan` - Application name for logging

---

## Special Characters in Password

If your password contains special characters, URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `#` | `%23` |
| `?` | `%3F` |
| `&` | `%26` |

Example:
- Password: `myP@ss:word`
- Encoded: `myP%40ss%3Aword`
- Connection string: `mongodb+srv://user:myP%40ss%3Aword@cluster.mongodb.net`

---

## Troubleshooting

### "Cannot connect to MongoDB"

**Check:**
1. Username/password correct (watch for typos)
2. IP whitelisted (go to Network Access)
3. Cluster is running (go to Databases, should show "Cluster is running")
4. Network connectivity (ping cluster hostname)

**Test:**
```bash
mongosh "mongodb+srv://pragyan_prod_user:PASSWORD@cluster.mongodb.net/Pragyan"
```

If it connects, Prisma will too.

### "Authentication failed"

- Verify username is `pragyan_prod_user` (not email)
- Verify password matches what MongoDB generated
- Check no extra spaces in connection string
- Try copy-pasting connection string again

### "IP address not whitelisted"

- Go to **Network Access** in Atlas
- Add your current IP or use `0.0.0.0/0`
- Takes ~2 minutes to apply

### "Database not found"

- Databases are created automatically on first use
- If using Prisma: run `npx prisma db push`
- Check your Prisma schema defines models

### "Insufficient privileges"

- User needs **readWriteAnyDatabase** role
- Go to **Database Access** → Edit user
- Update role to **readWriteAnyDatabase**

---

## Production Checklist

- [ ] MongoDB Atlas account created
- [ ] Production cluster created (M2 or higher recommended)
- [ ] Database user `pragyan_prod_user` created
- [ ] Network access configured (IP whitelisted)
- [ ] Connection string obtained and saved
- [ ] Connection tested locally with Prisma
- [ ] Database and collections created
- [ ] Seed data loaded (if needed)
- [ ] Backups configured
- [ ] Alerts set up
- [ ] Security settings reviewed

---

## Connection String Storage

**For Render deployment:**

1. Copy your connection string
2. Go to Render backend service
3. Click **Environment**
4. Add variable:
   ```
   DATABASE_URL=mongodb+srv://pragyan_prod_user:PASSWORD@cluster.mongodb.net/Pragyan?retryWrites=true&w=majority&appName=Pragyan
   ```
5. Save and trigger redeploy

**Never commit connection strings to git** - Atlas `.env` is in `.gitignore` ✓

---

## Next Steps

1. ✅ Create MongoDB Atlas cluster (this guide)
2. ⏭️ Rotate your current MongoDB password (security)
3. ⏭️ Generate production secrets for JWT/SESSION
4. ⏭️ Push code to GitHub
5. ⏭️ Deploy frontend to Render
6. ⏭️ Deploy backend to Render with Atlas connection

---

## Support

- **Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Connection Issues**: [Connection Troubleshooting Guide](https://docs.atlas.mongodb.com/troubleshoot-connection/)
- **Pricing**: [mongodb.com/cloud/atlas/pricing](https://www.mongodb.com/cloud/atlas/pricing)

