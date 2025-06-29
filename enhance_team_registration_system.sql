-- Enhance team registration system for club vs open tournaments

-- 1. Add fields to teams table for better team management
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES public.tournaments(id),
ADD COLUMN IF NOT EXISTS team_type text DEFAULT 'open' CHECK (team_type IN ('open', 'club')),
ADD COLUMN IF NOT EXISTS registration_status text DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
ADD COLUMN IF NOT EXISTS registered_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Add comments
COMMENT ON COLUMN public.teams.tournament_id IS 'Tournament this team is registered for';
COMMENT ON COLUMN public.teams.team_type IS 'Type of team: open (individual) or club';
COMMENT ON COLUMN public.teams.registration_status IS 'Status of team registration';
COMMENT ON COLUMN public.teams.payment_status IS 'Payment status for registration fee';

-- 2. Create team_players table for individual player details (open tournaments only)
CREATE TABLE IF NOT EXISTS public.team_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  player_email text,
  player_phone text,
  game_id text NOT NULL,
  player_position text DEFAULT 'member' CHECK (player_position IN ('captain', 'member')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT team_players_pkey PRIMARY KEY (id)
);

-- Add comments
COMMENT ON TABLE public.team_players IS 'Individual players in teams (for open tournaments)';
COMMENT ON COLUMN public.team_players.player_position IS 'Player role: captain or member';

-- 3. Create tournament_registrations table to replace the basic registrations table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  registration_type text NOT NULL CHECK (registration_type IN ('team', 'club')),
  team_id uuid REFERENCES public.teams(id),
  club_id uuid REFERENCES public.clubs(id),
  registered_by uuid NOT NULL REFERENCES public.users(id),
  registration_status text DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  registered_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT tournament_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_registrations_team_or_club CHECK (
    (registration_type = 'team' AND team_id IS NOT NULL AND club_id IS NULL) OR
    (registration_type = 'club' AND club_id IS NOT NULL AND team_id IS NULL)
  )
);

-- Add comments
COMMENT ON TABLE public.tournament_registrations IS 'Enhanced tournament registration system';
COMMENT ON COLUMN public.tournament_registrations.registration_type IS 'Type of registration: team (open) or club';
COMMENT ON COLUMN public.tournament_registrations.team_id IS 'Team ID (for open tournaments)';
COMMENT ON COLUMN public.tournament_registrations.club_id IS 'Club ID (for club tournaments)';

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON public.teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_type ON public.teams(team_type);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON public.team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_type ON public.tournament_registrations(registration_type);

-- 5. Add trigger to update current_teams count in tournaments table
CREATE OR REPLACE FUNCTION update_tournament_team_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tournaments 
    SET current_teams = current_teams + 1 
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments 
    SET current_teams = current_teams - 1 
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tournament_team_count
  AFTER INSERT OR DELETE ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_team_count();

-- 6. Add RLS policies for security
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Team players policies
CREATE POLICY "Users can view their own team players" ON public.team_players
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can insert players" ON public.team_players
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update their players" ON public.team_players
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
    )
  );

-- Tournament registrations policies
CREATE POLICY "Users can view their own registrations" ON public.tournament_registrations
  FOR SELECT USING (registered_by = auth.uid());

CREATE POLICY "Users can create registrations" ON public.tournament_registrations
  FOR INSERT WITH CHECK (registered_by = auth.uid());

CREATE POLICY "Users can update their own registrations" ON public.tournament_registrations
  FOR UPDATE USING (registered_by = auth.uid()); 