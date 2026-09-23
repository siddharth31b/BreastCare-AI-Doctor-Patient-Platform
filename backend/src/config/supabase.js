const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('[Supabase] Client initialized successfully.');
  } catch (err) {
    console.warn('[Supabase] Initialization failed, running in fallback mode:', err.message);
  }
} else {
  console.log('[Supabase] Credentials not configured in .env. Using mock/in-memory repository for local development.');
}

module.exports = supabase;
