// scripts/setupSupabase.js - Automated Database Setup & Seed Tool for Minyara SMS
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log('================================================================');
console.log('⚡ MINYARA SMS - SUPABASE DATABASE MANAGEMENT CLI');
console.log('================================================================');
console.log(`Target Supabase URL: ${url || 'Not configured'}`);

if (!url || !key || url.includes('placeholder') || url.includes('your-project')) {
    console.log('\n[!] Supabase credentials are not yet set in .env');
    console.log('👉 Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
    console.log('👉 Run scripts/supabase_schema.sql in your Supabase SQL Editor.');
    process.exit(0);
}

const supabase = createClient(url, key);

async function seedData() {
    console.log('\n--- 1. Seeding Settings ---');
    const { error: setErr } = await supabase.from('settings').upsert({
        id: 'default_settings',
        app_name: 'Minyara SMS',
        institution_name: 'Minyara Academy Sri Lanka',
        logo_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80',
        primary_color: '#6366f1',
        currency: 'LKR (Rs.)',
        address: 'No. 45, Galle Road, Colombo 03, Sri Lanka',
        contact_phone: '+94 11 234 5678',
        email: 'info@minyara.lk'
    });
    if (setErr) console.warn('Settings warning:', setErr.message);
    else console.log('✅ Settings synced.');

    console.log('\n--- 2. Seeding Classes ---');
    const classes = [
        { id: 'cls_101', class_name: 'Cambridge IGCSE Mathematics', syllabus: 'Cambridge', grade: 'Grade 11', teacher_name: 'Dr. Ruwan Wickramasinghe', fee: 5500 },
        { id: 'cls_102', class_name: 'Edexcel International GCSE Physics', syllabus: 'Edexcel', grade: 'Grade 11', teacher_name: 'Prof. Samantha Dias', fee: 6000 },
        { id: 'cls_103', class_name: 'National O/L Science & Chemistry', syllabus: 'National', grade: 'Grade 11', teacher_name: 'Mr. Asoka Perera', fee: 4200 },
        { id: 'cls_104', class_name: 'Cambridge A/L Combined Mathematics', syllabus: 'Cambridge', grade: 'Grade 13 (A/L)', teacher_name: 'Dr. Ruwan Wickramasinghe', fee: 7500 },
        { id: 'cls_105', class_name: 'Edexcel A/L Biology & Genetics', syllabus: 'Edexcel', grade: 'Grade 12 (AS/AL)', teacher_name: 'Dr. Nilmini Fernando', fee: 7000 }
    ];
    for (const c of classes) {
        await supabase.from('classes').upsert(c);
    }
    console.log(`✅ ${classes.length} Classes synced.`);

    console.log('\n--- 3. Seeding Teachers ---');
    const teachers = [
        { id: 'tch_101', name: 'Dr. Ruwan Wickramasinghe', email: 'teacher.ruwan@minyara.lk', phone: '+94 77 112 3344', subject: 'Cambridge Mathematics', password: 'pass123', is_activated: true, activation_token: 'ACT-TCH-RUWAN', is_suspended: false, has_logged_in: true, last_login: '2026-08-21 08:30' },
        { id: 'tch_102', name: 'Prof. Samantha Dias', email: 'teacher.samantha@minyara.lk', phone: '+94 71 223 4455', subject: 'Edexcel Physics', password: 'pass123', is_activated: true, activation_token: 'ACT-TCH-SAMANTHA', is_suspended: false, has_logged_in: false, last_login: 'Never' },
        { id: 'tch_103', name: 'Mr. Asoka Perera', email: 'teacher.asoka@minyara.lk', phone: '+94 78 334 5566', subject: 'National Science', password: '', is_activated: false, activation_token: 'ACT-TCH-ASOKA8', is_suspended: false, has_logged_in: false, last_login: 'Never' }
    ];
    for (const t of teachers) {
        await supabase.from('teachers').upsert(t);
    }
    console.log(`✅ ${teachers.length} Teachers synced.`);

    console.log('\n--- 4. Seeding Parents ---');
    const parents = [
        { id: 'par_101', parent_name: 'Mr. Nimal Perera', parent_phone: '0771234567', pin: '1234', is_activated: true, activation_token: 'ACT-PAR-NIMAL1', is_suspended: false, has_logged_in: true, last_login: '2026-08-21 09:15' },
        { id: 'par_102', parent_name: 'Mrs. Chandani Silva', parent_phone: '0719876543', pin: '5678', is_activated: true, activation_token: 'ACT-PAR-CHAND2', is_suspended: false, has_logged_in: false, last_login: 'Never' },
        { id: 'par_103', parent_name: 'Mr. Sunil Gunaratne', parent_phone: '0785556677', pin: '', is_activated: false, activation_token: 'ACT-PAR-SUNIL3', is_suspended: false, has_logged_in: false, last_login: 'Never' }
    ];
    for (const p of parents) {
        await supabase.from('parents').upsert(p);
    }
    console.log(`✅ ${parents.length} Parents synced.`);

    console.log('\n--- 5. Seeding Students ---');
    const students = [
        { id: 'std_101', full_name: 'Kasun Perera', grade: 'Grade 11', dob: '2008-04-15', age: 16, join_date: '2026-08-21', school: 'Royal College Colombo', parent_name: 'Mr. Nimal Perera', parent_phone: '0771234567', parent_phone_optional: '0771234568', syllabus: 'Cambridge', is_active: true, qr_code_token: 'minyara_qr_kasun01', enrolled_class_ids: ['cls_101', 'cls_102'] },
        { id: 'std_102', full_name: 'Ananya Silva', grade: 'Grade 11', dob: '2008-09-20', age: 16, join_date: '2026-08-21', school: 'Visakha Vidyalaya', parent_name: 'Mrs. Chandani Silva', parent_phone: '0719876543', parent_phone_optional: '', syllabus: 'Edexcel', is_active: true, qr_code_token: 'minyara_qr_ananya02', enrolled_class_ids: ['cls_102', 'cls_105'] },
        { id: 'std_103', full_name: 'Dineth Gunaratne', grade: 'Grade 11', dob: '2008-02-10', age: 16, join_date: '2026-08-21', school: 'Ananda College', parent_name: 'Mr. Sunil Gunaratne', parent_phone: '0785556677', parent_phone_optional: '', syllabus: 'National', is_active: true, qr_code_token: 'minyara_qr_dineth03', enrolled_class_ids: ['cls_103'] },
        { id: 'std_104', full_name: 'Tharushi Fernando', grade: 'Grade 13 (A/L)', dob: '2006-11-05', age: 18, join_date: '2026-08-21', school: 'Ladies College Colombo', parent_name: 'Mr. Nimal Perera', parent_phone: '0771234567', parent_phone_optional: '', syllabus: 'Cambridge', is_active: true, qr_code_token: 'minyara_qr_tharushi04', enrolled_class_ids: ['cls_101', 'cls_104'] }
    ];
    for (const s of students) {
        await supabase.from('students').upsert(s);
    }
    console.log(`✅ ${students.length} Students synced.`);

    console.log('\n--- 6. Seeding Payments ---');
    const payments = [
        { id: 'pay_101', student_id: 'std_101', student_name: 'Kasun Perera', class_id: 'cls_101', class_name: 'Cambridge IGCSE Mathematics', receipt_no: 'REC-2026-1001', month: 'August 2026', amount: 5500, status: 'Paid' },
        { id: 'pay_102', student_id: 'std_101', student_name: 'Kasun Perera', class_id: 'cls_102', class_name: 'Edexcel International GCSE Physics', receipt_no: 'REC-2026-1002', month: 'August 2026', amount: 6000, status: 'Paid' },
        { id: 'pay_103', student_id: 'std_102', student_name: 'Ananya Silva', class_id: 'cls_102', class_name: 'Edexcel International GCSE Physics', receipt_no: 'REC-2026-1003', month: 'August 2026', amount: 6000, status: 'Paid' },
        { id: 'pay_104', student_id: 'std_103', student_name: 'Dineth Gunaratne', class_id: 'cls_103', class_name: 'National O/L Science & Chemistry', receipt_no: 'REC-2026-1004', month: 'August 2026', amount: 4200, status: 'Pending' },
        { id: 'pay_105', student_id: 'std_104', student_name: 'Tharushi Fernando', class_id: 'cls_104', class_name: 'Cambridge A/L Combined Mathematics', receipt_no: 'REC-2026-1005', month: 'August 2026', amount: 7500, status: 'Paid' }
    ];
    for (const pay of payments) {
        await supabase.from('payments').upsert(pay);
    }
    console.log(`✅ ${payments.length} Payments synced.`);

    console.log('\n🎉 Supabase Database Setup & Seed Completed Successfully!');
}

seedData().catch(err => {
    console.error('Setup error:', err.message);
});
