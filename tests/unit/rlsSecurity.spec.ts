import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { SupabaseHabitRepository } from '@/services/repository/SupabaseHabitRepository'
import { InMemoryStorageService } from '@/services/storage/InMemoryStorageService'

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockMatch = vi.fn()
const mockOrder = vi.fn()
const mockDelete = vi.fn()
const mockUpsert = vi.fn()

const mockQueryBuilder: Record<string, unknown> = {
  select: (...args: unknown[]) => {
    mockSelect(...args)
    return mockQueryBuilder
  },
  eq: (...args: unknown[]) => {
    mockEq(...args)
    return mockQueryBuilder
  },
  match: (...args: unknown[]) => {
    mockMatch(...args)
    return mockQueryBuilder
  },
  order: (...args: unknown[]) => {
    mockOrder(...args)
    return mockQueryBuilder
  },
  delete: (...args: unknown[]) => {
    mockDelete(...args)
    return mockQueryBuilder
  },
  upsert: (...args: unknown[]) => {
    mockUpsert(...args)
    return mockQueryBuilder
  }
}

const mockGetUser = vi.fn()

vi.mock('@/services/supabase/client', () => ({
  getSupabase: () => ({
    auth: {
      getUser: () => mockGetUser()
    },
    from: () => mockQueryBuilder
  })
}))

describe('Data Security & RLS Policy Verification', () => {
  let repo: SupabaseHabitRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repo = new SupabaseHabitRepository(new InMemoryStorageService())
  })

  describe('Client Query Scoping (Defense in Depth)', () => {
    it('scopes habit retrieval strictly to current user ID', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-A' } },
        error: null
      })
      mockOrder.mockResolvedValueOnce({ data: [], error: null })

      await repo.getHabits()

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-A')
      expect(mockEq).not.toHaveBeenCalledWith('user_id', 'user-B')
    })

    it('scopes completions retrieval strictly to current user ID', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-A' } },
        error: null
      })
      mockEq.mockResolvedValueOnce({ data: [], error: null })

      await repo.getCompletions()

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-A')
      expect(mockEq).not.toHaveBeenCalledWith('user_id', 'user-B')
    })
  })

  describe('Postgres Migration SQL RLS Verification', () => {
    const migrationPath = path.resolve(__dirname, '../../supabase/migrations/001_init.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    it('enables RLS on habits and completions tables', () => {
      expect(sql).toContain('ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;')
      expect(sql).toContain('ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;')
    })

    it('enforces auth.uid() = user_id on all habit policies', () => {
      expect(sql).toContain('CREATE POLICY "Users can select own habits"')
      expect(sql).toContain('USING (auth.uid() = user_id)')

      expect(sql).toContain('CREATE POLICY "Users can insert own habits"')
      expect(sql).toContain('WITH CHECK (auth.uid() = user_id)')

      expect(sql).toContain('CREATE POLICY "Users can update own habits"')
      expect(sql).toContain('CREATE POLICY "Users can delete own habits"')
    })

    it('enforces habit ownership in completions policies (prevents cross-user habit logging)', () => {
      // Must check both auth.uid() = user_id AND habit ownership
      expect(sql).toContain('CREATE POLICY "Users can select own completions"')
      expect(sql).toContain('auth.uid() = user_id')
      expect(sql).toContain('habits.id = completions.habit_id')
      expect(sql).toContain('habits.user_id = auth.uid()')

      expect(sql).toContain('CREATE POLICY "Users can insert own completions"')
      expect(sql).toContain('CREATE POLICY "Users can update own completions"')
      expect(sql).toContain('CREATE POLICY "Users can delete own completions"')
    })

    it('ensures CASCADE deletes clean up completions automatically when habit is removed', () => {
      expect(sql).toMatch(
        /habit_id UUID NOT NULL REFERENCES public\.habits\(id\) ON DELETE CASCADE/i
      )
      expect(sql).toMatch(/user_id UUID NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/i)
    })
  })
})
