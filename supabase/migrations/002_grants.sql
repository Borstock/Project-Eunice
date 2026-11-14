-- ============================================================
-- Migration: 002_grants.sql
-- Description: Grant table permissions on habits and completions to authenticated role
-- Note: Row Level Security (RLS) remains fully enabled on both tables.
-- ============================================================

-- 1. Ensure schema usage privilege for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Grant table CRUD privileges to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.completions TO authenticated;
