import { supabase } from './supabase';
import type { Listing } from '../types/listing';

/**
 * Save or update a grade for a listing
 */
export async function saveGrade(listingId: string, grade: 'A' | 'B' | 'C' | 'D' | 'F'): Promise<void> {
  try {
    // Upsert (insert or update) the grade
    const { error } = await supabase
      .from('grades')
      .upsert(
        { listing_id: listingId, grade },
        { onConflict: 'listing_id' } // Update if listing_id already exists
      );

    if (error) {
      console.error('Error saving grade:', error);
      throw new Error(`Failed to save grade: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in saveGrade:', error);
    throw error;
  }
}

/**
 * Remove a grade for a listing
 */
export async function removeGrade(listingId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('listing_id', listingId);

    if (error) {
      console.error('Error removing grade:', error);
      throw new Error(`Failed to remove grade: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in removeGrade:', error);
    throw error;
  }
}

/**
 * Fetch all grades from database
 * Returns a map of listing_id -> grade
 */
export async function fetchAllGrades(): Promise<Map<string, 'A' | 'B' | 'C' | 'D' | 'F'>> {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('listing_id, grade');

    if (error) {
      console.error('Error fetching grades:', error);
      throw new Error(`Failed to fetch grades: ${error.message}`);
    }

    const gradesMap = new Map<string, 'A' | 'B' | 'C' | 'D' | 'F'>();

    if (data) {
      for (const row of data) {
        gradesMap.set(row.listing_id, row.grade as 'A' | 'B' | 'C' | 'D' | 'F');
      }
    }

    return gradesMap;
  } catch (error) {
    console.error('Error in fetchAllGrades:', error);
    return new Map(); // Return empty map on error
  }
}

/**
 * Fetch a single grade for a listing
 */
export async function fetchGrade(listingId: string): Promise<'A' | 'B' | 'C' | 'D' | 'F' | null> {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('grade')
      .eq('listing_id', listingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found
        return null;
      }
      console.error('Error fetching grade:', error);
      return null;
    }

    return data?.grade as 'A' | 'B' | 'C' | 'D' | 'F' || null;
  } catch (error) {
    console.error('Error in fetchGrade:', error);
    return null;
  }
}

/**
 * Get count of graded listings by grade
 */
export async function getGradeCounts(): Promise<Record<'A' | 'B' | 'C' | 'D' | 'F', number>> {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('grade');

    if (error) {
      console.error('Error fetching grade counts:', error);
      return { A: 0, B: 0, C: 0, D: 0, F: 0 };
    }

    const counts: Record<'A' | 'B' | 'C' | 'D' | 'F', number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    if (data) {
      for (const row of data) {
        const grade = row.grade as 'A' | 'B' | 'C' | 'D' | 'F';
        counts[grade]++;
      }
    }

    return counts;
  } catch (error) {
    console.error('Error in getGradeCounts:', error);
    return { A: 0, B: 0, C: 0, D: 0, F: 0 };
  }
}

/**
 * Clear all grades from the database
 */
export async function clearAllGrades(): Promise<void> {
  try {
    const { error } = await supabase
      .from('grades')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
      console.error('Error clearing all grades:', error);
      throw new Error(`Failed to clear all grades: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in clearAllGrades:', error);
    throw error;
  }
}
