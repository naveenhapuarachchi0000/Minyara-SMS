// scripts/testSupabase.js - Test Supabase Connectivity and Tables
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env manually for node script if dotenv not installed
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const val = parts.slice(1).join('=').trim();
                    if (key && !process.env[key]) {
                        process.env[key] = val;
                    }
                }
            });
        }
    } catch (e) {}
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

console.log('--- Supabase Connection Verification ---');
console.log('Target URL:', url);
console.log('Target Key:', key ? `${key.substring(0, 10)}...` : 'Not Set');

if (url.includes('placeholder') || url.includes('your-project')) {
    console.log('\n[INFO] Placeholder Supabase credentials detected.');
    console.log('To connect to your live Supabase cloud database:');
    console.log('1. Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    console.log('2. Execute the scripts/supabase_schema.sql in your Supabase SQL Editor');
    console.log('3. Run `node scripts/testSupabase.js` again to verify.\n');
    process.exit(0);
}

const supabase = createClient(url, key);

async function runTest() {
    try {
        console.log('\n1. Testing query on "settings" table...');
        const { data: settings, error: sErr } = await supabase.from('settings').select('*').limit(1);
        if (sErr) {
            console.error('❌ Settings query failed:', sErr.message);
        } else {
            console.log('✅ Settings query successful! Records found:', settings?.length || 0);
        }

        console.log('\n2. Testing query on "students" table...');
        const { data: students, error: stErr } = await supabase.from('students').select('*').limit(5);
        if (stErr) {
            console.error('❌ Students query failed:', stErr.message);
        } else {
            console.log('✅ Students query successful! Students found:', students?.length || 0);
        }

        console.log('\n3. Testing query on "classes" table...');
        const { data: classes, error: cErr } = await supabase.from('classes').select('*').limit(5);
        if (cErr) {
            console.error('❌ Classes query failed:', cErr.message);
        } else {
            console.log('✅ Classes query successful! Classes found:', classes?.length || 0);
        }

        console.log('\n🎉 All Supabase tests completed!');
    } catch (err) {
        console.error('❌ Unexpected error during Supabase test:', err.message);
    }
}

runTest();
