# House Hunting Dashboard

A personalized real estate dashboard for finding single-floor living properties (ranch, condo, or townhouse with elevator) in the Atlanta area. Replace your Excel spreadsheet with an intelligent grading system that helps you quickly evaluate and organize properties.

![Screenshot](https://img.shields.io/badge/React-18.3.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-blue) ![Supabase](https://img.shields.io/badge/Supabase-Latest-green)

## ✨ Features

### 🏡 Smart Property Grading
- **A-F grading system** - Quickly classify properties based on your criteria
- **Keyboard shortcuts** (1-5) for rapid grading
- **Automatic value scoring** - 6 weighted criteria:
  - Single floor: 40% (your priority!)
  - Price per sq ft: 25%
  - Backyard: 15%
  - Walk score: 10%
  - School rating: 5%
  - Pool: 5%

### 📊 Three View Modes
1. **New Today** - Review listings added in last 24 hours with progress tracking
2. **My Grades** - Kanban-style organization by grade (A-F columns)
3. **All Properties** - Searchable archive of all listings

### 🔍 Advanced Filtering
- Property type (ranch, condo, townhouse)
- Single-floor only toggle (default ON)
- Backyard required
- Pool preference
- Price range
- Atlanta counties (Fulton, Cobb, DeKalb, Forsyth, Gwinnett, Cherokee)
- Contract status (available, pending)

### 💾 Persistent Storage
- Supabase backend for grade storage
- Real-time data sync
- No data loss across devices

### 🤖 Automated Daily Updates
- GitHub Actions fetch new listings every morning at 7 AM EST
- Automatic cleanup of old listings (90+ days)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Free accounts on:
  - [Supabase](https://supabase.com) (database)
  - [RapidAPI](https://rapidapi.com) (real estate data)
  - [GitHub](https://github.com) (for deployment automation)
  - [Vercel](https://vercel.com) (hosting)

### 1. Clone and Install

```bash
cd house-hunting-dashboard
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Get your credentials from **Settings** > **API**

### 3. Get RapidAPI Key

1. Sign up at [RapidAPI.com](https://rapidapi.com)
2. Subscribe to **"Realty in US"** API (free tier: 500 requests/month)
3. Copy your API key

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_RAPIDAPI_KEY=your_rapidapi_key_here
VITE_RAPIDAPI_HOST=realty-in-us.p.rapidapi.com
```

### 5. Fetch Initial Data

```bash
npm run fetch-listings
```

This will fetch and import ~50 single-floor properties from Atlanta.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Deployment

### Deploy to Vercel

1. Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/house-hunting-dashboard.git
git push -u origin main
```

2. Import project in [Vercel](https://vercel.com):
   - Click **Add New Project**
   - Import your GitHub repository
   - Add environment variables (same as `.env`)
   - Click **Deploy**

3. Set up GitHub Secrets for daily automation:
   - Go to your GitHub repo > **Settings** > **Secrets and variables** > **Actions**
   - Add all environment variables as secrets

## 📁 Project Structure

```
house-hunting-dashboard/
├── src/
│   ├── components/        # React UI components
│   │   ├── AllPropertiesView.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── GradedPropertiesView.tsx
│   │   ├── ListingCard.tsx
│   │   ├── NewTodayView.tsx
│   │   └── ValueBadge.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── useListings.ts
│   ├── lib/               # Core services
│   │   ├── supabase.ts    # Database client
│   │   ├── listings.ts    # Listing CRUD operations
│   │   ├── grades.ts      # Grade management
│   │   └── realEstateAPI.ts # API integration
│   ├── types/             # TypeScript definitions
│   │   └── listing.ts
│   ├── utils/             # Utilities
│   │   └── valueCalculator.ts
│   └── App.tsx            # Main application
├── scripts/
│   └── fetchListings.js   # Daily data fetch script
├── supabase/
│   └── schema.sql         # Database schema
├── .github/workflows/
│   └── daily-fetch.yml    # GitHub Actions automation
└── package.json
```

## 🎯 Usage Guide

### Daily Workflow

1. **Morning** (7 AM): GitHub Actions automatically fetches new listings
2. **Review**: Open dashboard, go to "New Today" tab
3. **Grade**: Assign A-F grades using buttons or keyboard shortcuts (1-5)
4. **Organize**: Switch to "My Grades" to see properties in A-F columns
5. **Visit**: Focus on A and B tier properties for in-person visits

### Keyboard Shortcuts

- `1` = Grade A (excellent)
- `2` = Grade B (good)
- `3` = Grade C (average)
- `4` = Grade D (below average)
- `5` = Grade F (not interested)

### Filtering Tips

- **Default**: Shows only single-floor properties - your main requirement!
- **Counties**: Select specific Atlanta counties to narrow search
- **Backyard**: Toggle if outdoor space is required
- **Price Range**: Adjust slider to your budget

## 💰 Cost Breakdown

- **Supabase**: Free (500 MB database, plenty for personal use)
- **RapidAPI** (Realty in US): Free tier (500 requests/month = ~16/day)
- **Vercel**: Free tier (100 GB bandwidth/month)
- **GitHub**: Free
- **Total**: **$0/month**

**Note**: If you exceed the free RapidAPI tier, upgrade to Pro ($25/month) or apply for Zillow Bridge API (free, 1,000 requests/day).

## 🔧 Maintenance

### Manual Data Refresh

```bash
npm run fetch-listings
```

### Clear Old Listings

Old listings (90+ days) are automatically deleted during each fetch. To manually clear:

```sql
-- Run in Supabase SQL Editor
DELETE FROM listings WHERE listed_date < NOW() - INTERVAL '90 days';
```

### Export Graded Properties

Click "Export CSV" in the "My Grades" view to download all graded properties.

## 🔮 Future Enhancements

- [ ] Email notifications for new A/B tier properties
- [ ] Property comparison side-by-side
- [ ] Map view with pins
- [ ] Visit scheduling calendar
- [ ] Property notes and photos
- [ ] Excel import for existing data
- [ ] Customizable value score weights
- [ ] Mobile app (PWA)

## 🐛 Troubleshooting

### No listings showing?

1. Run `npm run fetch-listings` to import data
2. Check Supabase dashboard > Table Editor > listings table
3. Verify API quota not exceeded (check RapidAPI dashboard)

### Environment variable errors?

1. Ensure `.env` file exists in project root
2. Verify all 4 environment variables are set
3. Restart dev server after changing `.env`

### Database connection failed?

1. Verify Supabase URL and anon key are correct
2. Check that tables were created (run `supabase/schema.sql`)
3. Ensure RLS policies are enabled

## 📄 License

MIT License - free for personal use

## 🤝 Contributing

This is a personal project, but suggestions are welcome! Open an issue or submit a pull request.

---

**Built with**:
- [React](https://react.dev) - UI framework
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Supabase](https://supabase.com) - Backend database
- [Vite](https://vitejs.dev) - Build tool
- [Realty in US API](https://rapidapi.com) - Property data

Happy house hunting! 🏡
