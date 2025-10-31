/**
 * Script to generate Supabase TypeScript types
 * 
 * Usage:
 *   node scripts/generate-supabase-types.js
 * 
 * Requires:
 *   - SUPABASE_ACCESS_TOKEN environment variable
 *   - SUPABASE_PROJECT_ID environment variable (or pass as argument)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env file if it exists
function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          let value = trimmedLine.substring(equalIndex + 1).trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          // Only set if not already in process.env
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

// Load .env file
loadEnvFile();

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || process.argv[2] || 'ndlmoratednxrcdzekgc';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable is not set.');
  console.log('\n📝 To fix this:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Click your profile → Account Settings → Access Tokens');
  console.log('3. Generate a new token');
  console.log('4. Run: $env:SUPABASE_ACCESS_TOKEN="your-token"');
  console.log('5. Then run this script again\n');
  process.exit(1);
}

const OUTPUT_FILE = path.join(__dirname, '../src/database/types/database.types.ts');

console.log(`🔄 Generating TypeScript types for project: ${PROJECT_ID}`);

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_ID}/types/typescript`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      // Ensure the directory exists
      const dir = path.dirname(OUTPUT_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the types to file
      fs.writeFileSync(OUTPUT_FILE, data, 'utf8');
      console.log(`✅ Types generated successfully!`);
      console.log(`📁 Saved to: ${OUTPUT_FILE}`);
    } else {
      console.error(`❌ Error: ${res.statusCode} ${res.statusMessage}`);
      console.error('Response:', data);
      if (res.statusCode === 401) {
        console.log('\n💡 Your access token might be invalid. Generate a new one from:');
        console.log('   https://app.supabase.com → Account Settings → Access Tokens');
      }
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.end();

