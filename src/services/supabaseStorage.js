// Optional Cloud Storage Service via Supabase for Dostflix Memory Studio
// Gracefully degrades to IndexedDB if Supabase credentials or buckets are unconfigured.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseKey.includes('placeholder')
);

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

const BUCKET_NAME = 'memories';

// Upload a single file to Supabase Storage
export async function uploadToSupabase(file, path) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const filePath = path || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: publicUrlData.publicUrl
  };
}

// Check connectivity to Supabase
export async function checkSupabaseConnection() {
  if (!supabase) return { connected: false, reason: 'Credentials not configured' };
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
    if (error) {
      return { connected: false, reason: error.message };
    }
    return { connected: true, bucket: data };
  } catch (err) {
    return { connected: false, reason: err.message };
  }
}
