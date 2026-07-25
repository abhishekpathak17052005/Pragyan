# Quick Start - CSV Career Integration

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB running
- Backend and Frontend dependencies installed

---

## 📦 Installation Steps

### 1. Install Dependencies (if not already done)

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Verify CSV Dataset

```bash
cd backend
# Check if CSV file exists
dir datasets\AI-based Career Recommendation System.csv
```

Expected output: File should exist with ~200 rows

### 3. Generate Prisma Client

```bash
cd backend
npx prisma generate
```

This will generate TypeScript types for the new models:
- `CSVCareerMatch`
- `CareerRecommendationSnapshot`
- `SkillGapAnalysis`
- `CareerPerformanceScore`

### 4. Run Database Migrations (if needed)

```bash
cd backend
npx prisma db push
```

This creates the new tables in MongoDB.

---

## 🎮 Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

**Expected Console Output:**
```
[CSV Dataset] Loading career dataset...
[CSV Dataset] ✅ Loaded successfully: {
  records: 200,
  careers: 45,
  skills: 150
}
Server running on port 5000
```

### Start Frontend

```bash
cd ../frontend
npm run dev
```

**Expected Console Output:**
```
VITE ready in 500ms
Local: http://localhost:5173/
```

---

## ✅ Testing the Integration

### Step 1: Complete an Assessment

1. Open browser: `http://localhost:5173`
2. Login with test credentials
3. Navigate to **Assessments** page
4. Click "Start Assessment"
5. Answer all questions
6. Click "Submit Assessment"

**What happens behind the scenes:**
- Assessment is submitted to backend
- CSV recommendations are generated automatically
- Performance score is calculated
- Career matches are saved to database

### Step 2: View Recommendations on Dashboard

1. After assessment completion, click "Go to Dashboard"
2. Scroll down to see **"Top Career Match"** card

**Expected:**
```
┌─────────────────────────────────┐
│ ✨ Top Career Match             │
├─────────────────────────────────┤
│ Data Scientist          87%     │
│ Based on your assessment        │
├─────────────────────────────────┤
│ Your Skills:                    │
│ [Python] [SQL] [Statistics] +2  │
│                                 │
│ To Learn:                       │
│ [TensorFlow] [PyTorch] +1       │
├─────────────────────────────────┤
│ [Explore All Matches]           │
└─────────────────────────────────┘
```

### Step 3: View All Recommendations

1. Click "Explore All Matches" or navigate to **Career Discovery**
2. Toggle to **"Assessment Match"** tab

**Expected:**
- See list of 10 career recommendations
- Each career shows:
  - Match percentage (e.g., 87%)
  - Confidence level (high/medium/low)
  - Matched skills (green badges)
  - Missing skills (amber badges)
  - Time to ready estimate
  - "View Skill Gap" button

### Step 4: Check Browser Console

Open DevTools (F12) and check console for:
```
[Frontend] CSV recommendations generated successfully
```

---

## 🔍 Verification Checklist

### Backend Verification

1. **CSV Dataset Loaded**
   ```bash
   curl http://localhost:5000/api/csv-careers/dataset/stats
   ```
   Expected: JSON with `totalRecords`, `totalCareers`, `totalSkills`

2. **Generate Recommendations** (requires authentication)
   ```bash
   curl -X POST http://localhost:5000/api/csv-careers/recommend \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```
   Expected: JSON with recommendations array

3. **Get Top Recommendation** (requires authentication)
   ```bash
   curl http://localhost:5000/api/csv-careers/top-recommendation \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: JSON with top career match

### Frontend Verification

1. **Service Imported Correctly**
   - Open `frontend/src/pages/career-discovery.tsx`
   - Verify import: `import { csvCareerService } from "@/services/csvCareerService";`

2. **Dashboard Shows Recommendations**
   - Open dashboard
   - Look for "Top Career Match" card
   - If not showing, user needs to complete assessment first

3. **Toggle Works**
   - Go to Career Discovery
   - Click "Assessment Match" / "AI Match" toggle
   - Should see different data sources

---

## 🐛 Common Issues & Fixes

### Issue 1: "CSV Dataset not found"

**Symptom:**
```
[CSV Dataset] ❌ Failed to load: ENOENT: no such file or directory
```

**Fix:**
```bash
cd backend
# Check file exists
dir datasets

# If missing, create directory
mkdir datasets

# Download or copy CSV file to:
# backend/datasets/AI-based Career Recommendation System.csv
```

### Issue 2: "Prisma Client not generated"

**Symptom:**
```
Cannot find module '@prisma/client'
```

**Fix:**
```bash
cd backend
npx prisma generate
```

### Issue 3: "No recommendations showing"

**Symptom:**
- Dashboard doesn't show "Top Career Match" card
- Career Discovery shows empty list

**Fix:**
1. Ensure user completed assessment
2. Check backend console for errors
3. Manually trigger recommendations:
   ```bash
   curl -X POST http://localhost:5000/api/csv-careers/recommend \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Issue 4: "CORS Error"

**Symptom:**
```
Access to fetch at 'http://localhost:5000/api/csv-careers/recommend' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Fix:**
- Backend should allow `http://localhost:5173` in CORS config
- Check `backend/src/security/index.ts` for CORS settings
- Verify `config.allowedOrigins` includes frontend URL

### Issue 5: "401 Unauthorized"

**Symptom:**
```
POST /api/csv-careers/recommend 401 Unauthorized
```

**Fix:**
- User needs to be logged in
- Check authentication token is being sent
- Verify token in browser DevTools → Application → Local Storage

---

## 📊 Testing Different User Scenarios

### Scenario 1: New User (No Assessment)
- Dashboard: No "Top Career Match" card
- Career Discovery: Empty state with "Complete Assessment" button
- Click button → redirects to assessment

### Scenario 2: User Completed Assessment
- Dashboard: Shows "Top Career Match" card
- Career Discovery: Shows 10 recommendations with skills
- Toggle between "Assessment Match" and "AI Match"

### Scenario 3: User with High Match Score (>80%)
- Confidence badge: "high confidence"
- More matched skills than missing skills
- Time to ready: "3-6 months"

### Scenario 4: User with Low Match Score (<50%)
- Confidence badge: "low confidence"
- More missing skills than matched skills
- Time to ready: "12-18 months"

---

## 🧪 Manual API Testing (Postman/Thunder Client)

### 1. Login and Get Token

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

Copy the `accessToken` from response.

### 2. Generate Recommendations

```http
POST http://localhost:5000/api/csv-careers/recommend
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "limit": 10,
  "includeSkillGaps": true
}
```

### 3. Get All Recommendations

```http
GET http://localhost:5000/api/csv-careers/recommendations?limit=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 4. Get Top Recommendation

```http
GET http://localhost:5000/api/csv-careers/top-recommendation
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 5. Get Performance Score

```http
GET http://localhost:5000/api/csv-careers/performance
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 6. Get Dataset Stats (No auth needed)

```http
GET http://localhost:5000/api/csv-careers/dataset/stats
```

---

## 📈 Expected Performance

### Backend Response Times
- CSV Dataset Load: <500ms (on startup)
- Generate Recommendations: 100-300ms
- Get Saved Recommendations: 50-150ms
- Get Top Recommendation: 20-50ms

### Frontend Load Times
- Dashboard (with recommendations): 200-400ms
- Career Discovery page: 150-300ms
- Assessment submission + recommendation generation: 500-1000ms

---

## 🎯 Success Criteria

✅ Backend server starts with "CSV Dataset loaded successfully" message
✅ Frontend can toggle between "Assessment Match" and "AI Match"
✅ After assessment completion, recommendations appear on dashboard
✅ Career Discovery shows matched/missing skills for each career
✅ Match scores and confidence levels display correctly
✅ "View Skill Gap" button appears (even if not functional yet)

---

## 🚨 Emergency Rollback

If integration causes issues, you can disable CSV recommendations:

### Backend
Comment out in `backend/src/app.ts`:
```typescript
// app.use('/api/csv-careers', csvCareerRecommendationsRoutes);
```

### Frontend
Set default toggle in `career-discovery.tsx`:
```typescript
const [showCsvRecommendations, setShowCsvRecommendations] = useState(false); // Changed to false
```

Restart both servers. Application will work with old AI recommendations only.

---

## 📞 Support

If issues persist:
1. Check backend logs for errors
2. Check browser console for errors
3. Verify MongoDB connection
4. Ensure CSV file is in correct location
5. Regenerate Prisma client: `npx prisma generate`

---

**Integration Complete! 🎉**

You should now see CSV-based career recommendations throughout the application with detailed skill matching, confidence levels, and time estimates.
