# Local Testing Guide

## Quick Test with Mock Data (No Setup Required)

If you want to test the UI/UX immediately without setting up Supabase/RapidAPI, follow these steps:

### Option 1: Test with Mock Data (5 minutes)

1. **Create a simple `.env` file with dummy values:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with placeholder values (just to prevent errors):**
   ```env
   VITE_SUPABASE_URL=https://placeholder.supabase.co
   VITE_SUPABASE_ANON_KEY=placeholder_key
   VITE_RAPIDAPI_KEY=placeholder_key
   VITE_RAPIDAPI_HOST=realty-in-us.p.rapidapi.com
   ```

3. **Temporarily use mock data:**

   We can modify the app to use mock data for testing. Let me know if you want me to create a "demo mode" that bypasses the API calls.

---

## Option 2: Full Test with Real Data (30 minutes)

This is the recommended approach if you want to test the complete workflow.

### Step 1: Create Supabase Project (10 min)

1. **Sign up at [supabase.com](https://supabase.com)**
   - Click "Start your project" (free)
   - Create new organization

2. **Create new project:**
   - Project name: `house-hunting-dashboard`
   - Database password: Generate strong password (save it!)
   - Region: **US East (Ohio)** - closest to Atlanta
   - Click "Create new project"
   - **Wait 2-3 minutes** for initialization

3. **Get your credentials:**
   - Go to **Settings** → **API**
   - Copy **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - Copy **anon public key** (starts with `eyJ...`)

### Step 2: Set Up Database Tables (5 min)

1. **In Supabase dashboard:**
   - Go to **SQL Editor** (left sidebar)
   - Click **New Query**

2. **Run the schema:**
   - Open `supabase/schema.sql` in your code editor
   - Copy the entire SQL content
   - Paste into Supabase SQL Editor
   - Click **Run** (green play button)

3. **Verify tables created:**
   - Go to **Table Editor** (left sidebar)
   - You should see 2 tables: `listings` and `grades`

### Step 3: Get RapidAPI Key (10 min)

1. **Sign up at [rapidapi.com](https://rapidapi.com)**
   - Create free account

2. **Subscribe to Realty in US API:**
   - Search for "**Realty in US**" in the search bar
   - Click on the API result
   - Click "**Subscribe to Test**" button
   - Choose **BASIC plan** (Free - 500 requests/month)
   - Click "Subscribe"

3. **Get your API key:**
   - Go to "**Endpoints**" tab
   - On the right side, you'll see sample code
   - Copy the value of **X-RapidAPI-Key** header

### Step 4: Configure Environment Variables (2 min)

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your real credentials:**
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxxx...YOUR_ANON_KEY
   VITE_RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY
   VITE_RAPIDAPI_HOST=realty-in-us.p.rapidapi.com
   ```

### Step 5: Install Dependencies (1 min)

```bash
npm install
```

### Step 6: Fetch Initial Data (2 min)

```bash
npm run fetch-listings
```

**Expected output:**
```
🏠 House Hunting Dashboard - Daily Listing Fetch
================================================
Started at: 12/15/2025, 10:20:30 PM

🔍 Fetching properties from Realty in US API...
✅ Fetched 50 properties from API
✅ 12 single-floor properties after filtering
💾 Saving 12 listings to Supabase...
✅ Successfully saved 12 listings

🧹 Cleaning up old listings...
✅ Deleted 0 old listings

✅ Fetch complete!
   - New listings saved: 12
   - Old listings deleted: 0
   - Completed at: 12/15/2025, 10:20:45 PM
```

**If you see errors:**
- Check your `.env` file has correct values
- Verify Supabase tables were created
- Check RapidAPI subscription is active

### Step 7: Start Development Server (1 min)

```bash
npm run dev
```

**Expected output:**
```
  VITE v5.2.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 8: Test in Browser

1. **Open [http://localhost:5173](http://localhost:5173)**

2. **You should see:**
   - ✅ Properties loading (spinning indicator briefly)
   - ✅ Filter sidebar on the left
   - ✅ "New Today" tab showing properties
   - ✅ Stats header showing counts
   - ✅ Property cards with details

3. **Test the features:**
   - Click on property cards to see details
   - Click grade buttons (A, B, C, D, F) to assign grades
   - Try keyboard shortcuts: Click a property, then press 1-5
   - Switch to "My Grades" tab - see properties organized by grade
   - Switch to "All Properties" tab - see all listings
   - Try filters: counties, price range, backyard, pool
   - Toggle "Single Floor Only" button

---

## Testing Checklist

### ✅ Basic Functionality
- [ ] App loads without errors
- [ ] Properties display in "New Today" tab
- [ ] Can assign grades (A-F) via buttons
- [ ] Keyboard shortcuts work (1-5 for A-F)
- [ ] Grades persist after page refresh
- [ ] "My Grades" view shows properties in columns
- [ ] "All Properties" view shows full list
- [ ] Search works in "All Properties"

### ✅ Filters
- [ ] Property type filter (ranch, condo, townhouse)
- [ ] Single floor toggle works
- [ ] Price range slider updates results
- [ ] County checkboxes filter properties
- [ ] Backyard filter works
- [ ] Pool filter works
- [ ] Contract status filter works

### ✅ Data Persistence
- [ ] Assign a grade → refresh page → grade still there
- [ ] Open in new tab → grades still there
- [ ] Change grade → new grade persists

### ✅ UI/UX
- [ ] Loading spinner shows on initial load
- [ ] Progress bar in "New Today" updates when grading
- [ ] Value badges show on property cards
- [ ] Image carousel works (if properties have multiple photos)
- [ ] Responsive design (resize browser window)

---

## Common Issues & Solutions

### ❌ "Missing Supabase environment variables"
**Fix:**
- Ensure `.env` file exists in project root
- Check all 4 variables are set (no typos)
- Restart dev server: `Ctrl+C` then `npm run dev`

### ❌ "Failed to fetch listings"
**Fix:**
- Check Supabase credentials are correct
- Verify tables exist in Supabase Table Editor
- Check browser console for specific error

### ❌ "No properties showing"
**Fix:**
- Run `npm run fetch-listings` to import data first
- Check Supabase Table Editor → `listings` table has rows
- Check console for errors

### ❌ RapidAPI returns 403 or 429 error
**Fix:**
- 403: Check your API key is correct
- 429: You've exceeded free tier quota (500/month)
- Verify subscription is active at rapidapi.com

### ❌ Build/TypeScript errors
**Fix:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# If still errors, check Node version
node --version  # Should be 18+
```

---

## Next Steps After Testing

Once everything works locally:

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Test successful - ready for deployment"
   ```

2. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/house-hunting-dashboard.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy to Vercel** (see NEXT_STEPS.md)

---

## Demo Mode (For Quick UI Testing)

If you just want to test the UI without setting up Supabase/RapidAPI, let me know and I can create a demo mode that uses the original mock data temporarily.

---

## Questions?

- Check **SETUP.md** for detailed setup instructions
- Check **README.md** for full documentation
- Check browser console (F12) for error messages
