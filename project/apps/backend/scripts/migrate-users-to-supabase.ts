/**
 * Migration Script: Migrate Existing Users to Supabase Auth
 * 
 * This script migrates existing users from the local database to Supabase Auth.
 * It creates Supabase Auth users and links them to existing database records.
 * 
 * Usage:
 *   ts-node scripts/migrate-users-to-supabase.ts
 * 
 * IMPORTANT: 
 * - Backup your database before running this script
 * - This script will create users in Supabase Auth
 * - Existing users will need to reset their passwords if they don't have one set
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function migrateUsers() {
  console.log('🚀 Starting user migration to Supabase Auth...\n');

  try {
    // Get all users from database
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
    });

    console.log(`📊 Found ${users.length} active users to migrate\n`);

    if (users.length === 0) {
      console.log('✅ No users to migrate');
      return;
    }

    // Ask for confirmation
    const answer = await question(
      `⚠️  This will create ${users.length} users in Supabase Auth. Continue? (yes/no): `
    );

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Migrate each user
    for (const user of users) {
      try {
        console.log(`\n📝 Migrating user: ${user.email}...`);

        // Check if user already exists in Supabase Auth
        const { data: existingUser } = await supabase.auth.admin.getUserById(
          user.id
        );

        if (existingUser?.user) {
          console.log(`   ⚠️  User already exists in Supabase Auth, skipping...`);
          continue;
        }

        // Generate a temporary password if user has no password
        // Users will need to reset their password after migration
        const tempPassword =
          user.password && user.password.length > 0
            ? undefined // Will need to be handled separately - Supabase doesn't accept hashed passwords
            : `TempPass${Date.now()}${Math.random().toString(36).substring(7)}`;

        // Create user in Supabase Auth
        const {
          data: { user: supabaseUser },
          error: authError,
        } = await supabase.auth.admin.createUser({
          email: user.email,
          password: tempPassword || undefined,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            roles: user.roles.map((r) => r.toString()),
            migrated: true,
            migratedAt: new Date().toISOString(),
          },
        });

        if (authError || !supabaseUser) {
          throw new Error(authError?.message || 'Failed to create user in Supabase');
        }

        // Update user record with Supabase ID if different
        if (supabaseUser.id !== user.id) {
          // This is a complex case - we'd need to update all foreign keys
          // For now, we'll log a warning
          console.log(
            `   ⚠️  Warning: Supabase user ID (${supabaseUser.id}) differs from database ID (${user.id})`
          );
          console.log(
            `   ⚠️  You may need to manually update foreign key references`
          );
        }

        // Update user record to remove password (Supabase handles it now)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: null, // Clear password - Supabase handles it
          },
        });

        if (tempPassword) {
          console.log(
            `   ⚠️  Temporary password generated. User must reset password.`
          );
        }

        console.log(`   ✅ Successfully migrated: ${user.email}`);
        successCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error migrating ${user.email}: ${errorMessage}`);
        errors.push({ email: user.email, error: errorMessage });
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary');
    console.log('='.repeat(50));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(({ email, error }) => {
        console.log(`   - ${email}: ${error}`);
      });
    }

    if (successCount > 0) {
      console.log(
        '\n⚠️  IMPORTANT: Users with temporary passwords must reset their passwords.'
      );
      console.log(
        '   Consider sending password reset emails to all migrated users.'
      );
    }

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Run migration
migrateUsers().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});


