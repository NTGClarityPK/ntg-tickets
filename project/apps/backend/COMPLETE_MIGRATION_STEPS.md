# Complete Step-by-Step Supabase Migration Instructions

This document provides **complete, detailed instructions** for migrating from Prisma + PostgreSQL + Custom Auth + S3 to Supabase.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Install Dependencies](#step-1-install-dependencies)
3. [Step 2: Create Supabase Project](#step-2-create-supabase-project)
4. [Step 3: Set Up Database Schema](#step-3-set-up-database-schema)
5. [Step 4: Generate TypeScript Types](#step-4-generate-typescript-types)
6. [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
7. [Step 6: Update File Storage Module](#step-6-update-file-storage-module)
8. [Step 7: Update Authentication](#step-7-update-authentication)
9. [Step 8: Update Services Gradually](#step-8-update-services-gradually)
10. [Step 9: Test Everything](#step-9-test-everything)
11. [Step 10: Migrate Data (if needed)](#step-10-migrate-data-if-needed)

---

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- A Supabase account (free tier works)
- Access to your current PostgreSQL database (for data migration)
- Your current `.env` file

---

## Step 1: Install Dependencies

### 1.1 Install Supabase packages

```bash
cd apps/backend
npm install @supabase/supabase-js
npm install --save-dev supabase
```

### 1.2 Verify Installation

Check that `package.json` now includes:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "supabase": "^1.122.0"
  }
}
```

**✅ Files created:**
- `package.json` (updated)

---

## Step 2: Create Supabase Project

### 2.1 Create Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: `ntg-ticket-system`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine to start

### 2.2 Get Your Credentials

After project creation, go to **Settings** → **API**:

1. **Project URL**: `https://xxxxx.supabase.co`
2. **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ⚠️ **Keep this secret!**

Save these values - you'll need them in Step 5.

---

## Step 3: Set Up Database Schema

### 3.1 Run SQL Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Open the file `supabase-migration.sql` from this project
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run** or press `Ctrl+Enter`

### 3.2 Verify Tables Created

Go to **Table Editor** and verify these tables exist:
- ✅ `users`
- ✅ `tickets`
- ✅ `categories`
- ✅ `subcategories`
- ✅ `comments`
- ✅ `attachments`
- ✅ All other tables from your schema

### 3.3 Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Name: `ticket-attachments`
4. **Public bucket**: ✅ Yes (or No if you want private)
5. Click **Create bucket**

**✅ Files created:**
- `supabase-migration.sql`

---

## Step 4: Generate TypeScript Types

### 4.1 Install Supabase CLI (if not already)

```bash
npm install -g supabase
```

### 4.2 Get Your Project ID

In Supabase Dashboard → **Settings** → **General**:
- Copy your **Project ID** (e.g., `abcdefghijklmnopqrst`)

### 4.3 Generate Types

```bash
cd apps/backend

# Option 1: Using CLI directly
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/database/types/database.types.ts

# Option 2: Using the npm script (after setting SUPABASE_PROJECT_ID)
export SUPABASE_PROJECT_ID=your-project-id
npm run supabase:types
```

### 4.4 Verify Types Generated

Check that `src/database/types/database.types.ts` exists and contains type definitions.

**✅ Files created:**
- `src/database/types/database.types.ts` (generated)

---

## Step 5: Configure Environment Variables

### 5.1 Update `.env` File

Edit `.env` in `apps/backend/`:

```env
# Supabase Configuration (ADD THESE)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_STORAGE_BUCKET=ticket-attachments

# Keep old config during migration (comment out later)
# DATABASE_URL="postgresql://..."
# AWS_ACCESS_KEY_ID=...
```

### 5.2 Update `.env.example`

The `env.example` file has been updated with Supabase configuration.

**✅ Files updated:**
- `.env` (your local file)
- `env.example`

---

## Step 6: Update File Storage Module

### 6.1 Register SupabaseStorageService

Update `src/modules/attachments/attachments.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { SupabaseStorageService } from '../../common/file-storage/supabase-storage.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    SupabaseStorageService, // Add this
  ],
})
export class AttachmentsModule {}
```

### 6.2 Verify Storage Service

The `AttachmentsService` has already been updated to use `SupabaseStorageService` with fallback to old storage.

**✅ Files created:**
- `src/common/file-storage/supabase-storage.service.ts`
- `src/modules/attachments/attachments.service.ts` (updated)

---

## Step 7: Update Authentication

### 7.1 Choose Authentication Strategy

You have two options:

#### Option A: Full Supabase Auth (Recommended)
- Uses Supabase Auth for all authentication
- Users stored in `auth.users` table
- Sync with `public.users` table

#### Option B: Hybrid Approach
- Keep existing auth but use Supabase for user storage
- Migrate passwords gradually

### 7.2 Update Auth Module

The `SupabaseAuthService` has been created. To use it:

1. Update `src/modules/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { SupabaseAuthService } from './supabase-auth.service';
// ... other imports

@Module({
  // ...
  providers: [
    SupabaseAuthService, // Add this
    // Keep old AuthService during migration
  ],
})
export class AuthModule {}
```

2. Gradually replace `AuthService` calls with `SupabaseAuthService`.

**✅ Files created:**
- `src/modules/auth/supabase-auth.service.ts`

---

## Step 8: Update Services Gradually

### 8.1 Migration Strategy

**DO NOT** migrate everything at once. Migrate service by service:

1. ✅ Start with simple services (like `CategoriesService`)
2. ✅ Test thoroughly after each migration
3. ✅ Keep both Prisma and Supabase available during migration
4. ✅ Once stable, remove Prisma

### 8.2 Example: Update CategoriesService

**Before (Prisma):**
```typescript
async findAll() {
  return this.prisma.category.findMany({
    where: { isActive: true },
  });
}
```

**After (Supabase):**
```typescript
async findAll() {
  const { data, error } = await this.supabase
    .from('categories')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return data;
}
```

### 8.3 Service Migration Order

Recommended order:
1. ✅ Categories & Subcategories
2. ✅ System Settings
3. ✅ Custom Fields
4. ✅ Tickets (most complex)
5. ✅ Comments
6. ✅ Notifications
7. ✅ Users (last, since everything depends on it)

### 8.4 Update Database Module

The `DatabaseModule` has been updated to include both `PrismaService` and `SupabaseService`.

**✅ Files updated:**
- `src/database/database.module.ts`

---

## Step 9: Test Everything

### 9.1 Test Checklist

After each service migration:

- [ ] Service starts without errors
- [ ] CRUD operations work
- [ ] Relations/queries work
- [ ] Error handling works
- [ ] TypeScript types are correct

### 9.2 Run Tests

```bash
npm run test
npm run start:dev
```

### 9.3 Test in Browser/Postman

Test all API endpoints:
- ✅ GET /categories
- ✅ POST /tickets
- ✅ GET /tickets/:id
- ✅ File upload
- ✅ Authentication

---

## Step 10: Migrate Data (if needed)

### 10.1 Export from PostgreSQL

If you have existing data:

```bash
# Export data
pg_dump -h localhost -U postgres -d ntg_ticket > backup.sql

# Or export specific tables
pg_dump -h localhost -U postgres -d ntg_ticket -t users > users.sql
```

### 10.2 Transform Data

You may need to:
1. Convert column names (camelCase → snake_case)
2. Update UUID formats
3. Handle enum values
4. Migrate passwords (users need to reset passwords or use Supabase Auth migration)

### 10.3 Import to Supabase

1. Use Supabase Dashboard → SQL Editor
2. Or use `psql` to connect to Supabase:

```bash
psql -h db.xxxxx.supabase.co -U postgres -d postgres
```

Then run your transformed SQL.

### 10.4 Sync Users with Supabase Auth

For existing users, you have two options:

**Option A: Let users reset passwords**
- Users sign in with email
- Use "Forgot Password" flow
- Supabase handles password creation

**Option B: Migrate passwords (Advanced)**
- Extract hashed passwords
- Use Supabase Auth Admin API to set passwords
- **Note**: This requires bcrypt password format compatibility

---

## 📝 Migration Checklist

Use this checklist to track progress:

### Setup
- [ ] Supabase project created
- [ ] Database schema created in Supabase
- [ ] Storage bucket created
- [ ] TypeScript types generated
- [ ] Environment variables configured
- [ ] Dependencies installed

### Code Migration
- [ ] `SupabaseService` created and tested
- [ ] `SupabaseStorageService` created and tested
- [ ] `SupabaseAuthService` created
- [ ] Database module updated
- [ ] File storage updated
- [ ] Services migrated one by one
- [ ] All tests passing

### Testing
- [ ] All API endpoints working
- [ ] File upload/download working
- [ ] Authentication working
- [ ] Database queries working
- [ ] Error handling working

### Cleanup
- [ ] Old Prisma code removed (optional)
- [ ] Old S3 code removed (optional)
- [ ] Old auth code removed (optional)
- [ ] Documentation updated

---

## 🔧 Troubleshooting

### Issue: "Missing Supabase configuration"

**Solution:** Check your `.env` file has all Supabase variables set.

### Issue: "Row Level Security policy violation"

**Solution:** 
1. Check RLS policies in Supabase Dashboard
2. Use service role key for admin operations
3. Create proper RLS policies for your use case

### Issue: "Types don't match"

**Solution:**
1. Regenerate types: `npm run supabase:types`
2. Check column names match (snake_case vs camelCase)
3. Verify your database schema matches the types

### Issue: "Storage upload fails"

**Solution:**
1. Check bucket exists and is accessible
2. Verify bucket permissions
3. Check file size limits
4. Verify SUPABASE_STORAGE_BUCKET env variable

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎉 Next Steps

After migration is complete:

1. **Performance**: Monitor query performance, add indexes if needed
2. **Security**: Review RLS policies, ensure proper access control
3. **Monitoring**: Set up Supabase monitoring and alerts
4. **Backups**: Configure Supabase backups
5. **Optimization**: Optimize queries, use Supabase features like Realtime if needed

---

## ⚠️ Important Notes

1. **Keep Prisma during migration**: Don't remove Prisma until everything is working
2. **Test incrementally**: Migrate one service at a time
3. **Backup data**: Always backup before migration
4. **RLS Policies**: Understand and configure Row Level Security
5. **Type Safety**: Use generated TypeScript types for type safety
6. **Service Role Key**: Keep it secret and only use server-side

---

## Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review Supabase documentation
3. Check migration examples in `MIGRATION_EXAMPLES.md`
4. Verify your environment variables

Good luck with your migration! 🚀

