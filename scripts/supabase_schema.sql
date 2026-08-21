-- ==============================================================================
-- MINYARA SMS - SUPABASE POSTGRESQL DATABASE SCHEMA & SEED DATA
-- Sri Lanka's Best Student Management System
-- ==============================================================================

-- 1. DROP EXISTING TABLES (IF RESETTING)
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
-- DROP TABLE IF EXISTS classes CASCADE;
-- DROP TABLE IF EXISTS teachers CASCADE;
-- DROP TABLE IF EXISTS parents CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;

-- ------------------------------------------------------------------------------
-- 2. SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'default_settings',
    app_name TEXT DEFAULT 'Minyara SMS',
    institution_name TEXT DEFAULT 'Minyara Academy Sri Lanka',
    logo_url TEXT DEFAULT 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80',
    primary_color TEXT DEFAULT '#6366f1',
    currency TEXT DEFAULT 'LKR (Rs.)',
    address TEXT DEFAULT 'No. 45, Galle Road, Colombo 03, Sri Lanka',
    contact_phone TEXT DEFAULT '+94 11 234 5678',
    email TEXT DEFAULT 'info@minyara.lk',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. CLASSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    class_name TEXT NOT NULL,
    syllabus TEXT NOT NULL,
    grade TEXT DEFAULT 'Grade 11',
    teacher_name TEXT DEFAULT '',
    fee NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. STUDENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    grade TEXT DEFAULT 'Grade 11',
    dob TEXT,
    age INTEGER DEFAULT 16,
    join_date TEXT DEFAULT '2026-08-21',
    school TEXT,
    parent_name TEXT,
    parent_phone TEXT NOT NULL,
    parent_phone_optional TEXT,
    syllabus TEXT DEFAULT 'Cambridge',
    is_active BOOLEAN DEFAULT TRUE,
    qr_code_token TEXT UNIQUE,
    enrolled_class_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON students(parent_phone);
CREATE INDEX IF NOT EXISTS idx_students_qr_token ON students(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_students_syllabus ON students(syllabus);

-- ------------------------------------------------------------------------------
-- 5. PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT,
    class_id TEXT,
    class_name TEXT,
    receipt_no TEXT NOT NULL,
    month TEXT DEFAULT 'August 2026',
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'Paid',
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_class_id ON payments(class_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_no ON payments(receipt_no);

-- ------------------------------------------------------------------------------
-- 6. TEACHERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    subject TEXT,
    password TEXT,
    is_activated BOOLEAN DEFAULT FALSE,
    activation_token TEXT UNIQUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    has_logged_in BOOLEAN DEFAULT FALSE,
    last_login TEXT DEFAULT 'Never',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_act_token ON teachers(activation_token);

-- ------------------------------------------------------------------------------
-- 7. PARENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parents (
    id TEXT PRIMARY KEY,
    parent_name TEXT NOT NULL,
    parent_phone TEXT UNIQUE NOT NULL,
    pin TEXT,
    is_activated BOOLEAN DEFAULT FALSE,
    activation_token TEXT UNIQUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    has_logged_in BOOLEAN DEFAULT FALSE,
    last_login TEXT DEFAULT 'Never',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parents_phone ON parents(parent_phone);
CREATE INDEX IF NOT EXISTS idx_parents_act_token ON parents(activation_token);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted anonymous & authenticated access for SMS client
CREATE POLICY "Allow all access on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on classes" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on teachers" ON teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on parents" ON parents FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 9. INITIAL SEED DATA
-- ------------------------------------------------------------------------------

-- Default Settings
INSERT INTO settings (id, app_name, institution_name, logo_url, primary_color, currency, address, contact_phone, email)
VALUES (
    'default_settings',
    'Minyara SMS',
    'Minyara Academy Sri Lanka',
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80',
    '#6366f1',
    'LKR (Rs.)',
    'No. 45, Galle Road, Colombo 03, Sri Lanka',
    '+94 11 234 5678',
    'info@minyara.lk'
)
ON CONFLICT (id) DO UPDATE SET
    institution_name = EXCLUDED.institution_name,
    address = EXCLUDED.address,
    contact_phone = EXCLUDED.contact_phone;

-- Sample Classes
INSERT INTO classes (id, class_name, syllabus, grade, teacher_name, fee) VALUES
('cls_101', 'Cambridge IGCSE Mathematics', 'Cambridge', 'Grade 11', 'Dr. Ruwan Wickramasinghe', 5500),
('cls_102', 'Edexcel International GCSE Physics', 'Edexcel', 'Grade 11', 'Prof. Samantha Dias', 6000),
('cls_103', 'National O/L Science & Chemistry', 'National', 'Grade 11', 'Mr. Asoka Perera', 4200),
('cls_104', 'Cambridge A/L Combined Mathematics', 'Cambridge', 'Grade 13 (A/L)', 'Dr. Ruwan Wickramasinghe', 7500),
('cls_105', 'Edexcel A/L Biology & Genetics', 'Edexcel', 'Grade 12 (AS/AL)', 'Dr. Nilmini Fernando', 7000)
ON CONFLICT (id) DO NOTHING;

-- Sample Teachers
INSERT INTO teachers (id, name, email, phone, subject, password, is_activated, activation_token, is_suspended, has_logged_in, last_login) VALUES
('tch_101', 'Dr. Ruwan Wickramasinghe', 'teacher.ruwan@minyara.lk', '+94 77 112 3344', 'Cambridge Mathematics', 'pass123', true, 'ACT-TCH-RUWAN', false, true, '2026-08-21 08:30'),
('tch_102', 'Prof. Samantha Dias', 'teacher.samantha@minyara.lk', '+94 71 223 4455', 'Edexcel Physics', 'pass123', true, 'ACT-TCH-SAMANTHA', false, false, 'Never'),
('tch_103', 'Mr. Asoka Perera', 'teacher.asoka@minyara.lk', '+94 78 334 5566', 'National Science', '', false, 'ACT-TCH-ASOKA8', false, false, 'Never')
ON CONFLICT (id) DO NOTHING;

-- Sample Parents
INSERT INTO parents (id, parent_name, parent_phone, pin, is_activated, activation_token, is_suspended, has_logged_in, last_login) VALUES
('par_101', 'Mr. Nimal Perera', '0771234567', '1234', true, 'ACT-PAR-NIMAL1', false, true, '2026-08-21 09:15'),
('par_102', 'Mrs. Chandani Silva', '0719876543', '5678', true, 'ACT-PAR-CHAND2', false, false, 'Never'),
('par_103', 'Mr. Sunil Gunaratne', '0785556677', '', false, 'ACT-PAR-SUNIL3', false, false, 'Never')
ON CONFLICT (id) DO NOTHING;

-- Sample Students
INSERT INTO students (id, full_name, grade, dob, age, join_date, school, parent_name, parent_phone, parent_phone_optional, syllabus, is_active, qr_code_token, enrolled_class_ids) VALUES
('std_101', 'Kasun Perera', 'Grade 11', '2008-04-15', 16, '2026-08-21', 'Royal College Colombo', 'Mr. Nimal Perera', '0771234567', '0771234568', 'Cambridge', true, 'minyara_qr_kasun01', '["cls_101", "cls_102"]'::jsonb),
('std_102', 'Ananya Silva', 'Grade 11', '2008-09-20', 16, '2026-08-21', 'Visakha Vidyalaya', 'Mrs. Chandani Silva', '0719876543', '', 'Edexcel', true, 'minyara_qr_ananya02', '["cls_102", "cls_105"]'::jsonb),
('std_103', 'Dineth Gunaratne', 'Grade 11', '2008-02-10', 16, '2026-08-21', 'Ananda College', 'Mr. Sunil Gunaratne', '0785556677', '', 'National', true, 'minyara_qr_dineth03', '["cls_103"]'::jsonb),
('std_104', 'Tharushi Fernando', 'Grade 13 (A/L)', '2006-11-05', 18, '2026-08-21', 'Ladies College Colombo', 'Mr. Nimal Perera', '0771234567', '', 'Cambridge', true, 'minyara_qr_tharushi04', '["cls_101", "cls_104"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Sample Payments
INSERT INTO payments (id, student_id, student_name, class_id, class_name, receipt_no, month, amount, status, date) VALUES
('pay_101', 'std_101', 'Kasun Perera', 'cls_101', 'Cambridge IGCSE Mathematics', 'REC-2026-1001', 'August 2026', 5500, 'Paid', NOW() - INTERVAL '2 days'),
('pay_102', 'std_101', 'Kasun Perera', 'cls_102', 'Edexcel International GCSE Physics', 'REC-2026-1002', 'August 2026', 6000, 'Paid', NOW() - INTERVAL '1 day'),
('pay_103', 'std_102', 'Ananya Silva', 'cls_102', 'Edexcel International GCSE Physics', 'REC-2026-1003', 'August 2026', 6000, 'Paid', NOW() - INTERVAL '3 days'),
('pay_104', 'std_103', 'Dineth Gunaratne', 'cls_103', 'National O/L Science & Chemistry', 'REC-2026-1004', 'August 2026', 4200, 'Pending', NOW()),
('pay_105', 'std_104', 'Tharushi Fernando', 'cls_104', 'Cambridge A/L Combined Mathematics', 'REC-2026-1005', 'August 2026', 7500, 'Paid', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;
