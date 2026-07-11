# Backend Setup - Quick Start

## Problem

Backend cannot connect to MongoDB Atlas. Error:
```
Error creating a database connection
DNS resolution failed
```

## Solution: Use Local MongoDB

### Option 1: MongoDB Community Edition (Recommended for Development)

#### Step 1: Download & Install MongoDB

**Windows:**
1. Go to https://www.mongodb.com/try/download/community
2. Select Windows, MSI format
3. Download and run installer
4. Choose "Install MongoDB as a Windows Service" during setup
5. MongoDB will auto-start on system startup

**Verify Installation:**
```powershell
mongod --version
```

#### Step 2: Start MongoDB

**If installed as Windows Service (automatic):**
```powershell
# MongoDB should already be running
# Verify it's running:
Get-Service MongoDB
```

**If not running automatically:**
```powershell
# Start MongoDB manually
mongod
```

**You should see:**
```
[initandlisten] Listening on 127.0.0.1:27017
```

---

### Option 2: MongoDB Atlas (Cloud) - IP Whitelist Fix

If you prefer using Atlas instead of local MongoDB:

1. **Go to:** https://cloud.mongodb.com
2. **Login** to your account
3. **Select your project** → **Cluster0**
4. **Click "Network Access"** in left menu
5. **Click "Add IP Address"**
6. **Choose one:**
   - ✅ **"Add Current IP"** (recommended)
   - ⚠️ **"Allow access from anywhere"** (0.0.0.0/0) - Less secure but easier
7. **Click Confirm**
8. **Restore your original DATABASE_URL** in `backend/.env`

---

## Current Configuration

Your `backend/.env` is set to use **local MongoDB**:
```
DATABASE_URL="mongodb://localhost:27017/Pragyan"
```

This is correct for local development.

---

## Starting the Backend

### Terminal 1: Start MongoDB
```powershell
mongod
```
Wait for: `[initandlisten] Listening on 127.0.0.1:27017`

### Terminal 2: Start Backend Server
```powershell
cd backend
npm run dev
```

Wait for: `Server running on port 5000` (or similar)

### Terminal 3: Start Frontend Dev Server
```powershell
cd frontend
npm run dev
```

Wait for: `Local: http://localhost:5173/`

---

## Verify Everything is Working

1. **MongoDB Running:**
   - Check Windows Services or look for `mongod` process
   - Should be listening on port 27017

2. **Backend Running:**
   - Terminal shows: `Server running on...`
   - Logs should NOT show MongoDB connection errors

3. **Frontend Running:**
   - Terminal shows: `Local: http://localhost:5173`
   - Browser loads the app

---

## Testing Admin Roadmap Builder

Once all servers are running:

1. **Go to:** http://localhost:5173/admin/roadmaps
2. **Click "New Career"**
3. **Fill form:**
   - Title: "Test Career"
   - Description: "Testing the builder"
4. **Click "Create"**
5. Should work without 403 errors!

---

## Common Issues

### "mongod is not recognized"
- MongoDB not installed or not in PATH
- Solution: Download from https://www.mongodb.com/try/download/community

### "Address already in use: 127.0.0.1:27017"
- Another MongoDB instance is running
- Solution: 
  ```powershell
  # Find and kill the process
  Get-Process mongod | Stop-Process
  ```

### "Cannot connect to localhost:27017"
- MongoDB not running
- Solution: Start `mongod` in a terminal

### "Frontend shows 401 Unauthorized"
- Backend authentication issue
- Solution: Clear browser cookies and login again

### "Button is not defined" error
- Already fixed! Rebuild frontend:
  ```powershell
  cd frontend
  npm run build
  ```

---

## Next Steps

1. ✅ **Install MongoDB Community Edition**
2. ✅ **Start MongoDB** (`mongod` in terminal)
3. ✅ **Start Backend** (`npm run dev` in backend folder)
4. ✅ **Start Frontend** (`npm run dev` in frontend folder)
5. ✅ **Go to admin panel** and create roadmaps!

---

## Switching Back to MongoDB Atlas

If you later want to use Atlas again:

1. Update `.env`:
   ```
   DATABASE_URL="mongodb+srv://ap17052005_db_user:Pragyan123@cluster0.7fsqglj.mongodb.net/Pragyan?retryWrites=true&w=majority&appName=Cluster0"
   ```

2. Restart backend:
   ```powershell
   npm run dev
   ```

3. Make sure IP is whitelisted in Atlas

---

## Support

If you have issues:

1. Check browser console for errors
2. Check backend terminal for errors
3. Verify MongoDB is running: `mongod` should be visible in a terminal
4. Try killing any zombie processes and restart all servers

