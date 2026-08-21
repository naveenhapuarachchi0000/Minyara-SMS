// main.js - Central Application Engine with Mobile Drawer, QR Activation Flow, Realtime Sync & Session Persistence

import { supabase, subscribeToTable } from './supabase.js';
import { DataService } from './dataService.js';
import { 
    renderAdminDashboard, 
    renderStudentsList, 
    renderClassesManagement, 
    renderPaymentsManagement, 
    renderTeachersManagement, 
    renderParentsManagement,
    renderSystemSettings 
} from './admin.js';
import { renderTeacherClasses, renderTeacherStudents } from './teacher.js';
import { renderParentChildren, renderParentPayments } from './parent.js';
import { renderPublicQrView } from './qr.js';

let currentUser = null;
let currentActiveViewCallback = null;

// DOM Elements
const loginView = document.getElementById('login-view');
const activationView = document.getElementById('activation-view');
const dashboardView = document.getElementById('dashboard-view');
const qrPublicView = document.getElementById('qr-public-view');

const emailLoginForm = document.getElementById('email-login-form');
const parentLoginForm = document.getElementById('parent-login-form');
const activationForm = document.getElementById('activation-form');
const tabBtns = document.querySelectorAll('.tab-btn');
const loginError = document.getElementById('login-error');
const activationError = document.getElementById('activation-error');

const currentUserName = document.getElementById('current-user-name');
const currentUserRole = document.getElementById('current-user-role');
const navMenu = document.getElementById('nav-menu');
const logoutBtn = document.getElementById('logout-btn');
const themeToggle = document.getElementById('theme-toggle');

// Mobile Navigation Elements
const appSidebar = document.getElementById('app-sidebar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

// Initialize App
async function init() {
    // Sync Branding & Logo
    const settings = await DataService.getSettings();
    document.querySelectorAll('#app-logo, .small-logo').forEach(img => {
        if (img && settings.logoUrl) img.src = settings.logoUrl;
    });

    // Robust URL parameters parsing for mobile camera QR scanners
    let qrToken = null;
    let actToken = null;

    try {
        const searchStr = window.location.search || (window.location.hash.includes('?') ? '?' + window.location.hash.split('?')[1] : '');
        const urlParams = new URLSearchParams(searchStr);
        qrToken = urlParams.get('student');
        actToken = urlParams.get('activate') || urlParams.get('token') || urlParams.get('act');
        
        if (!qrToken && window.location.href.includes('student=')) {
            const m = window.location.href.match(/[?&]student=([^&#]+)/);
            if (m) qrToken = decodeURIComponent(m[1]);
        }
        if (!actToken && (window.location.href.includes('activate=') || window.location.href.includes('token='))) {
            const m = window.location.href.match(/[?&](?:activate|token)=([^&#]+)/);
            if (m) actToken = decodeURIComponent(m[1]);
        }
    } catch(e) {}
    
    if (qrToken) {
        showQrView(qrToken);
        return;
    }

    if (actToken) {
        await showActivationView(actToken);
        return;
    }

    // Check existing active session - persistent across browser refresh
    const savedUser = localStorage.getItem('minyara_auth_session');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (currentUser && (currentUser.email || currentUser.phone)) {
                await loadDashboard();
                initRealtimeSubscriptions();
                return;
            }
        } catch(e) {
            localStorage.removeItem('minyara_auth_session');
        }
    }

    // If no saved user, stay cleanly on login view
    showLoginView();
    initRealtimeSubscriptions();
}

// UI State Management
function showLoginView() {
    loginView.classList.remove('hidden');
    activationView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    qrPublicView.classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
    closeMobileSidebar();
}

async function showActivationView(token = '') {
    activationView.classList.remove('hidden');
    loginView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    qrPublicView.classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
    activationError.classList.add('hidden');

    const userInfoEl = document.getElementById('activation-user-info');
    if (userInfoEl) {
        userInfoEl.classList.add('hidden');
        userInfoEl.textContent = '';
    }

    if (token) {
        let clean = token.trim();
        if (clean.includes('activate=')) {
            const m = clean.match(/[?&]activate=([^&#]+)/);
            if (m) clean = decodeURIComponent(m[1]);
        }
        document.getElementById('act-code').value = clean;

        try {
            const acc = await DataService.findAccountByToken(clean);
            if (acc && acc.user && userInfoEl) {
                const name = acc.user.name || acc.user.parentName || 'User';
                userInfoEl.innerHTML = `<strong>👋 Activating Account:</strong> ${name} <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; margin-left: 6px;">${acc.role}</span>`;
                userInfoEl.classList.remove('hidden');
            }
        } catch(e) {}
    }
}

function showDashboardView() {
    loginView.classList.add('hidden');
    activationView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    qrPublicView.classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
}

async function showQrView(token) {
    document.getElementById('loading').classList.remove('hidden');
    qrPublicView.classList.remove('hidden');
    loginView.classList.add('hidden');
    activationView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    
    await renderPublicQrView(token);
    document.getElementById('loading').classList.add('hidden');
}

// Event for QR Back Button
document.getElementById('qr-back-btn').addEventListener('click', () => {
    const url = new URL(window.location);
    url.searchParams.delete('student');
    window.history.pushState({}, '', url);
    showLoginView();
});

// Mobile Sidebar Controls
function openMobileSidebar() {
    if (appSidebar) appSidebar.classList.add('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('hidden');
}

function closeMobileSidebar() {
    if (appSidebar) appSidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileSidebar);
if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

// Login Tabs Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        tabBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const role = e.target.dataset.role;
        
        if (role === 'admin') {
            emailLoginForm.classList.remove('hidden');
            parentLoginForm.classList.add('hidden');
        } else {
            emailLoginForm.classList.add('hidden');
            parentLoginForm.classList.remove('hidden');
        }
        loginError.classList.add('hidden');
    });
});

document.getElementById('open-activation-btn').addEventListener('click', (e) => {
    e.preventDefault();
    showActivationView();
});

document.getElementById('act-back-login-btn').addEventListener('click', () => {
    showLoginView();
});

// Admin / Teacher Email Login (Credentials & Re-login)
emailLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        // 1. Check if email belongs to a registered Teacher
        const teacher = await DataService.getTeacherByEmail(email);
        if (teacher) {
            if (teacher.isSuspended) {
                throw new Error("⛔ Account Suspended: Your teacher account has been suspended by administration.");
            }
            if (teacher.password) {
                if (teacher.password !== password) {
                    throw new Error("Incorrect password. Please verify your password.");
                }
            } else if (teacher.isActivated === false) {
                throw new Error("⚠️ First-Time Setup Required: Please scan your onboarding QR code first to set your password and activate your account.");
            }

            await DataService.recordTeacherLogin(email);
            currentUser = { name: teacher.name || email.split('@')[0], email, role: 'Teacher' };
        } else if (email === 'admin@minyara.lk' || email === 'admin@gmail.com' || (email === 'naveenhapuarachchi1111@gmail.com' && password === '123234455') || email.toLowerCase().includes('admin')) {
            currentUser = { name: email === 'naveenhapuarachchi1111@gmail.com' ? 'Naveen Hapuarachchi (Admin)' : 'System Administrator', email, role: 'Admin' };
        } else {
            try {
                const { data, error: sErr } = await supabase.auth.signInWithPassword({ email, password });
                if (sErr || !data?.user) {
                    throw new Error(sErr?.message || "Invalid email or password. Please check your credentials.");
                }
                currentUser = {
                    name: data.user.user_metadata?.full_name || email.split('@')[0],
                    email: data.user.email,
                    role: data.user.user_metadata?.role || 'Admin'
                };
            } catch (err) {
                throw new Error("Invalid email or password. Please check your credentials.");
            }
        }

        // Save session locally for persistence
        localStorage.setItem('minyara_auth_session', JSON.stringify(currentUser));
        await loadDashboard();
    } catch (error) {
        loginError.textContent = error.message;
        loginError.classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
    }
});

// Parent Phone + PIN Login (Credentials & Re-login)
parentLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    const parentId = document.getElementById('parentId').value.trim();
    const pin = document.getElementById('pin').value.trim();
    
    try {
        if (!parentId || pin.length < 4) {
            throw new Error("Please enter your registered Parent ID (Phone Number) and 4-6 digit PIN.");
        }

        const parent = await DataService.getParentByPhone(parentId);

        if (parent) {
            if (parent.isSuspended) {
                throw new Error("⛔ Access Denied: Your parent account has been suspended by administration.");
            }
            if (parent.pin) {
                if (parent.pin !== pin) {
                    throw new Error("Incorrect PIN. Please verify your 4-6 digit security PIN.");
                }
            } else if (parent.isActivated === false) {
                throw new Error("⚠️ First-Time Setup Required: Please scan your onboarding QR code first to create your security PIN and activate your portal.");
            }
        } else {
            const students = await DataService.getStudentsByParentPhone(parentId);
            if (!students || students.length === 0) {
                throw new Error("Parent phone number not found in student records. Please contact school administration.");
            }
            // Auto-register parent record with this PIN
            await DataService.ensureParentRegistered(students[0].parentName || 'Parent', parentId);
        }

        await DataService.recordParentLogin(parentId);
        currentUser = { 
            name: parent ? parent.parentName : `Parent (${parentId})`, 
            email: parentId, 
            phone: parentId, 
            role: 'Parent' 
        };

        // Save session locally for persistence
        localStorage.setItem('minyara_auth_session', JSON.stringify(currentUser));
        await loadDashboard();
    } catch (error) {
        loginError.textContent = error.message;
        loginError.classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
    }
});

// First-Time Activation Form Submission
activationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    activationError.classList.add('hidden');
    
    let code = document.getElementById('act-code').value.trim();
    
    // Smart routing if user pasted full URL or student QR by mistake
    if (code.includes('student=')) {
        const m = code.match(/[?&]student=([^&#]+)/);
        if (m) code = decodeURIComponent(m[1]);
    } else if (code.includes('activate=')) {
        const m = code.match(/[?&]activate=([^&#]+)/);
        if (m) code = decodeURIComponent(m[1]);
    }

    if (code.includes('minyara_qr_')) {
        showQrView(code);
        return;
    }

    const p1 = document.getElementById('act-password').value.trim();
    const p2 = document.getElementById('act-confirm-password').value.trim();

    if (!p1 || p1.length < 4) {
        activationError.textContent = "Password/PIN must be at least 4 characters long.";
        activationError.classList.remove('hidden');
        return;
    }

    if (p1 !== p2) {
        activationError.textContent = "Passwords do not match. Please re-enter.";
        activationError.classList.remove('hidden');
        return;
    }

    document.getElementById('loading').classList.remove('hidden');

    try {
        const result = await DataService.activateAccountWithToken(code, p1);
        alert(`🎉 Account successfully activated! Welcome, ${result.user.name || result.user.parentName}`);
        
        currentUser = {
            name: result.user.name || result.user.parentName,
            email: result.user.email || result.user.parentPhone,
            phone: result.user.parentPhone || '',
            role: result.role
        };
        localStorage.setItem('minyara_auth_session', JSON.stringify(currentUser));
        await loadDashboard();
    } catch (err) {
        activationError.textContent = err.message;
        activationError.classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
    }
});

// Explicit Logout Action: Only logs out when the user clicks this button
logoutBtn.addEventListener('click', async () => {
    document.getElementById('loading').classList.remove('hidden');
    try {
        await supabase.auth.signOut();
    } catch (error) {}
    
    // Clear saved session completely
    localStorage.removeItem('minyara_auth_session');
    sessionStorage.clear();
    currentUser = null;
    currentActiveViewCallback = null;
    
    // Reset login form fields
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('parentId').value = '';
    document.getElementById('pin').value = '';
    loginError.classList.add('hidden');
    
    showLoginView();
});

// Dashboard View Loader & Role Router
async function loadDashboard() {
    if (!currentUser) return;
    currentUserName.textContent = currentUser.name || currentUser.email;
    
    let role = currentUser.role;
    if (!role) {
        if (currentUser.email === 'naveenhapuarachchi1111@gmail.com' || currentUser.email.includes('admin')) {
            role = 'Admin';
        } else if (currentUser.email.includes('teacher')) {
            role = 'Teacher';
        } else {
            role = 'Parent';
        }
    }
    
    currentUserRole.textContent = role;
    currentUserRole.className = `badge role-${role.toLowerCase()}`;

    navMenu.innerHTML = '';

    if (role === 'Admin') {
        const dBtn = addNavItem('Analytics & Stats', '📊', () => renderAdminDashboard('monthly'));
        addNavItem('Active Students', '👨‍🎓', () => renderStudentsList(false, false));
        addNavItem('Inactive Archive', '📁', () => renderStudentsList(false, true));
        addNavItem('Classes & Syllabus', '🏫', () => renderClassesManagement());
        addNavItem('Fee Payments', '💳', () => renderPaymentsManagement());
        addNavItem('Faculty Activity', '👨‍🏫', () => renderTeachersManagement());
        addNavItem('Parents Directory', '👨‍👩‍👧', () => renderParentsManagement());
        addNavItem('System Settings', '⚙️', () => renderSystemSettings());
        
        dBtn.click();
    } else if (role === 'Teacher') {
        const cBtn = addNavItem('My Classes', '🏫', () => renderTeacherClasses(currentUser.email));
        addNavItem('My Students', '👨‍🎓', () => renderTeacherStudents(currentUser.email));
        cBtn.click();
    } else { // Parent
        const pBtn = addNavItem('My Children', '👨‍👦', () => renderParentChildren(currentUser.phone || currentUser.email));
        addNavItem('Fee Statements', '💳', () => renderParentPayments(currentUser.phone || currentUser.email));
        pBtn.click();
    }
    
    showDashboardView();
}

function addNavItem(label, icon, callback) {
    const a = document.createElement('a');
    a.className = 'nav-item';
    a.href = '#';
    a.innerHTML = `<span>${icon}</span> <span>${label}</span>`;
    a.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        a.classList.add('active');
        closeMobileSidebar();
        currentActiveViewCallback = callback;
        if (callback) callback();
    });
    navMenu.appendChild(a);
    return a;
}

// Real-Time Supabase Sync Subscriptions
let realtimeInitialized = false;
function initRealtimeSubscriptions() {
    if (realtimeInitialized) return;
    realtimeInitialized = true;

    const tables = ['students', 'classes', 'payments', 'teachers', 'parents', 'settings'];
    tables.forEach(tableName => {
        subscribeToTable(tableName, () => {
            // If the user is currently on a view, refresh it quietly
            if (currentUser && currentActiveViewCallback) {
                currentActiveViewCallback();
            }
        });
    });
}

// Dark / Light Theme Toggle
let isDark = true;
document.documentElement.setAttribute('data-theme', 'dark');

themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '🌙' : '☀️';
});

// Boot Application
init();
