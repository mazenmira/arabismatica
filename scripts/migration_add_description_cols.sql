-- Migration: add enrichment columns from Zeno description scrape
-- Run this in: https://supabase.com/dashboard/project/lauwbdixjouaaaubmhqa/sql/new

ALTER TABLE coins ADD COLUMN IF NOT EXISTS zeno_description text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS upload_date      text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS keywords         text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS "references"     text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS condition        text;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS die_axis         text;

-- obverse_legend and reverse_legend already exist — skip those.

-- Confirm:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coins'
  AND column_name IN (
    'zeno_description', 'upload_date', 'keywords',
    'obverse_legend', 'reverse_legend',
    'references', 'condition', 'die_axis'
  )
ORDER BY column_name;
