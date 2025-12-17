# House Hunting Dashboard - Setup Guide

## Quick Start (One-Day Setup)

### Step 1: Create Supabase Project (15 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (free)
3. Create a new project:
   - **Organization**: Create new or use existing
   - **Project Name**: "house-hunting-dashboard"
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to Atlanta (US East)
   - Click "Create new project"

4. Wait ~2 minutes for project to initialize

5. Get your API credentials:
   - Go to **Settings** > **API**
   - Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy **anon/public key** (long string starting with `eyJ...`)

6. Create `.env` file in project root:
   ```bash
   cp .env.example .env
   ```

7. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Step 2: Create Database Tables (10 minutes)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL from `supabase/schema.sql` (see below)
4. Click **Run** to create tables

**SQL Schema** (save as `supabase/schema.sql`):

```sql
-- Create listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  county TEXT NOT NULL,
  url TEXT,
  estimated_price INTEGER NOT NULL,
  price_per_sqft DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_footage INTEGER,
  year_built INTEGER,
  lot_size DECIMAL(10,2),
  walk_score INTEGER,
  school_rating INTEGER,
  hoa_fees INTEGER,
  annual_property_tax INTEGER,
  seller_broker TEXT,
  photo_url TEXT,
  photo_urls TEXT[], -- Array of image URLs
  property_type TEXT NOT NULL,
  is_single_floor BOOLEAN DEFAULT false,
  has_backyard BOOLEAN DEFAULT false,
  has_pool BOOLEAN DEFAULT false,
  contract_status TEXT DEFAULT 'available',
  listing_type TEXT DEFAULT 'sale',
  monthly_rent INTEGER,
  security_deposit INTEGER,
  lease_terms TEXT,
  value_score INTEGER,
  value_tier TEXT,
  listed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grades table (stores user grading decisions)
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id) -- One grade per listing
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_listed_date ON public.listings(listed_date DESC);
CREATE INDEX IF NOT EXISTS idx_listings_county ON public.listings(county);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON public.listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_is_single_floor ON public.listings(is_single_floor);
CREATE INDEX IF NOT EXISTS idx_listings_contract_status ON public.listings(contract_status);
CREATE INDEX IF NOT EXISTS idx_grades_listing_id ON public.grades(listing_id);

-- Enable Row Level Security (RLS) - allow public access for personal use
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read/write (since this is personal use, no auth needed)
CREATE POLICY "Allow public read access to listings" ON public.listings
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to listings" ON public.listings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to listings" ON public.listings
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to grades" ON public.grades
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to grades" ON public.grades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to grades" ON public.grades
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to grades" ON public.grades
  FOR DELETE USING (true);
```

### Step 3: Get RapidAPI Key (10 minutes)

1. Go to [RapidAPI.com](https://rapidapi.com)
2. Click "Sign Up" (free account)
3. Search for "**Realty in US**" API
4. Click on the API, then click "**Subscribe to Test**"
5. Choose **BASIC (Free)** plan:
   - 500 requests/month
   - $0/month
   - Click "Subscribe"
6. Go to the "**Endpoints**" tab
7. Copy your **X-RapidAPI-Key** from the code snippet on the right
8. Add to your `.env` file:
   ```
   VITE_RAPIDAPI_KEY=your_rapidapi_key_here
   VITE_RAPIDAPI_HOST=realty-in-us.p.rapidapi.com
   ```

### Step 4: Run the App (5 minutes)

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open browser to `http://localhost:5173`

### Step 5: Fetch Initial Listings (Manual First Run)

Run the listing fetch script manually to populate your database:

```bash
npm run fetch-listings
```

This will:
- Call the Realty in US API for Atlanta properties
- Filter for single-floor living (ranch, condo, townhouse)
- Save to your Supabase database
- Take ~1-2 minutes

### Step 6: Deploy to Vercel (15 minutes)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - house hunting dashboard"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/house-hunting-dashboard.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "**Add New Project**"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_RAPIDAPI_KEY`
   - `VITE_RAPIDAPI_HOST`
7. Click "**Deploy**"
8. Wait 2-3 minutes for deployment

### Step 7: Set Up Daily Auto-Fetch (10 minutes)

The app includes a GitHub Actions workflow to fetch new listings daily at 7 AM EST.

1. In GitHub repository settings, go to **Settings** > **Secrets and variables** > **Actions**
2. Add the same environment variables as secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_RAPIDAPI_KEY`
   - `VITE_RAPIDAPI_HOST`
3. The workflow in `.github/workflows/daily-fetch.yml` will run automatically

---

## Troubleshooting

### Error: "Invalid API key"
- Double-check your RapidAPI key in `.env`
- Make sure you subscribed to the free plan
- Restart dev server after changing `.env`

### Error: "Supabase connection failed"
- Verify your Supabase URL and anon key
- Check that tables were created successfully
- Ensure RLS policies are enabled

### No listings showing
- Run `npm run fetch-listings` manually first
- Check Supabase dashboard > Table Editor > listings table
- Verify API quota not exceeded (check RapidAPI dashboard)

### API quota exceeded
- Free tier: 500 requests/month (~16/day)
- Upgrade to Pro plan on RapidAPI ($25/month for unlimited)
- Or apply for Zillow Bridge API (free, 1000/day)

---

## Daily Workflow

1. **Morning (7 AM)**: GitHub Actions automatically fetches new listings
2. **Review**: Open dashboard, go to "New Today" tab
3. **Grade**: Assign A-F grades using buttons or keyboard (1-5)
4. **Organize**: View "My Grades" to see A/B tier properties
5. **Visit**: Properties are stored indefinitely until you clear them

---

## Future: Zillow Bridge API (Optional)

Once approved for Zillow Bridge API:

1. Apply at [bridgedataoutput.com](https://bridgedataoutput.com)
2. Get API credentials
3. Update `.env`:
   ```
   VITE_ZILLOW_BRIDGE_API_KEY=your_key
   ```
4. Update `src/lib/realEstateAPI.ts` to use Zillow endpoint
5. Benefits: 1,000 requests/day (vs 500/month)

---

## Cost Breakdown

- **Supabase**: Free tier (500 MB storage, plenty for personal use)
- **RapidAPI** (Realty in US): Free tier (500 requests/month)
- **Vercel**: Free tier (100 GB bandwidth/month)
- **GitHub**: Free
- **Total**: **$0/month**

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all environment variables are set
3. Check Supabase logs (Dashboard > Logs)
4. Ensure API quotas not exceeded

Happy house hunting! 🏡
