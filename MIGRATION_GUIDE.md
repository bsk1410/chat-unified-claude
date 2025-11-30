# Adding New Tables Securely

This guide explains how to add new database tables with proper security measures.

---

## Step 1: Create Migration File

Create a new migration file in `supabase/migrations/` with the next sequence number:

```sql
-- supabase/migrations/00006_your_table.sql

CREATE TABLE your_table (
  -- Primary key (always use UUID)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to user (required for RLS)
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Your columns here
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),

  -- Standard timestamp columns
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ  -- For soft delete
);

-- Apply standard security patterns
SELECT apply_standard_rls('your_table');
SELECT apply_updated_at_trigger('your_table');

-- Optional: Add audit logging for sensitive tables
SELECT apply_audit_trigger('your_table');

-- Add indexes for common query patterns
CREATE INDEX idx_your_table_user_id ON your_table(user_id);
CREATE INDEX idx_your_table_status ON your_table(status) WHERE deleted_at IS NULL;

-- Create active view (excludes soft-deleted records)
SELECT create_active_view('your_table');
```

---

## Step 2: Generate TypeScript Types

After pushing your migration, regenerate TypeScript types:

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

This keeps your TypeScript types in sync with your database schema.

---

## Step 3: Create Zod Schema

Add validation schemas for your new table in `src/lib/validation.ts`:

```typescript
// src/lib/validation.ts

export const yourTableSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  status: z.enum(['active', 'archived']).default('active'),
});

export type YourTableFormData = z.infer<typeof yourTableSchema>;
```

---

## Step 4: Create API Functions (Optional)

If you need custom queries, create them in a dedicated file:

```typescript
// src/lib/api/yourTable.ts

import { supabase } from '@/lib/supabase';
import type { YourTable } from '@/types/database';

export async function getYourTableItems(): Promise<YourTable[]> {
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createYourTableItem(
  data: Omit<YourTable, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<YourTable> {
  const { data: item, error } = await supabase
    .from('your_table')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return item;
}
```

---

## Step 5: Verify RLS Policies

Test that your RLS policies work correctly:

### Test Cases

1. **Authenticated user can CRUD their own records**
   ```sql
   -- As authenticated user
   SELECT * FROM your_table;  -- Should only show own records
   ```

2. **Authenticated user cannot access other users' records**
   ```sql
   -- This should return 0 rows even if other users have data
   SELECT * FROM your_table WHERE user_id != auth.uid();
   ```

3. **Unauthenticated requests are rejected**
   ```sql
   -- As anon role, should be denied
   SELECT * FROM your_table;
   ```

---

## Security Checklist for New Tables

Before deploying, verify:

- [ ] Table has `user_id` column for ownership
- [ ] RLS is enabled AND forced
- [ ] Standard RLS policies applied
- [ ] Updated_at trigger applied
- [ ] Audit trigger applied (if sensitive data)
- [ ] Appropriate indexes created
- [ ] TypeScript types regenerated
- [ ] Zod validation schema created
- [ ] Test cases pass

---

## Common Patterns

### Many-to-Many Relationships

```sql
CREATE TABLE user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  tag_id UUID REFERENCES tags(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(user_id, tag_id)
);

SELECT apply_standard_rls('user_tags');
```

### Shared Resources (Team Access)

For resources shared within a team:

```sql
CREATE TABLE team_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  -- ... other columns

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Custom RLS for team-based access
ALTER TABLE team_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_resources FORCE ROW LEVEL SECURITY;

CREATE POLICY "Team members can access team resources"
  ON team_resources FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );
```

### Public Read, Owner Write

For content that's publicly readable but only editable by owner:

```sql
-- Public can read
CREATE POLICY "Anyone can read published items"
  ON your_table FOR SELECT
  USING (status = 'published');

-- Only owner can modify
CREATE POLICY "Owners can modify own items"
  ON your_table FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## Troubleshooting

### "permission denied for table"
- Check that RLS is enabled but policies exist
- Verify the user is authenticated
- Check the policy conditions

### "new row violates row-level security policy"
- The WITH CHECK clause is failing
- Usually means trying to insert with wrong user_id

### Types not updating
- Run `npx supabase gen types typescript --linked` again
- Restart your TypeScript server

---

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
