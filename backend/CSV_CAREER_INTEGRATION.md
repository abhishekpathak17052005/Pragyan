# CSV Career Dataset Integration

## Overview

The CSV Career Dataset Integration enhances Pragyan's Assessment Engine with data-driven career recommendations using a dataset of 200+ career examples with skills, interests, and recommendation scores.

## Architecture

### Core Components

1. **CSV Dataset Service** (`csv-career-dataset.ts`)
   - Loads and indexes the AI-based Career Recommendation System dataset
   - Provides efficient skill/interest-based career matching
   - 200 records, 40+ unique career titles

2. **Assessment Career Matcher** (`assessment-career-matcher.ts`)
   - Comprehensive skill-matching algorithm
   - Weighted scoring across 6 dimensions:
     - Skills (30%)
     - Interests (20%)
     - Education (10%)
     - Experience (5%)
     - Performance (25%)
     - Readiness (10%)

3. **Performance Scoring Service** (`performance-scoring.ts`)
   - Calculates user performance from assessment data
   - Phase-specific scores (Phases 1-5)
   - Technical proficiency metrics
   - Overall performance score (0-100)

4. **Hybrid Career Matching** (Enhanced `career-matching.ts`)
   - Combines CSV dataset with MongoDB career collection
   - Multiple merge strategies: union, intersection, priority-based
   - Automatic fallback to MongoDB if CSV unavailable

## Database Schema

### New Models

1. **CSVCareerMatch**
   - Stores detailed career match results from CSV dataset
   - Component scores, skill gaps, learning paths
   - Unique constraint: userId + careerTitle

2. **CareerRecommendationSnapshot**
   - Historical snapshots of recommendations
   - Tracks recommendation evolution over time
   - Stores complete user profile at time of recommendation

3. **SkillGapAnalysis**
   - Detailed skill gap tracking
   - Priority ranking of missing skills
   - Learning recommendations and progress tracking

4. **CareerPerformanceScore**
   - User's assessment performance metrics
   - Phase-specific scores
   - Technical proficiency indicators
   - Unique constraint: userId (one per user)

## API Endpoints

### CSV Career Recommendations (`/api/csv-careers`)

#### Generate Recommendations
```
POST /api/csv-careers/recommend
Body: {
  topN?: number,
  includeMongoDBCareers?: boolean,
  customWeights?: { skills, interests, education, experience, performance, readiness },
  saveResults?: boolean
}
```

#### Get Saved Recommendations
```
GET /api/csv-careers/recommendations?limit=10&confidenceLevel=high&minScore=70
```

#### Get Top Recommendation
```
GET /api/csv-careers/top-recommendation
```

#### Get Recommendation Details
```
GET /api/csv-careers/recommendation/:careerTitle
```

#### Get Performance Metrics
```
GET /api/csv-careers/performance
```

#### Refresh Performance Score
```
POST /api/csv-careers/performance/refresh
```

#### Get Recommendation History
```
GET /api/csv-careers/history?limit=10
```

#### Get Dataset Statistics
```
GET /api/csv-careers/dataset/stats
```

#### Search Careers
```
POST /api/csv-careers/search
Body: { skills: string[], interests: string[], limit?: number }
```

### Enhanced Career Matching (`/api/career-matching`)

#### Analyze Assessment (Hybrid)
```
POST /api/career-matching/analyze
Body: {
  skills: string[],
  interests: string[],
  education?: string,
  experience?: string,
  useHybridMatching?: boolean,
  hybridOptions?: {
    useCSVDataset?: boolean,
    useMongoDBCareers?: boolean,
    includePerformanceScore?: boolean,
    mergeStrategy?: 'union' | 'intersection' | 'csv-priority' | 'mongodb-priority',
    topN?: number
  }
}
```

#### Get Hybrid Statistics
```
GET /api/career-matching/hybrid/statistics
```

## Usage Examples

### 1. Generate CSV-Based Recommendations

```typescript
// After user completes assessment
const response = await fetch('/api/csv-careers/recommend', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topN: 10,
    includeMongoDBCareers: true,
    saveResults: true
  })
});

const { recommendations, performanceMetrics, metadata } = await response.json();
```

### 2. Use Hybrid Matching in Assessment Flow

```typescript
// Existing career matching endpoint enhanced
const response = await fetch('/api/career-matching/analyze', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    skills: ['Python', 'Machine Learning', 'Data Analysis'],
    interests: ['Technology', 'Data Science'],
    education: 'Bachelor\'s',
    experience: '1-2 years',
    useHybridMatching: true,
    hybridOptions: {
      useCSVDataset: true,
      useMongoDBCareers: true,
      mergeStrategy: 'union',
      includePerformanceScore: true
    }
  })
});
```

### 3. Get Performance Score

```typescript
const response = await fetch('/api/csv-careers/performance', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { performance, peerComparison } = await response.json();
// performance.overallPerformanceScore: 0-100
// peerComparison.percentile: User's ranking
```

## Merge Strategies

### Union (Default)
- Combines all recommendations from both sources
- Deduplicates by career title
- Best for maximum coverage

### Intersection
- Only careers appearing in both sources
- Boosts match score by 20% for dual appearance
- Best for high-confidence recommendations

### CSV Priority
- CSV recommendations first
- MongoDB fills gaps
- Best when prioritizing dataset accuracy

### MongoDB Priority
- MongoDB recommendations first
- CSV fills gaps
- Best when prioritizing existing system

## Performance Scoring

### Calculation Components

1. **Technical Assessment Score** (40%)
   - Based on Phase 4 correctness

2. **Correctness Ratio** (20%)
   - Overall correct answers across all phases

3. **Assessment Confidence** (15%)
   - Based on phases completed and answer count

4. **Phase Completion** (15%)
   - Average of all phase scores

5. **Technical Level Bonus** (5%)
   - Advanced: +5, Intermediate: +3, Beginner: +1

6. **Coding Comfort Bonus** (3%)
   - Strong: +3, Moderate: +2, Basic: +1

7. **Problem Solving Bonus** (2%)
   - High: +2, Medium: +1

### Performance Metrics

- **Overall Score**: 0-100
- **Technical Level**: beginner | intermediate | advanced
- **Coding Comfort**: none | basic | moderate | strong
- **Problem Solving**: low | medium | high
- **Phase Scores**: Individual scores for Phases 1-5

## Data Flow

```
User Completes Assessment
         ↓
Performance Scoring Service
  - Calculate phase scores
  - Determine technical level
  - Compute overall performance (0-100)
         ↓
Assessment Career Matcher
  - Build user profile
  - Enhance with performance data
  - Match against CSV dataset
  - Match against MongoDB careers
         ↓
Hybrid Career Matching Engine
  - Merge results based on strategy
  - Apply scoring weights
  - Rank by overall score
         ↓
Save to Database
  - CSVCareerMatch records
  - CareerRecommendationSnapshot
  - CareerPerformanceScore
         ↓
Return Top N Recommendations
  - Career titles
  - Match scores
  - Skill gaps
  - Learning paths
  - Next steps
```

## Configuration

### Custom Scoring Weights

```typescript
const customWeights = {
  skills: 0.35,        // Increase skill importance
  interests: 0.15,     // Decrease interest importance
  education: 0.10,
  experience: 0.05,
  performance: 0.30,   // Increase performance importance
  readiness: 0.05
};
```

### Hybrid Options

```typescript
const hybridOptions = {
  useCSVDataset: true,
  useMongoDBCareers: true,
  includePerformanceScore: true,
  mergeStrategy: 'union',
  topN: 15
};
```

## Benefits

1. **Data-Driven Recommendations**
   - Based on 200 real career examples
   - Skills and interests from actual professionals

2. **Performance-Based Matching**
   - Considers user's assessment performance
   - Adapts recommendations to skill level

3. **Comprehensive Scoring**
   - 6-dimension weighted algorithm
   - Accounts for technical proficiency

4. **Skill Gap Analysis**
   - Identifies missing skills
   - Provides learning paths
   - Estimates time to career-ready

5. **Flexible Integration**
   - Works alongside existing MongoDB careers
   - Multiple merge strategies
   - Automatic fallback

## Monitoring

### Check Dataset Status
```
GET /api/csv-careers/dataset/stats
```

### Check Hybrid Integration
```
GET /api/career-matching/hybrid/statistics
```

### Monitor Performance Scores
```sql
-- Average user performance
SELECT AVG(overallPerformanceScore) FROM CareerPerformanceScore;

-- Performance distribution
SELECT 
  CASE 
    WHEN overallPerformanceScore >= 80 THEN 'High'
    WHEN overallPerformanceScore >= 60 THEN 'Medium'
    ELSE 'Low'
  END as performance_tier,
  COUNT(*) as user_count
FROM CareerPerformanceScore
GROUP BY performance_tier;
```

## Troubleshooting

### CSV Dataset Not Loading
- Check file exists: `backend/datasets/AI-based Career Recommendation System.csv`
- Check file permissions
- Check server logs for parsing errors
- Verify csv-parse package installed

### Performance Score Not Calculated
- Ensure user has assessment data
- Check UserAssessmentAnswer records exist
- Verify assessment phases completed
- Run manual refresh: `POST /api/csv-careers/performance/refresh`

### Hybrid Matching Not Working
- Check CSV dataset loaded: `GET /api/csv-careers/dataset/stats`
- Verify MongoDB careers exist
- Check merge strategy configuration
- Review server logs for errors

## Future Enhancements

1. **Real-time Updates**
   - WebSocket for live recommendation updates
   - Progressive recommendation refinement

2. **ML Model Integration**
   - Train model on user outcomes
   - Personalized scoring weights

3. **Advanced Skill Gap Analysis**
   - AI-generated learning paths
   - Resource recommendations
   - Project suggestions

4. **Career Progression Tracking**
   - Track skill acquisition over time
   - Update recommendations as user grows
   - Career milestone tracking

## Testing

Run integration tests:
```bash
npm test -- csv-career-matching
```

Test endpoints manually:
```bash
# Generate recommendations
curl -X POST http://localhost:3000/api/csv-careers/recommend \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topN": 10, "saveResults": true}'

# Get performance
curl http://localhost:3000/api/csv-careers/performance \
  -H "Authorization: Bearer $TOKEN"

# Check dataset stats
curl http://localhost:3000/api/csv-careers/dataset/stats
```

## Deployment Checklist

- [ ] CSV dataset file in place
- [ ] Prisma schema migrated
- [ ] csv-parse package installed
- [ ] Environment variables configured
- [ ] MongoDB connection tested
- [ ] API endpoints tested
- [ ] Frontend integration tested
- [ ] Performance monitoring enabled
- [ ] Error logging configured
- [ ] Backup strategy in place
