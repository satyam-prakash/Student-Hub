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

async function checkColumn(columnName) {
    console.log(`Checking column: ${columnName}...`);
    const { data, error } = await supabase
        .from('profiles')
        .select(columnName)
        .limit(1);

    if (error) {
        console.log(`❌ Error accessing '${columnName}':`, error.message);
        return false;
    } else {
        console.log(`✅ Column '${columnName}' exists.`);
        return true;
    }
}

async function inspect() {
    console.log('Inspecting profiles table schema...');

    await checkColumn('id');
    await checkColumn('email');
    await checkColumn('full_name');
    await checkColumn('registration_number');
    await checkColumn('avatar_url');
}

inspect();
