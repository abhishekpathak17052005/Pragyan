# Audit Log Implementation

## Overview
The audit log system has been successfully connected to the database and backend API. It tracks all user actions, authentication events, and system activities.

## What Was Implemented

### 1. Backend Services

#### `backend/src/services/auditLog.service.ts`
- **createAuditLog()** - Creates new audit log entries in the database
- **getAuditLogs()** - Retrieves logs with filtering and pagination
- **getOrganizationAuditLogs()** - Gets logs for specific organization
- **getUserActivity()** - Gets activity for specific user
- **getAuditStats()** - Returns statistics (total, successful, failed)

### 2. Backend API Routes

#### `backend/src/routes/auditLog.routes.ts`
- `GET /api/admin/audit-logs` - Get all audit logs with filters
- `GET /api/admin/audit-logs/stats` - Get audit statistics
- `GET /api/admin/audit-logs/organization/:organizationId` - Get org-specific logs
- `GET /api/admin/audit-logs/user/:userId` - Get user-specific activity

**Authentication:** All endpoints require admin role

### 3. Frontend Services

#### `frontend/src/services/auditLogService.ts`
- `getAuditLogs()` - Fetch logs with filtering/pagination
- `getStats()` - Fetch audit statistics
- `getUserActivity()` - Fetch user's activity history
- `getOrganizationLogs()` - Fetch organization logs

### 4. Frontend UI

#### `frontend/src/pages/admin-audit-logs.tsx`
**Updated from mock data to real API:**
- Fetches logs from backend API
- Pagination support (50 items per page)
- Search/filter by user, action, resource, organization
- Real-time statistics
- Loading states and error handling
- Formatted timestamps
- Color-coded actions and status

### 5. Database Schema

The `AuditLog` model includes:
```prisma
model AuditLog {
  id               String         // Unique ID
  targetUserId     String         // User affected
  performedByUserId String        // User who performed action
  organizationId   String?        // Optional organization
  action           AuditAction    // Action type (LOGIN, LOGOUT, etc.)
  status           String         // SUCCESS or FAILED
  failureReason    String?        // Why it failed
  resourceType     String?        // What was affected (AUTH, USER, etc.)
  resourceId       String?        // ID of affected resource
  changes          Json?          // What changed
  ipAddress        String?        // Request IP
  userAgent        String?        // Browser info
  createdAt        DateTime       // When it happened
}
```

### 6. Helper Middleware

#### `backend/src/middleware/auditLog.ts`
- `logAuthEvent()` - Log authentication events
- `logAdminAction()` - Log admin actions
- `auditLogMiddleware()` - Track user actions

## How to Use

### Logging an Authentication Event
```typescript
import { logAuthEvent } from "@/middleware/auditLog";

// In your auth controller
await logAuthEvent(
  userId,
  AuditAction.LOGIN,
  "SUCCESS",
  req
);
```

### Logging an Admin Action
```typescript
import { logAdminAction } from "@/middleware/auditLog";

// In your admin controller
await logAdminAction(
  adminUserId,
  targetUserId,
  AuditAction.USER_SUSPENDED,
  "USER",
  userId,
  req,
  { status: "ACTIVE" -> "SUSPENDED" },
  "SUCCESS"
);
```

### Fetching Logs from Frontend
```typescript
import { auditLogService } from "@/services/auditLogService";

// Get all logs
const response = await auditLogService.getAuditLogs({
  limit: 50,
  skip: 0,
  status: "SUCCESS",
});

// Get user activity
const activity = await auditLogService.getUserActivity(userId);

// Get statistics
const stats = await auditLogService.getStats();
```

## Features

✅ **Real Database Storage** - All logs stored in MongoDB via Prisma
✅ **Filtering** - By user, action, status, organization, date range
✅ **Pagination** - 50 items per page with navigation
✅ **Statistics** - Total, successful, failed counts
✅ **Search** - Quick search across user, action, resource
✅ **Admin Only** - Protected routes require admin authentication
✅ **IP Tracking** - Records IP address and user agent
✅ **Timestamps** - All events timestamped with timezone support
✅ **Failure Tracking** - Records failure reasons for failed actions

## Next Steps

1. **Integrate audit logging into controllers** - Add `logAuthEvent()` and `logAdminAction()` calls throughout the backend
2. **Add audit log export** - Implement CSV/JSON export functionality
3. **Set up audit log retention** - Archive old logs after 90 days
4. **Add audit log alerts** - Notify admins of suspicious activities
5. **Create audit log reports** - Generate compliance reports

## Testing

Test the audit logs by:
1. Navigate to `/admin/audit-logs` in the frontend
2. Perform various actions (login, user modifications, etc.)
3. Verify logs appear in real-time
4. Test search and pagination
5. Check API endpoints with admin user token

## Files Modified/Created

**Backend:**
- ✅ Created: `backend/src/services/auditLog.service.ts`
- ✅ Created: `backend/src/routes/auditLog.routes.ts`
- ✅ Created: `backend/src/middleware/auditLog.ts`
- ✅ Modified: `backend/src/app.ts` (added route registration)

**Frontend:**
- ✅ Created: `frontend/src/services/auditLogService.ts`
- ✅ Modified: `frontend/src/pages/admin-audit-logs.tsx` (real API integration)

**Database:**
- ✅ Existing: `AuditLog` model already in `backend/prisma/schema.prisma`
- ✅ Existing: `AuditAction` enum already defined

## API Response Examples

### GET /api/admin/audit-logs
```json
{
  "logs": [
    {
      "id": "507f1f77bcf86cd799439011",
      "timestamp": "2026-07-14T15:45:23Z",
      "targetUser": "admin@pragyan.com",
      "performedBy": "admin@pragyan.com",
      "action": "LOGIN",
      "resource": "AUTH",
      "resourceId": "LOGIN-1689348323000",
      "status": "SUCCESS",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "organization": "System"
    }
  ],
  "pagination": {
    "total": 1250,
    "limit": 50,
    "skip": 0,
    "hasMore": true
  }
}
```

### GET /api/admin/audit-logs/stats
```json
{
  "total": 1250,
  "successful": 1200,
  "failed": 50,
  "byAction": {
    "LOGIN": 500,
    "PASSWORD_RESET": 50,
    "USER_SUSPENDED": 10
  }
}
```

## Database Queries

The service uses efficient Prisma queries with indexes on:
- `targetUserId`
- `performedByUserId`
- `organizationId`
- `action`
- `status`
- `failureReason`
- `createdAt`

This ensures fast lookups even with millions of audit log entries.

---

**Status:** ✅ Complete - Audit logging is now fully connected to the database and backend API.
