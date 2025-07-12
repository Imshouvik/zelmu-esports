-- Add games table for multi-game tournaments
CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  rules jsonb DEFAULT '[]'::jsonb
);

-- Add tournament_stages table for qualifiers, playoffs, etc.
CREATE TABLE IF NOT EXISTS public.tournament_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id),
  name text NOT NULL,
  type text, -- e.g., group, knockout, final
  stage_order integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add groups table for group stages
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id),
  stage_id uuid REFERENCES public.tournament_stages(id),
  name text NOT NULL,
  group_order integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  time_slot time,
  max_teams integer DEFAULT 24,
  current_teams integer DEFAULT 0
);

-- Add points_rules table for flexible point systems
CREATE TABLE IF NOT EXISTS public.points_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id),
  win_points integer DEFAULT 3,
  draw_points integer DEFAULT 1,
  loss_points integer DEFAULT 0,
  custom_rules jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add optional fields to tournaments for tier, division, and parent tournament
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS tier text;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS division text;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS parent_tournament_id uuid REFERENCES public.tournaments(id);

-- Add group_id to tournament_registrations
ALTER TABLE public.tournament_registrations
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id);

-- Add group_id to matches
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id); 

-- 7. Create team_kills table for real-time kill tracking
CREATE TABLE IF NOT EXISTS public.team_kills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  kills integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE (tournament_id, team_id)
);

COMMENT ON TABLE public.team_kills IS 'Tracks kills for each team in each tournament (for overlays, live updates, etc)';
COMMENT ON COLUMN public.team_kills.kills IS 'Total kills for this team in this tournament.';
COMMENT ON COLUMN public.team_kills.updated_at IS 'Last time kills were updated.'; 