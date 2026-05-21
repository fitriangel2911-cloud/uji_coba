const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join('=').trim();
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.warn("Could not read .env.local file:", e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  console.log("Connecting to Supabase at:", supabaseUrl);
  
  // Try to query common tables to see if they exist
  const commonTables = [
    'users', 'profiles', 'mosques', 'masjid', 'members', 'anggota',
    'savings', 'simpanan', 'loans', 'pembiayaan', 'pinjaman',
    'transactions', 'transaksi', 'audit_logs', 'activity_logs', 'biaya_operasional'
  ];
  
  console.log("\nTesting common table existence:");
  for (const table of commonTables) {
    try {
      const { data, error, status } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Table '${table}' does not exist (relation does not exist).`);
        } else {
          console.log(`⚠️ Table '${table}' returned error code ${error.code}: ${error.message}`);
        }
      } else {
        console.log(`✅ Table '${table}' EXISTS! Status: ${status}, Data count checked: ${data.length}`);
      }
    } catch (err) {
      console.log(`🚨 Table '${table}' failed:`, err.message);
    }
  }
}

inspect();
