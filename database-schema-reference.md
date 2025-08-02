-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.club_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone,
  for_user_id uuid,
  CONSTRAINT club_invites_pkey PRIMARY KEY (id),
  CONSTRAINT club_invites_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
  CONSTRAINT club_invites_for_user_id_fkey FOREIGN KEY (for_user_id) REFERENCES public.users(id),
  CONSTRAINT club_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.club_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'co-leader'::text, 'member'::text, 'pending'::text])),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'rejected'::text])),
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT club_members_pkey PRIMARY KEY (id),
  CONSTRAINT club_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT club_members_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id)
);
CREATE TABLE public.club_tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL,
  tournament_id uuid NOT NULL,
  registered_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT club_tournaments_pkey PRIMARY KEY (id),
  CONSTRAINT club_tournaments_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES public.users(id),
  CONSTRAINT club_tournaments_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id),
  CONSTRAINT club_tournaments_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id)
);
CREATE TABLE public.clubs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  logo_url text,
  bio text,
  owner_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT clubs_pkey PRIMARY KEY (id),
  CONSTRAINT clubs_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.games (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  rules jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT games_pkey PRIMARY KEY (id)
);
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  stage_id uuid,
  name text NOT NULL,
  group_order integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  time_slot time without time zone,
  max_teams integer DEFAULT 24,
  current_teams integer DEFAULT 0,
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.tournament_stages(id),
  CONSTRAINT groups_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid,
  team1_id uuid,
  team2_id uuid,
  result text,
  played_at timestamp with time zone,
  group_id uuid,
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id),
  CONSTRAINT matches_team2_id_fkey FOREIGN KEY (team2_id) REFERENCES public.teams(id),
  CONSTRAINT matches_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT matches_team1_id_fkey FOREIGN KEY (team1_id) REFERENCES public.teams(id)
);
CREATE TABLE public.overlay_state (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL UNIQUE,
  colors jsonb DEFAULT '{}'::jsonb,
  active_team_card uuid,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT overlay_state_pkey PRIMARY KEY (id),
  CONSTRAINT overlay_state_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.points_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  win_points integer DEFAULT 3,
  draw_points integer DEFAULT 1,
  loss_points integer DEFAULT 0,
  custom_rules jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT points_rules_pkey PRIMARY KEY (id),
  CONSTRAINT points_rules_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid,
  comment_id uuid,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT post_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT post_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id),
  CONSTRAINT post_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['discussion'::text, 'team_requirement'::text, 'event'::text])),
  image_url text,
  event_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  visibility text DEFAULT 'public'::text CHECK (visibility = ANY (ARRAY['public'::text, 'club'::text, 'private'::text])),
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT posts_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  tournament_id uuid,
  team_id uuid,
  registered_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT registrations_pkey PRIMARY KEY (id),
  CONSTRAINT registrations_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id),
  CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT registrations_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_key text NOT NULL,
  type text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.team_kills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  team_id uuid NOT NULL,
  kills integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT team_kills_pkey PRIMARY KEY (id),
  CONSTRAINT team_kills_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_kills_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.team_player_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  team_id uuid NOT NULL,
  player_name text NOT NULL,
  player_index integer NOT NULL,
  is_alive boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT team_player_status_pkey PRIMARY KEY (id),
  CONSTRAINT team_player_status_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_player_status_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.team_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  player_name text NOT NULL,
  player_email text,
  player_phone text,
  game_id text NOT NULL,
  player_position text DEFAULT 'member'::text CHECK (player_position = ANY (ARRAY['captain'::text, 'member'::text])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  user_id uuid,
  player_index integer,
  CONSTRAINT team_players_pkey PRIMARY KEY (id),
  CONSTRAINT team_players_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT team_players_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  tournament_id uuid,
  team_type text DEFAULT 'open'::text CHECK (team_type = ANY (ARRAY['open'::text, 'club'::text])),
  registration_status text DEFAULT 'pending'::text CHECK (registration_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  payment_status text DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text])),
  registered_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT teams_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.tournament_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  registration_type text NOT NULL CHECK (registration_type = ANY (ARRAY['team'::text, 'club'::text])),
  team_id uuid,
  club_id uuid,
  registered_by uuid NOT NULL,
  registration_status text DEFAULT 'pending'::text CHECK (registration_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  payment_status text DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text])),
  registered_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  group_id uuid,
  CONSTRAINT tournament_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_registrations_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
  CONSTRAINT tournament_registrations_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id),
  CONSTRAINT tournament_registrations_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT tournament_registrations_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES public.users(id),
  CONSTRAINT tournament_registrations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id)
);
CREATE TABLE public.tournament_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  name text NOT NULL,
  type text,
  stage_order integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT tournament_stages_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_stages_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  game text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  prize_pool integer NOT NULL,
  status text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  type text NOT NULL DEFAULT 'open'::text CHECK (type = ANY (ARRAY['open'::text, 'club'::text])),
  is_featured boolean NOT NULL DEFAULT false,
  is_upcoming boolean NOT NULL DEFAULT false,
  registration_fee integer DEFAULT 0 CHECK (registration_fee >= 0),
  max_teams integer DEFAULT 64 CHECK (max_teams > 0),
  current_teams integer DEFAULT 0 CHECK (current_teams >= 0),
  rules jsonb DEFAULT '[]'::jsonb,
  rewards jsonb DEFAULT '[]'::jsonb,
  tier text,
  division text,
  parent_tournament_id uuid,
  CONSTRAINT tournaments_pkey PRIMARY KEY (id),
  CONSTRAINT tournaments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT tournaments_parent_tournament_id_fkey FOREIGN KEY (parent_tournament_id) REFERENCES public.tournaments(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  phone text,
  fcm_token text,
  role text DEFAULT 'user'::text,
  avatar_url text,
  zelmuname text UNIQUE,
  country text,
  state text,
  city text,
  zelmuname_changes integer NOT NULL DEFAULT 0,
  CONSTRAINT users_pkey PRIMARY KEY (id)
); 