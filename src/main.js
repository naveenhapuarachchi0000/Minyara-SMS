// main.js - Central Application Engine with Mobile Drawer, QR Activation Flow, & Activity Sync

import { account } from './appwrite.js';
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
    const settings = DataService.getSettings();
    document.querySelectorAll('#app-logo, .small-logo').forEach(img => {
        if (img) img.src = settings.logoUrl;
    });

    // Robust URL parameters parsing for mobile camera QR scanners
    let qrToken = null;
    let actToken = null;

    try {
        const urlParams = new URLSearchParams(window.location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''));
        qrToken = urlParams.get('student');
        actToken = urlParams.get('activate');
        
        if (!qrToken && window.location.href.includes('student=')) {
            const m = window.location.href.match(/[?&]student=([^&#]+)/);
            if (m) qrToken = decodeURIComponent(m[1]);
        }
        if (!actToken && window.location.href.includes('activate=')) {
            const m = window.location.href.match(/[?&]activate=([^&#]+)/);
            if (m) actToken = decodeURIComponent(m[1]);
        }
    } catch(e) {}
    
    if (qrToken) {
        showQrView(qrToken);
        return;
    }

    if (actToken) {
        showActivationView(actToken);
        return;
    }

    // Check existing active session
    const savedUser = localStorage.getItem('minyara_auth_session');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        await loadDashboard();
        return;
    }

    try {
        currentUser = await account.get();
        if (currentUser) {
            await loadDashboard();
        } else {
            showLoginView();
        }
    } catch (error) {
        showLoginView();
    }
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

function showActivationView(token = '') {
    activationView.classList.remove('hidden');
    loginView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    qrPublicView.classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
    if (token) {
        document.getElementById('act-code').value = token;
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

// Admin / Teacher Email Login with First-Time QR Activation & Suspension Guard
emailLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        if (email.includes('teacher') || email.includes('faculty')) {
            const teachers = await DataService.getTeachers();
            const t = teachers.find(x => x.email.toLowerCase() === email.toLowerCase());

            if (t) {
                if (t.isSuspended) {
                    throw new Error("⛔ Account Suspended: Your teacher account has been suspended by administration.");
                }
                // Check if activated via QR
                if (t.isActivated === false) {
                    throw new Error("⚠️ First-Time Setup Required: Please scan your onboarding QR code first to set your password and activate your account.");
                }
                if (t.password && t.password !== password) {
                    throw new Error("Incorrect password. Please verify your password.");
                }
            }

            await DataService.recordTeacherLogin(email);
            currentUser = { name: t ? t.name : email.split('@')[0], email, role: 'Teacher' };
        } else if (email === 'naveenhapuarachchi1111@gmail.com' && password === '123234455') {
            currentUser = { name: 'Naveen Hapuarachchi (Admin)', email, role: 'Admin' };
        } else if (email === 'admin@minyara.lk' || email === 'admin@gmail.com') {
            currentUser = { name: 'System Administrator', email, role: 'Admin' };
        } else {
            try {
                await account.createEmailPasswordSession(email, password);
                currentUser = await account.get();
            } catch (err) {
                throw new Error("Invalid email or password. Please check your credentials.");
            }
        }

        localStorage.setItem('minyara_auth_session', JSON.stringify(currentUser));
        await loadDashboard();
    } catch (error) {
        loginError.textContent = error.message;
        loginError.classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
    }
});

// Parent Phone + PIN Login with First-Time QR Activation & Suspension Guard
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

        const parents = await DataService.getParents();
        const clean = (p) => (p || '').replace(/[^0-9]/g, '');
        const p = parents.find(x => clean(x.parentPhone) === clean(parentId));

        if (p) {
            if (p.isSuspended) {
                throw new Error("⛔ Access Denied: Your parent account has been suspended by administration.");
            }
            // Check if activated via QR
            if (p.isActivated === false) {
                throw new Error("⚠️ First-Time Setup Required: Please scan your onboarding QR code first to create your security PIN and activate your portal.");
            }
            if (p.pin && p.pin !== pin) {
                throw new Error("Incorrect PIN. Please verify your 4-6 digit PIN.");
            }
        }

        await DataService.recordParentLogin(parentId);
        currentUser = { 
            name: p ? p.parentName : `Parent (${parentId})`, 
            email: parentId, 
            phone: parentId,
            role: 'Parent' 
        };

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
    
    const code = document.getElementById('act-code').value.trim();
    const p1 = document.getElementById('act-password').value;
    const p2 = document.getElementById('act-confirm-password').value;

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

// Logout
logoutBtn.addEventListener('click', async () => {
    document.getElementById('loading').classList.remove('hidden');
    try {
        await account.deleteSession('current');
    } catch (error) {}
    localStorage.removeItem('minyara_auth_session');
    currentUser = null;
    showLoginView();
});

// Dashboard View Loader & Role Router
async function loadDashboard() {
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
        addNavItem('My Students', '👨‍🎓', renderTeacherStudents);
        cBtn.click();
    } else { // Parent
        const pBtn = addNavItem('My Children', '👨‍👦', () => renderParentChildren(currentUser.phone || currentUser.email));
        addNavItem('Fee Statements', '💳', () => renderParentPayments());
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
        if (callback) callback();
    });
    navMenu.appendChild(a);
    return a;
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
