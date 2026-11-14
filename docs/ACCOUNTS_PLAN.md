# Personal Accounts & Cloud Sync Design Plan

## 1. Current Storage & Proposed Repository Layer

- **Current Implementation:**
  - Storage is primitive key-value via [`IStorageService`](file:///c:/Users/David/Desktop/Project-Eunice/src/services/storage/IStorageService.ts) (`getItem`, `setItem`, `removeItem`, `clear`), with [`LocalStorageService`](file:///c:/Users/David/Desktop/Project-Eunice/src/services/storage/LocalStorageService.ts) storing JSON blobs for `'habits'` (`Habit[]`) and `'completions'` (`Record<string, string[]>`).
  - [`useHabitStore`](file:///c:/Users/David/Desktop/Project-Eunice/src/stores/habitStore.ts) directly interacts with this key-value layer.
- **Proposed Repository Abstraction (`IHabitRepository`):**
  Decouples the domain and Pinia store from physical persistence so UI components remain completely agnostic:
  ```typescript
  export interface IHabitRepository {
    getHabits(): Promise<Habit[]>
    saveHabit(habit: Habit): Promise<void>
    deleteHabit(id: string): Promise<void>
    getCompletions(): Promise<Record<string, string[]>>
    toggleCompletion(habitId: string, date: string, completed: boolean): Promise<void>
    clearAll(): Promise<void>
  }
  ```
  - **`LocalHabitRepository`**: Wraps `IStorageService` (maintains current guest behavior).
  - **`SupabaseHabitRepository`**: Uses `@supabase/supabase-js` targeting Postgres tables, with local cache for instant reads.

---

## 2. Postgres Database Schema

```sql
-- Habits table
CREATE TABLE public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    color TEXT NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT false,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Completions table
CREATE TABLE public.completions (
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (habit_id, date)
);

-- Indexes for performance and Stats queries
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_completions_user_date ON public.completions(user_id, date DESC);
CREATE INDEX idx_completions_habit_date ON public.completions(habit_id, date DESC);
```

---

## 3. Row Level Security (RLS)

RLS is strictly enforced on all tables. No access is granted without authentication and user identity matching `auth.uid()`:

```sql
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

-- Habits Policies
CREATE POLICY "Users can manage own habits"
ON public.habits FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Completions Policies (verifies user owns completion and referenced habit)
CREATE POLICY "Users can manage own completions"
ON public.completions FOR ALL
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
```

---

## 4. Authentication Flows

- **Mechanism:** Email & Password managed via `@supabase/supabase-js` (`supabase.auth`).
- **Core Flows:**
  1. **Sign Up:** `signUp({ email, password })`. Informs user if confirmation email is required.
  2. **Log In:** `signInWithPassword({ email, password })`. Restores active session and switches repository.
  3. **Log Out:** `signOut()`. Clears local user data cache, resets store, returns to guest state.
  4. **Password Reset:** `resetPasswordForEmail(email, { redirectTo })` & `updateUser({ password })`.
- **User Feedback:** Clear, human-readable error messages mapped from Supabase error codes (invalid credentials, duplicate email, weak password, rate limiting).

---

## 5. Data Flow & Cache Strategy

```
+---------------+     Guest Mode     +----------------------+
| Habit Tracker | -----------------> | LocalStorageService  |
| Pinia Store   |                    +----------------------+
+---------------+
        |
        | Logged In (Source of Truth: Supabase)
        v
+-----------------------------+       Sync      +-------------------------+
|   SupabaseHabitRepository   | --------------> | Supabase Postgres (RLS) |
+-----------------------------+                 +-------------------------+
        | (Cache & Fast Read)
        v
+-----------------------------+
| Device Cache (LocalStorage) |
+-----------------------------+
```

- **Guest Mode:** 100% offline via `localStorage`. Zero Supabase network requests.
- **Logged In:** Supabase Postgres is the primary source of truth; `localStorage` acts as a read cache for instant page boots.
- **Sync & Conflict Strategy:**
  - Optimistic UI updates with background network execution.
  - Conflict resolution: **Last Write Wins (LWW)** using `updated_at`.
  - Non-blocking sync badge in the UI: _Synced_, _Syncing..._, or _Sync Error (Retry)_.

---

## 6. First-Login Data Migration

1. **Detection:** When a user logs in, the app checks if `localStorage` contains user-created habits (`!habit.isDemo`).
2. **User Consent Dialog:**
   - Displays count of existing local habits and completions.
   - Options: **"Upload to my account"** or **"Start empty"**.
3. **Safety & Integrity Rules:**
   - **Never auto-upload demo data:** Demo habits are filtered out.
   - **Idempotent Upsert:** Inserts use existing UUIDs (`ON CONFLICT (id) DO UPDATE`), preventing duplicates on retries.
   - **Zero Data Loss:** Local storage is preserved until the server acknowledges a 100% successful batch upload.

---

## 7. Risks & Open Questions

- **Supabase Inactivity Pausing:** Free projects pause after 7 days without activity. Documenting this in README with unpause instructions.
- **Email Rate Limits:** Supabase default email service has strict hourly limits (3-4 emails/hr). Document this limitation clearly for testing.
- **UUID Generation in Frontend:** Habits created locally must use RFC 4122 UUIDs (`crypto.randomUUID()`) so IDs seamlessly transition to Postgres `UUID` columns without remapping.
- **Offline Writes while Logged In:** Temporary network drops require an in-memory retry queue before flagging a permanent sync error to the user.
