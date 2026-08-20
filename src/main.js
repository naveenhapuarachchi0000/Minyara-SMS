// main.js - Central Controller, Authentication, Suspension Guard & Navigation

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
const dashboardView = document.getElementById('dashboard-view');
const qrPublicView = document.getElementById('qr-public-view');

const emailLoginForm = document.getElementById('email-login-form');
const parentLoginForm = document.getElementById('parent-login-form');
const tabBtns = document.querySelectorAll('.tab-btn');
const loginError = document.getElementById('login-error');

const currentUserName = document.getElementById('current-user-name');
const currentUserRole = document.getElementById('current-user-role');
const navMenu = document.getElementById('nav-menu');
const logoutBtn = document.getElementById('logout-btn');
const themeToggle = document.getElementById('theme-toggle');

// Initialize App
async function init() {
    // Sync Branding & Logo
    const settings = DataService.getSettings();
    document.querySelectorAll('#app-logo, .small-logo').forEach(img => {
        if (img) img.src = settings.logoUrl;
    });

    // Check URL parameters for QR scan view
    const urlParams = new URLSearchParams(window.location.search);
    const qrToken = urlParams.get('student');
    
    if (qrToken) {
        showQrView(qrToken);
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
    dashboardView.classList.add('hidden');
    qrPublicView.classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
}

function showDashboardView() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    qrPublicView.classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
}

async function showQrView(token) {
    document.getElementById('loading').classList.remove('hidden');
    qrPublicView.classList.remove('hidden');
    loginView.classList.add('hidden');
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

// Admin / Teacher Email Login with Suspension Verification
emailLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        // Check Teacher Suspension
        if (email.includes('teacher') || email.includes('faculty')) {
            const teachers = await DataService.getTeachers();
            const t = teachers.find(x => x.email.toLowerCase() === email.toLowerCase());
            if (t && t.isSuspended) {
                throw new Error("⛔ Account Suspended: Your teacher account has been suspended by administration.");
            }
            await DataService.recordTeacherLogin(email);
            currentUser = { name: t ? t.name : email.split('@')[0], email, role: 'Teacher' };
        } else if (email === 'naveenhapuarachchi1111@gmail.com' && password === '123234455') {
            currentUser = { name: 'Naveen Hapuarachchi (Admin)', email, role: 'Admin' };
        } else if (email === 'admin@minyara.lk' || email === 'admin@gmail.com') {
            currentUser = { name: 'System Administrator', email, role: 'Admin' };
        } else {
            // Attempt Appwrite Authentication
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

// Parent Phone + PIN Login with Suspension Verification
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

        if (p && p.isSuspended) {
            throw new Error("⛔ Access Denied: Your parent account has been suspended by administration.");
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
        addNavItem('Fee History', '💳', () => renderParentPayments());
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
        if (callback) callback();
    });
    navMenu.appendChild(a);
    return a;
}

// Dark / Light Theme Toggle with instant select options contrast update
let isDark = true;
document.documentElement.setAttribute('data-theme', 'dark');

themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '🌙' : '☀️';
});

// Boot Application
init();
