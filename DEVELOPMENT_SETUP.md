# Pragyan AI - Development Setup

**Last Updated**: July 14, 2026  
**Status**: Ready for Local Development

---

## 🚀 Quick Start (Local Development)

### Prerequisites

You need MongoDB running locally on port 27017.

### Option 1: MongoDB on Windows (via Download)

1. **Download MongoDB Community**:
   - Go to https://www.mongodb.com/try/download/community
   - Select Windows, download .msi installer
   - Run installer, accept defaults

2. **Start MongoDB**:
   ```powershell
   # MongoDB should start automatically after installation
   # Or start manually:
   mongod  # In a separate terminal
   ```

3. **Verify MongoDB is running**:
   ```powershell
   # In another terminal:
   mongo  # Should connect successfully
   ```

### Option 2: MongoDB via Docker (Recommended)

If you have Docker installed:

```powershell
docker run -d -p 27017:27017 --name pragyan-mongodb mongo:latest
```

---

## ▶️ Start Development Server

Once MongoDB is running:

```powershell
cd backend
npm run start
```

**Expected Output**:
```
✓ CSV Career Dataset loaded: 200 records, 32 unique careers
[Static] Serving frontend from ...
Prisma initialization status: connected
[Server] Listening on http://localhost:3000
```

---

## ✅ Environment Configuration

Your `.env` is now configured for development:

- **MongoDB**: `mongodb://localhost:27017/Pragyan`
- **Port**: `3000`
- **JWT Secret**: 32+ character dev key (for testing)
- **Session Secret**: 32+ character dev key (for testing)
- **Frontend**: `http://localhost:5173`

---

## 🧪 Test the Backend

### Health Check
```bash
curl http://localhost:3000/health
# Expected: {"status":"OK","timestamp":"..."}
```

### Test Login (Create test user first)
```bash
# This assumes you have a user in the database
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Test Assessment
```bash
curl -X POST http://localhost:3000/api/assessment/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answers":{"q1":"answer1"}}'
```

---

## 📊 Database Management

### View Data in MongoDB

**Using MongoDB Compass** (GUI):
1. Download from https://www.mongodb.com/products/compass
2. Connect to `mongodb://localhost:27017`
3. Browse collections in the `Pragyan` database

**Using MongoDB CLI**:
```powershell
mongo  # Connect to local MongoDB
use Pragyan  # Select database
db.User.find()  # View users
db.assessmentresult.find()  # View assessment results
```

### Reset Database (Delete All Data)
```powershell
mongo
use Pragyan
db.dropDatabase()
exit
```

---

## 🔧 Development Workflow

### 1. Make Code Changes
Edit files in `backend/src/`

### 2. Rebuild
```bash
npm run build
```

### 3. Restart Server
Stop server (Ctrl+C) and run:
```bash
npm run start
```

---

## 🐛 Troubleshooting

### Issue: "mongod: command not found"
**Solution**: MongoDB not installed or not in PATH
- Install via https://www.mongodb.com/try/download/community
- Or use Docker: `docker run -d -p 27017:27017 mongo:latest`

### Issue: "Connection refused on 27017"
**Solution**: MongoDB not running
```powershell
mongod  # Start MongoDB in another terminal
```

### Issue: "DATABASE_URL is required"
**Solution**: Add DATABASE_URL to `.env`
```env
DATABASE_URL="mongodb://localhost:27017/Pragyan"
```

### Issue: "JWT_SECRET must be at least 32 characters"
**Solution**: .env already has 32+ char secrets. If you see this, your .env file is corrupted.

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── server.ts           # Server entry point
│   ├── config/
│   │   ├── env.ts          # Environment config (requires 32+ char secrets)
│   │   └── passport.ts     # OAuth configuration
│   ├── modules/
│   │   └── auth/           # Authentication module
│   ├── routes/             # API routes
│   ├── controllers/        # Route handlers
│   ├── services/           # Business logic
│   └── middleware/         # Express middleware
├── prisma/
│   └── schema.prisma       # Database schema
├── .env                    # Development environment (local MongoDB)
├── package.json
└── tsconfig.json
```

---

## 🎯 Next Steps

1. ✅ Start MongoDB locally
2. ✅ Run `npm run start`
3. ✅ Test endpoints with curl or Postman
4. ✅ Make code changes and test
5. ✅ When ready for production, follow `FINAL_DEPLOYMENT_GUIDE.md`

---

## 📚 Related Documentation

- `FINAL_DEPLOYMENT_GUIDE.md` - Production deployment steps
- `SECURITY_PRE_DEPLOYMENT_CHECKLIST.md` - Security verification
- `PRAGYAN_QUICK_REFERENCE.md` - System overview

---

**Happy developing!** 🚀

