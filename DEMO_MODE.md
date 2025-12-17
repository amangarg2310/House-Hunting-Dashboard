# 🎭 Demo Mode - Ready to Test!

Your house hunting dashboard is now running in **DEMO MODE** with mock data!

## ✅ What's Running

- **Dev Server**: [http://localhost:5174](http://localhost:5174)
- **Mode**: Demo (using 12 sample Atlanta properties)
- **Data Storage**: localStorage (grades persist in your browser)

## 🎮 Try It Out

### 1. Open the App

Click here: [http://localhost:5174](http://localhost:5174)

### 2. Explore the Features

**New Today Tab:**
- See 4 "new" properties (listed in last 24 hours)
- Progress bar shows grading completion
- Ungraded properties at top, graded below (dimmed)

**Grade Properties:**
- Click grade buttons (A, B, C, D, F) on any property
- Or use keyboard shortcuts: `1` = A, `2` = B, `3` = C, `4` = D, `5` = F
- Grades save automatically to localStorage
- Refresh page → grades persist!

**My Grades Tab:**
- See Kanban-style columns (A, B, C, D, F)
- Properties organized by grade
- Drag-free design (click to change grade)
- Export to CSV button

**All Properties Tab:**
- Full archive of all 12 properties
- Search by address/county
- Filter graded/ungraded

**Filters (Left Sidebar):**
- Property type: ranch, condo, townhouse
- Single floor toggle (default ON)
- Backyard required
- Pool preference
- Price range slider
- Counties: Fulton, Cobb, DeKalb, etc.
- Contract status

**Stats Header:**
- Total, new, graded counts
- Buy/Rent/Both toggle
- Single floor toggle

### 3. Test the Grading System

1. Go to "New Today"
2. Click a property card
3. Assign grade A (or press `1`)
4. Watch progress bar update
5. Switch to "My Grades"
6. See property in column A
7. **Refresh page** → grade still there!

### 4. Test Filters

1. Check "Fulton" county → see only Fulton properties
2. Move price slider → see prices update
3. Check "Backyard: Yes" → see only properties with yards
4. Toggle "Single Floor Only" off → see multi-story properties too

## 🎯 What's Working

✅ All 12 mock properties display
✅ A-F grading with buttons
✅ Keyboard shortcuts (1-5)
✅ Grade persistence (localStorage)
✅ Three view modes
✅ All filters working
✅ Progress tracking
✅ Value score badges
✅ Image carousels
✅ Responsive design

## 📊 Sample Data

The demo includes:
- **12 properties** total
- **4 "new" properties** (last 24 hours)
- **3 pre-graded** (A, B, C)
- **8 single-floor** properties (your target!)
- **4 multi-story** (filter these out)
- Mix of: ranch, condo, townhouse, single-family
- Counties: Fulton, Cobb, Cherokee, Forsyth, DeKalb, Gwinnett
- Price range: $699K - $1.5M

## 🔄 Switch to Production Mode

When you're ready to use real data:

1. **Create Supabase account** (see SETUP.md)
2. **Get RapidAPI key** (see SETUP.md)
3. **Update `.env` file** with real credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_real_key_here
   VITE_RAPIDAPI_KEY=your_real_key_here
   ```
4. **Restart dev server**: `npm run dev`
5. App will auto-detect and switch to production mode!

## 🛑 Stop the Server

When you're done testing:

```bash
# Press Ctrl+C in the terminal
```

Or just close the terminal window.

## 🐛 Any Issues?

Check browser console (F12) for messages. You should see:

```
🎭 Running in DEMO MODE - using mock data
💡 To use real data, update your .env file with Supabase credentials
```

## 💡 Demo Mode vs Production Mode

| Feature | Demo Mode | Production Mode |
|---------|-----------|----------------|
| Data Source | 12 mock properties | Real Atlanta listings from API |
| Data Storage | localStorage | Supabase database |
| New Listings | Static (same 4 every time) | Daily updates at 7 AM |
| Grades | localStorage only | Synced across devices |
| Multi-user | No (local only) | Yes (when deployed) |
| Cost | Free | Free (with free tiers) |

---

**Enjoy testing your house hunting dashboard! 🏡**

Next steps: Follow [LOCAL_TESTING.md](LOCAL_TESTING.md) to set up real data when ready.
