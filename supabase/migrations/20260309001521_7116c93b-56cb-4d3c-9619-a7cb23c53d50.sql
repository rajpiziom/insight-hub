-- Add unique constraint to briefing_updates to prevent duplicates
-- This ensures each user can only have one briefing item per unique content

ALTER TABLE briefing_updates 
ADD CONSTRAINT briefing_updates_user_content_unique 
UNIQUE (user_id, content_hash);