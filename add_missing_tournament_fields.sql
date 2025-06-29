-- Add missing tournament fields to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS registration_fee integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_teams integer DEFAULT 64,
ADD COLUMN IF NOT EXISTS current_teams integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rules jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rewards jsonb DEFAULT '[]'::jsonb;

-- Add comments to explain the new fields
COMMENT ON COLUMN public.tournaments.registration_fee IS 'Tournament entry fee in rupees';
COMMENT ON COLUMN public.tournaments.max_teams IS 'Maximum number of teams allowed in tournament';
COMMENT ON COLUMN public.tournaments.current_teams IS 'Current number of registered teams';
COMMENT ON COLUMN public.tournaments.rules IS 'Tournament rules as JSON array';
COMMENT ON COLUMN public.tournaments.rewards IS 'Prize distribution structure as JSON array';

-- Add check constraints for validation
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_registration_fee_check CHECK (registration_fee >= 0),
ADD CONSTRAINT tournaments_max_teams_check CHECK (max_teams > 0),
ADD CONSTRAINT tournaments_current_teams_check CHECK (current_teams >= 0),
ADD CONSTRAINT tournaments_current_teams_max_check CHECK (current_teams <= max_teams); 