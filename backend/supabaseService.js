import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Fix for Node.js 20: provide WebSocket polyfill globally
// This resolves: "Node.js 20 detected without native WebSocket support"
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}

function resolveSupabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let trimmed = rawUrl.trim();

  // Strip accidental key prefix duplication (e.g. SUPABASE_URL=https://...)
  if (trimmed.startsWith('SUPABASE_URL=')) {
    trimmed = trimmed.replace(/^SUPABASE_URL=/, '').trim();
  }

  // If a JWT token was passed instead of URL, decode the project ref from it
  if (trimmed.includes('eyJ')) {
    try {
      const parts = trimmed.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload.ref) {
          return `https://${payload.ref}.supabase.co`;
        }
      }
    } catch (_err) {
      // fallthrough
    }
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

const rawUrl = process.env.SUPABASE_URL;
const SUPABASE_URL = resolveSupabaseUrl(rawUrl);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'recipe-images';

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      // Disable realtime completely for server-side storage-only usage
      realtime: {
        params: { eventsPerSecond: -1 },
      },
    });
    console.log(`⚡ Supabase Storage client initialized → ${SUPABASE_URL}`);
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️  Supabase not configured. Images will be stored locally under /images/');
}

/**
 * Uploads a file buffer to Supabase Storage bucket 'recipe-images'
 * Returns the public HTTPS URL of the uploaded file, or null on failure.
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {Promise<string|null>}
 */
export async function uploadRecipeImageToSupabase(fileBuffer, originalName, mimeType) {
  if (!supabase) {
    return null;
  }

  try {
    const ext = (originalName.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `recipes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
    console.log('✅ Image uploaded to Supabase:', data.publicUrl);
    return data.publicUrl;
  } catch (err) {
    console.error('❌ Supabase upload exception:', err.message || err);
    return null;
  }
}

/**
 * Deletes a recipe image from Supabase Storage given its public URL.
 * Extracts the storage path from the URL and calls storage.remove().
 * Gracefully no-ops if Supabase is not configured or URL is not a Supabase URL.
 * @param {string} imageUrl - The public Supabase URL of the image
 * @returns {Promise<boolean>} true if deleted, false otherwise
 */
export async function deleteRecipeImageFromSupabase(imageUrl) {
  if (!supabase || !imageUrl || typeof imageUrl !== 'string') {
    return false;
  }

  try {
    // Supabase public URLs look like:
    // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const storageMarker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
    const markerIndex = imageUrl.indexOf(storageMarker);
    if (markerIndex === -1) {
      // Not a Supabase URL we uploaded — skip
      return false;
    }

    const filePath = imageUrl.substring(markerIndex + storageMarker.length);
    if (!filePath) return false;

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('❌ Supabase delete error:', error.message);
      return false;
    }

    console.log('🗑️  Deleted Supabase image:', filePath);
    return true;
  } catch (err) {
    console.error('❌ Supabase delete exception:', err.message || err);
    return false;
  }
}
