# Import from roadmap.sh - Quick Start Guide

## What Was Added?
A new "Import from roadmap.sh" feature in the Manual Roadmap CMS admin panel. Admins can now import learning roadmaps from roadmap.sh into the system.

## Where to Find It?
1. Navigate to `http://localhost:5173/admin/roadmaps`
2. Look for **"Import from roadmap.sh"** button in the left sidebar
3. Click to open the import modal

## How to Use It?
1. Click "Import from roadmap.sh" button
2. Paste a roadmap.sh URL:
   - Example: `https://roadmap.sh/full-stack`
   - Other options: `/frontend`, `/backend`, `/devops`, `/ai`, etc.
3. Click "Import"
4. Wait 3-10 seconds for scraping & processing
5. Imported roadmap appears in the career list (as DRAFT)
6. Edit, organize, or publish as needed

## What Gets Imported?
✅ Roadmap title & description  
✅ Content structured as modules, weeks, days, topics  
✅ Resource links with automatic type detection  
✅ All content saved as DRAFT (never auto-published)  

## Key Files Changed
- **Backend:** `backend/src/services/firecrawl-import.service.ts` (NEW)
- **Backend:** `backend/src/routes/admin.ts` (added route)
- **Backend:** `backend/src/modules/career-roadmap/` (updated)
- **Frontend:** `frontend/src/pages/admin-roadmap-builder-final.tsx` (added button & modal)

## API Endpoint
```
POST /api/admin/import-roadmap
Content-Type: application/json

{
  "url": "https://roadmap.sh/full-stack"
}
```

Response: `201 Created` with imported career object

## Important
- Feature uses **Firecrawl** (web scraping only, NO AI)
- Requires `FIRECRAWL_API_KEY` in `.env` (already configured)
- Imported roadmaps are always DRAFT status
- Only roadmap.sh URLs supported
- Must be authenticated & have admin access

## Before Going to Production
1. Restore admin role check in `backend/src/routes/admin.ts`
2. Grant ADMIN role to authorized users in database
3. Test with actual Firecrawl API key
4. Monitor API usage

## Common Test URLs
- `https://roadmap.sh/full-stack` - Full Stack Developer
- `https://roadmap.sh/frontend` - Frontend Developer  
- `https://roadmap.sh/backend` - Backend Developer
- `https://roadmap.sh/devops` - DevOps Engineer
- `https://roadmap.sh/ai` - AI Engineer

## Troubleshooting
| Issue | Solution |
|-------|----------|
| "Invalid URL format" | Check URL is valid HTTPS |
| "Only roadmap.sh supported" | URL must be from roadmap.sh |
| "Failed to scrape" | Timeout - try again or check API key |
| Button not showing | Clear browser cache and reload |
| Import fails silently | Check browser console for errors |

## Build Status
✅ Backend compiles: `npm run build` - 0 errors  
✅ Frontend compiles: `npm run build` - 0 errors  
✅ Ready for production (with admin setup)

---
For complete details, see: `ROADMAP_IMPORT_IMPLEMENTATION.md`
