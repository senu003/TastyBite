// my-frontend/src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Environment variables or fallback defaults for local/demo setup
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Uploads a recipe image to Supabase Storage bucket 'recipe-images'
 * @param {File} file - Image file to upload
 * @returns {Promise<string|null>} - Public HTTPS URL of the uploaded image or null if upload fails
 */
export async function uploadRecipeImage(file) {
  if (!supabase) {
    console.warn("⚠️ Supabase credentials not set in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
    return null;
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `recipes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Error uploading image to Supabase:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error("Supabase upload exception:", err);
    return null;
  }
}
