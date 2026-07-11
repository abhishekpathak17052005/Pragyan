# Quick Test Roadmap - 5 Minutes

Follow these steps to create a minimal roadmap that will show on the student `/roadmap` page.

---

## Step 1: Go to Admin Panel
```
http://localhost:5173/admin/roadmaps
```

---

## Step 2: Create or Select Career
If you already have "Full Stack Web Developer", select it. Otherwise:
1. Click **"New Career"**
2. Fill in:
   - Title: `Test Career`
   - Description: `A quick test learning path`
3. Click **"Create"**

---

## Step 3: Add Module
1. Click **"Add Module"** button
2. Fill in:
   - Title: `Module 1`
   - Description: `First module`
3. Click **"Add"**

---

## Step 4: Expand Module & Add Week
1. Click the **chevron** (▼) next to "Module 1" to expand it
2. Click **"+ Add Week"**
3. Fill in:
   - Title: `Week 1`
4. Click **"Add"**

---

## Step 5: Expand Week & Add Day
1. Click the **chevron** next to "Week 1" to expand it
2. Click **"+ Add Day"**
3. Fill in:
   - Title: `Day 1`
4. Click **"Add"**

---

## Step 6: Expand Day & Add Topic
1. Click the **chevron** next to "Day 1" to expand it
2. Click **"+ Topic"**
3. Fill in:
   - Title: `Introduction`
4. Click **"Add"**

---

## Step 7: Expand Topic & Add Resource
1. Click the **chevron** next to "Introduction" to expand it
2. Click **"+ Resource"**
3. Fill in:
   - **Title:** `MDN Web Docs` (required)
   - **URL:** `https://developer.mozilla.org` (required)
   - **Provider:** `MDN`
   - **Type:** `DOCUMENTATION`
   - Keep defaults for other fields
4. Click **"Add"**

---

## Step 8: Publish Career
1. Click **"Publish"** button (blue button at top right)
2. Button should now show **"Published"** with a checkmark

---

## Step 9: Test Student View
1. Go to: `http://localhost:5173/roadmap`
2. **Expected result:** You should NOW see your test career!
3. Click to expand modules/weeks/days/topics
4. Click "Open" on the resource to visit the URL

---

## Final Hierarchy (What You Just Created)

```
Test Career [Published]
└── Module 1
    └── Week 1
        └── Day 1
            └── Introduction (Topic)
                └── MDN Web Docs (Resource)
                   URL: https://developer.mozilla.org
```

---

## Troubleshooting

**If roadmap still doesn't show:**
- ✅ Make sure you clicked "Publish" and it says "Published"
- ✅ Make sure you added ALL levels (Module → Week → Day → Topic → Resource)
- ✅ Hard refresh the student page (Ctrl+Shift+R)
- ✅ Check browser DevTools Console for errors

**If you get an error:**
- Check the browser console (F12) for error messages
- Check backend logs for API errors

---

## Once Testing Works

You can now:
1. ✅ Create more detailed roadmaps
2. ✅ Add multiple modules/weeks/days/topics/resources
3. ✅ Edit any content (click pencil icon)
4. ✅ Delete content (click trash icon)
5. ✅ Create student accounts and test learning paths

