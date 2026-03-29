import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile(regNo) {
    console.log(`\n=== Checking Profile for Reg No: ${regNo} ===\n`);

    // Check profiles table
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('registration_number', regNo);

    if (profileError) {
        console.error('❌ Error fetching profiles:', profileError);
    } else {
        console.log(`Found ${profiles.length} profile(s):`);
        if (profiles.length > 0) {
            profiles.forEach((p, i) => {
                console.log(`\nProfile ${i + 1}:`);
                console.log(`  ID: ${p.id}`);
                console.log(`  Email: ${p.email}`);
                console.log(`  Full Name: ${p.full_name}`);
                console.log(`  Reg No: ${p.registration_number}`);
            });
        } else {
            console.log('  (No profiles found)');
        }
    }

    // Also check if legacy email format exists in auth
    const legacyEmail = `${regNo.toLowerCase()}@cgpa.app`;
    console.log(`\n=== Checking if legacy email exists: ${legacyEmail} ===`);
    console.log('(Note: Cannot query auth.users directly from client, but login will try this)');
}

// Get reg no from command line or use default
const regNo = process.argv[2] || '12325579';
checkProfile(regNo);
