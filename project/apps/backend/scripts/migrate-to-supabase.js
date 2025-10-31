/**
 * Automated migration script to replace Prisma with Supabase
 * 
 * This script performs bulk replacements across the codebase.
 * 
 * WARNING: Always backup your code before running this script!
 * Review the changes carefully after running.
 */

const fs = require('fs');
const path = require('path');

const BACKEND_SRC = path.join(__dirname, '../src');

// Patterns to replace
const replacements = [
  // Import statements
  {
    pattern: /import\s*{\s*PrismaService\s*}\s*from\s*['"]\.\.\/\.\.\/database\/prisma\.service['"]/g,
    replacement: "import { SupabaseService } from '../../database/supabase.service'",
  },
  {
    pattern: /import\s*{\s*PrismaService\s*}\s*from\s*['"]\.\.\/database\/prisma\.service['"]/g,
    replacement: "import { SupabaseService } from '../database/supabase.service'",
  },
  
  // Constructor injection
  {
    pattern: /constructor\s*\(\s*private\s+prisma:\s*PrismaService\s*\)/g,
    replacement: 'constructor(private supabase: SupabaseService)',
  },
  {
    pattern: /constructor\s*\(\s*private\s*prisma:\s*PrismaService\s*\)/g,
    replacement: 'constructor(private supabase: SupabaseService)',
  },
  
  // Module providers
  {
    pattern: /providers:\s*\[\s*(\w+Service),\s*PrismaService\s*\]/g,
    replacement: 'providers: [$1]',
  },
  {
    pattern: /providers:\s*\[\s*PrismaService,\s*(\w+Service)\s*\]/g,
    replacement: 'providers: [$1]',
  },
  
  // Module imports
  {
    pattern: /imports:\s*\[\s*(\w+Module),\s*PrismaService\s*\]/g,
    replacement: 'imports: [$1, DatabaseModule]',
  },
  {
    pattern: /imports:\s*\[\s*PrismaService,\s*(\w+Module)\s*\]/g,
    replacement: 'imports: [DatabaseModule, $1]',
  },
  
  // Add DatabaseModule import if not present
  {
    pattern: /import\s*{\s*Module\s*}\s*from\s*['"]@nestjs\/common['"];/g,
    replacement: `import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';`,
  },
];

// Common Prisma query patterns (these need manual review!)
const queryReplacements = [
  // Note: These are commented out because they're too complex for automated replacement
  // You should migrate queries manually using MIGRATION_PATTERNS.md as a guide
];

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply replacements
    for (const { pattern, replacement } of replacements) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${path.relative(BACKEND_SRC, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Find all TypeScript files in src directory recursively
 */
function findFiles(dir = BACKEND_SRC, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Main migration function
 */
function migrate() {
  console.log('🚀 Starting Prisma → Supabase migration...\n');
  
  const files = findFiles();
  console.log(`📁 Found ${files.length} TypeScript files\n`);
  
  let updatedCount = 0;
  
  for (const file of files) {
    if (processFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n✨ Migration complete!`);
  console.log(`📊 Updated ${updatedCount} files`);
  console.log(`\n⚠️  IMPORTANT: Review all changes and manually migrate Prisma queries to Supabase queries.`);
  console.log(`📖 See MIGRATION_PATTERNS.md for query conversion patterns.\n`);
}

// Run migration
if (require.main === module) {
  try {
    migrate();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

module.exports = { migrate, processFile };

