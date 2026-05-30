-- 1. Create the gallery storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies for gallery bucket
-- Anyone can view public gallery images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'gallery' );

-- Authenticated users can insert their own images into gallery bucket
CREATE POLICY "Auth Users Insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery' AND auth.role() = 'authenticated'
);

-- Users can delete their own images
CREATE POLICY "Users Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Create the user_images table
CREATE TABLE IF NOT EXISTS public.user_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users_roles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'render' or 'inspiration'
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  size_bytes BIGINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS on user_images
ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for user_images
-- Users can view their own images
CREATE POLICY "Users can view own images" ON public.user_images FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own images
CREATE POLICY "Users can insert own images" ON public.user_images FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete own images" ON public.user_images FOR DELETE
USING (auth.uid() = user_id);

-- Admins can do everything on user_images
CREATE POLICY "Admins can do everything on user_images" ON public.user_images FOR ALL
USING ((SELECT role FROM public.users_roles WHERE id = auth.uid()) = 'admin');
