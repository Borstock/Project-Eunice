-- ============================================================
-- Migration: 001_init.sql
-- Description: Create habits and completions tables with RLS
-- ============================================================

-- 1. Create habits table
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🎯',
    color TEXT NOT NULL DEFAULT '#6366f1',
    archived BOOLEAN NOT NULL DEFAULT false,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create completions table
CREATE TABLE IF NOT EXISTS public.completions (
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (habit_id, date)
);

-- 3. Indexes for query and stats performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON public.completions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON public.completions(habit_id, date DESC);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for habits
DROP POLICY IF EXISTS "Users can select own habits" ON public.habits;
CREATE POLICY "Users can select own habits"
    ON public.habits FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
CREATE POLICY "Users can insert own habits"
    ON public.habits FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update own habits"
    ON public.habits FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete own habits"
    ON public.habits FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. RLS Policies for completions
-- Ensures user owns both the completion row and the referenced habit
DROP POLICY IF EXISTS "Users can select own completions" ON public.completions;
CREATE POLICY "Users can select own completions"
    ON public.completions FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.habits
            WHERE habits.id = completions.habit_id
              AND habits.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own completions" ON public.completions;
CREATE POLICY "Users can insert own completions"
    ON public.completions FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.habits
            WHERE habits.id = completions.habit_id
              AND habits.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own completions" ON public.completions;
CREATE POLICY "Users can update own completions"
    ON public.completions FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.habits
            WHERE habits.id = completions.habit_id
              AND habits.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.habits
            WHERE habits.id = completions.habit_id
              AND habits.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own completions" ON public.completions;
CREATE POLICY "Users can delete own completions"
    ON public.completions FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.habits
            WHERE habits.id = completions.habit_id
              AND habits.user_id = auth.uid()
        )
    );

-- 7. Automatic updated_at timestamp trigger for habits
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_habits_updated_at ON public.habits;
CREATE TRIGGER set_habits_updated_at
    BEFORE UPDATE ON public.habits
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Table privileges for authenticated users
-- Grants table access to the authenticated role while RLS enforces user data isolation
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.completions TO authenticated;
