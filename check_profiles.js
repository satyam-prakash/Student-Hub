import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
let env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfiles() {
    console.log('Checking for profiles table...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.log('Error accessing profiles table:', error.message);
        // 42P01 is "relation does not exist"
        if (error.code === '42P01') {
            console.log('Result: Profiles table does not exist.');
        } else {
            console.log('Result: Error accessing table (might exist but have policy issues).');
        }
    } else {
        console.log('Result: Profiles table exists.');
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Table exists but is empty. Cannot determine columns from data.');
        }
    }
}

checkProfiles();

