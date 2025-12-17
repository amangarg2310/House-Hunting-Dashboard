import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database schema
export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string;
          address: string;
          county: string;
          url: string | null;
          estimated_price: number;
          price_per_sqft: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          square_footage: number | null;
          year_built: number | null;
          lot_size: number | null;
          walk_score: number | null;
          school_rating: number | null;
          hoa_fees: number | null;
          annual_property_tax: number | null;
          seller_broker: string | null;
          photo_url: string | null;
          photo_urls: string[] | null;
          property_type: string;
          is_single_floor: boolean;
          has_backyard: boolean;
          has_pool: boolean;
          contract_status: string;
          listing_type: string;
          monthly_rent: number | null;
          security_deposit: number | null;
          lease_terms: string | null;
          value_score: number | null;
          value_tier: string | null;
          listed_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['listings']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['listings']['Insert']>;
      };
      grades: {
        Row: {
          id: string;
          listing_id: string;
          grade: 'A' | 'B' | 'C' | 'D' | 'F';
          graded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['grades']['Row'], 'id' | 'graded_at'>;
        Update: Partial<Database['public']['Tables']['grades']['Insert']>;
      };
    };
  };
}
