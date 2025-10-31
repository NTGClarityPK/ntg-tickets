# Supabase Migration Guide - Step by Step

This guide will help you migrate from Prisma + PostgreSQL + Custom Auth + S3 to Supabase (Database + Auth + Storage).

## Prerequisites

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - Anon/Public Key
     - Service Role Key (keep this secret!)

2. **Install Supabase CLI** (optional, for generating types)
   ```bash
   npm install -g supabase
   ```

---

## Step 1: Install Dependencies

Update `package.json` to include Supabase:

```bash
cd apps/backend
npm install @supabase/supabase-js
npm install --save-dev supabase
```

Remove Prisma (optional - keep if you want to migrate data):
```bash
npm uninstall @prisma/client prisma
```

---

## Step 2: Set Up Supabase Database Schema

### 2.1 Create Tables in Supabase Dashboard

Go to your Supabase project → SQL Editor and run the migration script.

**Important:** Create all tables matching your Prisma schema. You can:
- Export your current Prisma schema to SQL
- Or use the Supabase migration tool

### 2.2 Generate TypeScript Types

After your database is set up in Supabase:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/database/types/database.types.ts
```

Or manually create `database.types.ts` based on your schema.

---

## Step 3: Environment Variables

Update `.env` file with Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Remove or keep these for backward compatibility during migration
# DATABASE_URL=postgresql://...
# AWS_ACCESS_KEY_ID=...
```

---

## Step 4: Create Supabase Service

Replace `PrismaService` with `SupabaseService`. See the implementation file.

---

## Step 5: Update Authentication

Replace custom JWT auth with Supabase Auth:

1. Remove password hashing (Supabase handles it)
2. Use Supabase Auth methods:
   - `supabase.auth.signUp()`
   - `supabase.auth.signInWithPassword()`
   - `supabase.auth.signOut()`
   - `supabase.auth.getUser()`

---

## Step 6: Update Storage

Replace S3 with Supabase Storage:

1. Create a bucket in Supabase Dashboard (e.g., `ticket-attachments`)
2. Update file storage service to use Supabase Storage API

---

## Step 7: Data Migration

If you have existing data:

1. Export data from PostgreSQL
2. Import to Supabase using SQL scripts
3. Update user passwords to use Supabase Auth

---

## Step 8: Update All Services

Replace all Prisma queries with Supabase queries:

- `prisma.user.findMany()` → `supabase.from('users').select()`
- `prisma.user.create()` → `supabase.from('users').insert()`
- `prisma.user.update()` → `supabase.from('users').update()`
- `prisma.user.delete()` → `supabase.from('users').delete()`

---

## Migration Checklist

- [ ] Install Supabase dependencies
- [ ] Create Supabase project and get credentials
- [ ] Set up database schema in Supabase
- [ ] Generate TypeScript types
- [ ] Update environment variables
- [ ] Replace PrismaService with SupabaseService
- [ ] Update authentication to use Supabase Auth
- [ ] Update file storage to use Supabase Storage
- [ ] Update all service files
- [ ] Test all endpoints
- [ ] Migrate existing data (if applicable)
- [ ] Update seed script
- [ ] Remove Prisma dependencies (optional)

---

## Important Notes

1. **Row Level Security (RLS)**: Supabase uses RLS for security. You'll need to:
   - Enable RLS on tables
   - Create policies for user access
   - Or use Service Role Key for admin operations

2. **User Management**: Supabase Auth stores users in `auth.users` table, but you'll need to sync with your `public.users` table.

3. **Password Migration**: Existing passwords need to be reset or migrated using Supabase Auth migration tools.

4. **Types**: Use generated TypeScript types for type-safe queries.

5. **Transactions**: Supabase doesn't support transactions the same way. Use `rpc()` for complex operations.

---

## Support

For issues during migration, refer to:
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

