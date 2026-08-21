-- Migration 0003: Create or update item_master table with image columns
CREATE TABLE IF NOT EXISTS public.item_master (
    item_no text PRIMARY KEY,
    updated_by text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ensure the image columns exist
ALTER TABLE public.item_master ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.item_master ADD COLUMN IF NOT EXISTS image_url text;

-- Ensure RLS is enabled and accessible
ALTER TABLE public.item_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for all users" ON public.item_master;
CREATE POLICY "Enable all access for all users" ON public.item_master FOR ALL USING (true) WITH CHECK (true);
