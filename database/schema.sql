-- HandMetrics AI – Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable the uuid extension (already enabled in most Supabase projects)
create extension if not exists "pgcrypto";

-- Main hand scans table
create table if not exists hand_scans (
  id               uuid primary key default gen_random_uuid(),
  user_email       text not null,
  scan_date        timestamptz not null default now(),
  thumb_length     double precision,
  index_length     double precision,
  middle_length    double precision,
  ring_length      double precision,
  pinky_length     double precision,
  palm_width       double precision,
  palm_height      double precision,
  hand_orientation text,
  finger_angles    jsonb,
  video_url        text
);

-- Index for fast per-user queries
create index if not exists idx_hand_scans_user_email
  on hand_scans (user_email);

-- Row-Level Security: each authenticated user sees only their own rows
alter table hand_scans enable row level security;

create policy "Users can view own scans" on hand_scans
  for select using (auth.jwt() ->> 'email' = user_email);

create policy "Users can insert own scans" on hand_scans
  for insert with check (auth.jwt() ->> 'email' = user_email);

create policy "Users can delete own scans" on hand_scans
  for delete using (auth.jwt() ->> 'email' = user_email);

-- Storage bucket (run via Supabase dashboard or use the API)
-- bucket name: hand-videos  (public: false, or true if you want direct URLs)
