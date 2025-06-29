# Zelmu Esports Platform - Database Schema Reference

## Overview
This document contains the complete database schema for the Zelmu esports platform, including all tables, relationships, and constraints.

## Tables

### 1. `users` - User Accounts
```sql
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  phone text NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
```

**Purpose:** Stores user account information
**Key Fields:**
- `id`: Unique user identifier (UUID)
- `email`: User's email address (unique)
- `name`: User's display name
- `phone`: User's phone number
- `created_at`: Account creation timestamp

### 2. `clubs` - Esports Clubs/Organizations
```sql
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
```

**Purpose:** Esports clubs and organizations
**Key Fields:**
- `id`: Unique club identifier
- `name`: Club name (unique)
- `logo_url`: Club logo image URL
- `bio`: Club description
- `owner_id`: Club owner (references users.id)

### 3. `club_members` - Club Membership
```sql
CREATE TABLE public.club_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'co-leader'::text, 'member'::text, 'pending'::text])),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'rejected'::text])),
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT club_members_pkey PRIMARY KEY (id),
  CONSTRAINT club_members_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
  CONSTRAINT club_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
```

**Purpose:** Manages club membership and roles
**Key Fields:**
- `club_id`: Club reference
- `user_id`: Member reference
- `role`: Member role (owner, co-leader, member, pending)
- `status`: Membership status (active, pending, rejected)

### 4. `club_invites` - Club Invitations
```sql
CREATE TABLE public.club_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone,
  CONSTRAINT club_invites_pkey PRIMARY KEY (id),
  CONSTRAINT club_invites_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
  CONSTRAINT club_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
```

**Purpose:** Club invitation system
**Key Fields:**
- `club_id`: Club being invited to
- `invite_code`: Unique invitation code
- `created_by`: User who created the invite
- `expires_at`: Invitation expiration date

### 5. `tournaments` - Esports Tournaments
```sql
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
  CONSTRAINT tournaments_pkey PRIMARY KEY (id),
  CONSTRAINT tournaments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
```

**Purpose:** Tournament information
**Key Fields:**
- `title`: Tournament name
- `game`: Game being played (e.g., "BGMI", "Free Fire")
- `start_date`/`end_date`: Tournament duration
- `prize_pool`: Prize money amount
- `status`: Tournament status
- `created_by`: Tournament creator

### 6. `teams` - Tournament Teams
```sql
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
```

**Purpose:** Teams participating in tournaments
**Key Fields:**
- `name`: Team name
- `owner_id`: Team owner/captain

### 7. `registrations` - Tournament Registrations
```sql
CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  tournament_id uuid,
  team_id uuid,
  registered_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT registrations_pkey PRIMARY KEY (id),
  CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT registrations_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT registrations_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
```

**Purpose:** Tournament registration tracking
**Key Fields:**
- `user_id`: Registered user
- `tournament_id`: Tournament being registered for
- `team_id`: Team (if registering as team)

### 8. `club_tournaments` - Club Tournament Participation
```sql
CREATE TABLE public.club_tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL,
  tournament_id uuid NOT NULL,
  registered_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT club_tournaments_pkey PRIMARY KEY (id),
  CONSTRAINT club_tournaments_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id),
  CONSTRAINT club_tournaments_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
  CONSTRAINT club_tournaments_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES public.users(id)
);
```

**Purpose:** Tracks which clubs participate in tournaments
**Key Fields:**
- `club_id`: Participating club
- `tournament_id`: Tournament
- `registered_by`: User who registered the club

### 9. `matches` - Tournament Matches
```sql
CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid,
  team1_id uuid,
  team2_id uuid,
  result text,
  played_at timestamp with time zone,
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_team2_id_fkey FOREIGN KEY (team2_id) REFERENCES public.teams(id),
  CONSTRAINT matches_team1_id_fkey FOREIGN KEY (team1_id) REFERENCES public.teams(id),
  CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
);
```

**Purpose:** Individual matches within tournaments
**Key Fields:**
- `tournament_id`: Tournament the match belongs to
- `team1_id`/`team2_id`: Competing teams
- `result`: Match outcome
- `played_at`: When the match was played

## Key Relationships

1. **Users** → **Clubs** (one-to-many): Users can own multiple clubs
2. **Users** → **Teams** (one-to-many): Users can own multiple teams
3. **Clubs** → **Club Members** (one-to-many): Clubs have multiple members
4. **Tournaments** → **Registrations** (one-to-many): Tournaments have multiple registrations
5. **Tournaments** → **Matches** (one-to-many): Tournaments have multiple matches
6. **Teams** → **Matches** (many-to-many): Teams participate in matches

## Notes

- All tables use UUID primary keys with `gen_random_uuid()` default
- Timestamps use UTC timezone
- Foreign key constraints ensure data integrity
- Check constraints validate role and status values
- Unique constraints prevent duplicate emails, club names, and invite codes 