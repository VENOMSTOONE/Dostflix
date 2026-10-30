-- Dostflix Memory Studio - Production Database Schema & Storage Configuration

-- 1. Create Media Files Table
CREATE TABLE IF NOT EXISTS public.media_files (
  id TEXT PRIMARY KEY,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  hash TEXT,
  capture_date TIMESTAMPTZ,
  capture_date_source TEXT,
  is_verified_metadata BOOLEAN DEFAULT FALSE,
  camera_make TEXT,
  camera_model TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  folder_name TEXT,
  assigned_memory_id TEXT,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Memories Table
CREATE TABLE IF NOT EXISTS public.memories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  friends_title TEXT,
  description TEXT,
  date DATE,
  media_type TEXT NOT NULL DEFAULT 'mixed',
  thumbnail TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  people TEXT[] DEFAULT '{}',
  location TEXT,
  mood TEXT DEFAULT 'happy',
  collection_id TEXT DEFAULT 'coll-keepsakes',
  featured BOOLEAN DEFAULT FALSE,
  favorite BOOLEAN DEFAULT FALSE,
  assets TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Storage Bucket Setup (Run in Supabase Dashboard SQL Editor)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public Access for Memories" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'memories');

CREATE POLICY "Authenticated or Anon Uploads for Memories" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'memories');
