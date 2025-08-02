-- Migration: Add room credentials to matches
ALTER TABLE public.matches
ADD COLUMN room_id text,
ADD COLUMN room_password text,
ADD COLUMN show_credentials_from timestamp with time zone; 