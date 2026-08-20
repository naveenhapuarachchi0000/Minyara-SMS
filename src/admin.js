// admin.js - Full Administration Control & Analytics for Minyara SMS

import { DataService } from './dataService.js';

const contentArea = document.getElementById('content-area');

// --- 1. Admin Analytics & Overview Dashboard (Daily, Weekly, Monthly, Yearly) ---
export async function renderAdminDashboard(selectedTimeframe = 'monthly') {
    document.getElementById('page-title').textContent = "Analytics & System Overview";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const analytics = await DataService.getAnalyticsData(selectedTimeframe);
    const settings = DataService.getSettings();
    const students = await DataService.getStudents(false);
    const payments = await DataService.getPayments();

    // Generate SVG Bar Chart
    const maxVal = Math.max(...analytics.trendValues, 1000);
    const chartBars = analytics.trendValues.map((val, i) => {
        const heightPct = Math.round((val / maxVal) * 160);
        return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 60px;">
                <span style="font-size: 11px; font-weight: 700; color: #10b981;">Rs. ${Number(val).toLocaleString()}</span>
                <div style="width: 100%; max-width: 44px; height: 180px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: flex-end; padding: 4px;">
                    <div style="width: 100%; height: ${heightPct}px; background: linear-gradient(180deg, #6366f1, #10b981); border-radius: 6px; transition: height 0.4s ease;"></div>
                </div>
                <span style="font-size: 12px; color: var(--text-secondary); text-align: center;">${analytics.trendLabels[i]}</span>
            </div>
        `;
    }).join('');

    contentArea.innerHTML = `
        <!-- Top Institution Banner -->
        <div class="card glass flex-between" style="flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <img src="${settings.logoUrl}" alt="Logo" class="institute-logo-preview" style="width: 56px; height: 56px; border-radius: 14px; object-fit: cover; border: 2px solid var(--primary-color);">
                <div>
                    <h2 style="font-size: 22px; font-weight: 800;">${settings.institutionName}</h2>
                    <p style="color: var(--text-secondary); font-size: 13px;">🇱🇰 Sri Lankan Best Student Management System • Active From <strong>08/21/2026 Onwards</strong></p>
                </div>
            </div>
            <div class="flex" style="gap: 10px;">
                <button id="btn-quick-settings" class="btn secondary small">⚙️ System Settings</button>
            </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px;">
            <div class="card glass metric-card">
                <span class="metric-icon">👨‍🎓</span>
                <div class="metric-info">
                    <p class="metric-label">Active Students</p>
                    <h2 class="metric-value" style="color: var(--primary-color);">${analytics.activeStudentsCount}</h2>
                    <span class="metric-sub">${analytics.inactiveStudentsCount} Inactive Records</span>
                </div>
            </div>

            <div class="card glass metric-card">
                <span class="metric-icon">🏫</span>
                <div class="metric-info">
                    <p class="metric-label">Active Classes</p>
                    <h2 class="metric-value" style="color: var(--secondary-color);">${analytics.classesCount}</h2>
                    <span class="metric-sub">Cambridge / Edexcel / National</span>
                </div>
            </div>

            <div class="card glass metric-card">
                <span class="metric-icon">💳</span>
                <div class="metric-info">
                    <p class="metric-label">Total Fee Revenue</p>
                    <h2 class="metric-value" style="color: #10b981;">Rs. ${Number(analytics.totalRevenue).toLocaleString()}</h2>
                    <span class="metric-sub">${payments.length} Logged Transactions</span>
                </div>
            </div>

            <div class="card glass metric-card">
                <span class="metric-icon">📊</span>
                <div class="metric-info">
                    <p class="metric-label">Syllabus Count</p>
                    <h2 class="metric-value" style="color: #f59e0b;">3</h2>
                    <span class="metric-sub">Cambridge • Edexcel • National</span>
                </div>
            </div>
        </div>

        <!-- Interactive Revenue Trend Chart (Daily / Weekly / Monthly / Yearly) -->
        <div class="card glass mb-4">
            <div class="card-header flex-between" style="flex-wrap: wrap; gap: 12px;">
                <div>
                    <h3>📈 Revenue & Fee Collection Trends</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">View historical and projected fee collection breakdown (08/21/2026 onwards).</p>
                </div>
                
                <!-- Timeframe Filter Buttons -->
                <div class="flex" style="gap: 6px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 8px;">
                    <button class="btn small ${selectedTimeframe === 'daily' ? 'primary' : 'secondary'} timeframe-btn" data-time="daily">Daily</button>
                    <button class="btn small ${selectedTimeframe === 'weekly' ? 'primary' : 'secondary'} timeframe-btn" data-time="weekly">Weekly</button>
                    <button class="btn small ${selectedTimeframe === 'monthly' ? 'primary' : 'secondary'} timeframe-btn" data-time="monthly">Monthly</button>
                    <button class="btn small ${selectedTimeframe === 'yearly' ? 'primary' : 'secondary'} timeframe-btn" data-time="yearly">Yearly</button>
                </div>
            </div>

            <!-- Visual Bar Chart -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-top: 24px; padding-top: 10px; overflow-x: auto; min-height: 240px;">
                ${chartBars}
            </div>
        </div>

        <!-- Curriculum & Status Breakdown Graphs -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
            <!-- Syllabus Distribution -->
            <div class="card glass">
                <div class="card-header">
                    <h3>📚 Student Curriculum Share</h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 18px; margin-top: 12px;">
                    <div>
                        <div class="flex-between mb-1" style="font-size: 13.5px; font-weight: 600;">
                            <span>Cambridge Curriculum</span>
                            <span style="color: #6366f1;">${analytics.cambridgeCount} Students</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.08); height: 10px; border-radius: 6px; overflow: hidden;">
                            <div style="background: #6366f1; height: 100%; width: ${students.length ? (analytics.cambridgeCount / students.length) * 100 : 0}%;"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex-between mb-1" style="font-size: 13.5px; font-weight: 600;">
                            <span>Edexcel Curriculum</span>
                            <span style="color: #ec4899;">${analytics.edexcelCount} Students</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.08); height: 10px; border-radius: 6px; overflow: hidden;">
                            <div style="background: #ec4899; height: 100%; width: ${students.length ? (analytics.edexcelCount / students.length) * 100 : 0}%;"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex-between mb-1" style="font-size: 13.5px; font-weight: 600;">
                            <span>National Syllabus (Sri Lanka)</span>
                            <span style="color: #10b981;">${analytics.nationalCount} Students</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.08); height: 10px; border-radius: 6px; overflow: hidden;">
                            <div style="background: #10b981; height: 100%; width: ${students.length ? (analytics.nationalCount / students.length) * 100 : 0}%;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Fee Clearance -->
            <div class="card glass">
                <div class="card-header flex-between">
                    <h3>💳 Recent Fee Collections</h3>
                    <button id="btn-goto-payments" class="btn small secondary">All Payments</button>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Month</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.slice(0, 4).map(p => `
                            <tr>
                                <td><strong>${p.studentName || 'Student'}</strong></td>
                                <td>${p.month || 'Current'}</td>
                                <td>Rs. ${Number(p.amount).toLocaleString()}</td>
                                <td><span class="status-badge status-${(p.status || 'paid').toLowerCase()}">${p.status}</span></td>
                            </tr>
                        `).join('') || '<tr><td colspan="4">No payments recorded.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Attach Timeframe Switchers
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            renderAdminDashboard(e.target.dataset.time);
        });
    });

    document.getElementById('btn-quick-settings').addEventListener('click', () => {
        renderSystemSettings();
    });

    document.getElementById('btn-goto-payments').addEventListener('click', () => {
        renderPaymentsManagement();
    });
}

// --- 2. Students Management (Active vs Inactive, Full CRUD, QR View) ---
export async function renderStudentsList(openAddModal = false, showInactiveOnly = false) {
    document.getElementById('page-title').textContent = showInactiveOnly ? "Inactive Students Archive" : "Active Students Management";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const allStudents = await DataService.getStudents(false);
    let students = showInactiveOnly ? allStudents.filter(s => s.isActive === false) : allStudents.filter(s => s.isActive !== false);

    const renderTable = (list) => {
        if (!list.length) {
            return `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-secondary);">No ${showInactiveOnly ? 'inactive' : 'active'} students found.</td></tr>`;
        }
        return list.map(s => `
            <tr>
                <td>
                    <div style="font-weight: 700; color: var(--text-primary);">${s.fullName}</div>
                    <small style="color: var(--text-secondary);">${s.school || 'School N/A'} • Age: ${s.age || 'N/A'}</small>
                </td>
                <td>
                    <span class="badge" style="background: ${s.syllabus === 'Cambridge' ? 'rgba(99, 102, 241, 0.2)' : s.syllabus === 'Edexcel' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${s.syllabus === 'Cambridge' ? '#818cf8' : s.syllabus === 'Edexcel' ? '#f472b6' : '#34d399'};">
                        ${s.syllabus}
                    </span>
                </td>
                <td>
                    <div>${s.parentName || 'Parent'}</div>
                    <small style="color: var(--text-secondary);">${s.parentPhone} ${s.parentPhoneOptional ? ` / ${s.parentPhoneOptional}` : ''}</small>
                </td>
                <td>
                    <label class="toggle-switch" title="Toggle active/inactive status">
                        <input type="checkbox" class="student-active-toggle" data-id="${s.$id || s.id}" ${s.isActive !== false ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                    <span style="font-size: 12px; margin-left: 6px; font-weight: 700; color: ${s.isActive !== false ? '#10b981' : '#ef4444'};">
                        ${s.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="btn small primary view-qr-btn" data-token="${s.qrCodeToken}" data-name="${s.fullName}" title="View Student QR Code">📱 QR Code</button>
                    <button class="btn small secondary edit-student-btn" data-id="${s.$id || s.id}">✏️ Edit</button>
                    <button class="btn small secondary delete-student-btn" style="color: var(--error-color);" data-id="${s.$id || s.id}">🗑️</button>
                </td>
            </tr>
        `).join('');
    };

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between" style="flex-wrap: wrap; gap: 12px;">
                <div>
                    <h3>${showInactiveOnly ? 'Inactive Students Archive' : 'Active Students Directory'}</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">
                        ${showInactiveOnly 
                            ? 'Students with un-ticked status are safely isolated from class lists and payment tabs.' 
                            : 'Students with active ticks are displayed in classes and ongoing payment rosters.'}
                    </p>
                </div>
                <div class="flex" style="gap: 10px;">
                    ${!showInactiveOnly ? `
                        <button id="btn-open-add-student" class="btn primary">➕ Register New Student</button>
                        <button id="btn-show-inactive-tab" class="btn secondary">📁 Inactive Archive (${allStudents.filter(s => s.isActive === false).length})</button>
                    ` : `
                        <button id="btn-show-active-tab" class="btn primary">⬅️ Back to Active Students</button>
                    `}
                </div>
            </div>

            <!-- Filters & Search -->
            <div class="flex" style="gap: 12px; margin-top: 16px; flex-wrap: wrap;">
                <input type="text" id="student-search-input" placeholder="🔍 Search name, parent phone, school..." style="max-width: 340px; flex: 1;">
                <select id="syllabus-filter-select" style="max-width: 200px;">
                    <option value="ALL">All Syllabuses</option>
                    <option value="Cambridge">Cambridge</option>
                    <option value="Edexcel">Edexcel</option>
                    <option value="National">National (Sri Lanka)</option>
                </select>
            </div>

            <table class="data-table mt-4">
                <thead>
                    <tr>
                        <th>Student & School</th>
                        <th>Syllabus</th>
                        <th>Parent Contacts</th>
                        <th>Active Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="students-table-body">
                    ${renderTable(students)}
                </tbody>
            </table>
        </div>

        <!-- Add / Edit Student Modal -->
        <div id="student-modal" class="overlay ${openAddModal ? '' : 'hidden'} flex-center">
            <div class="glass modal-box" style="width: 100%; max-width: 580px; padding: 30px; position: relative; max-height: 90vh; overflow-y: auto;">
                <button id="close-student-modal" class="icon-btn" style="position: absolute; right: 15px; top: 15px;">✖</button>
                <h3 id="student-modal-title">Register New Student</h3>
                <form id="student-form" class="auth-form" style="margin-top: 20px;">
                    <input type="hidden" id="form-student-id">
                    
                    <div class="input-group">
                        <label>Student Full Name *</label>
                        <input type="text" id="s-fullName" required placeholder="e.g. Kasun Malinda Perera">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="input-group">
                            <label>Date of Birth (DOB) *</label>
                            <input type="date" id="s-dob" required>
                        </div>
                        <div class="input-group">
                            <label>Age *</label>
                            <input type="number" id="s-age" required placeholder="e.g. 16">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="input-group">
                            <label>Join Date *</label>
                            <input type="date" id="s-joinDate" required value="2026-08-21">
                        </div>
                        <div class="input-group">
                            <label>Syllabus *</label>
                            <select id="s-syllabus" required>
                                <option value="Cambridge">Cambridge Syllabus</option>
                                <option value="Edexcel">Edexcel Syllabus</option>
                                <option value="National">National Syllabus (Sri Lanka)</option>
                            </select>
                        </div>
                    </div>

                    <div class="input-group">
                        <label>School Name *</label>
                        <input type="text" id="s-school" required placeholder="e.g. Ananda College, Colombo">
                    </div>

                    <div class="input-group">
                        <label>Parent / Guardian Name *</label>
                        <input type="text" id="s-parentName" required placeholder="e.g. Sunil Perera">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="input-group">
                            <label>Primary Phone (Parent ID) *</label>
                            <input type="tel" id="s-parentPhone" required placeholder="e.g. 0771234567">
                        </div>
                        <div class="input-group">
                            <label>Optional 2nd Phone</label>
                            <input type="tel" id="s-parentPhoneOptional" placeholder="e.g. 0719876543">
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                        <input type="checkbox" id="s-isActive" checked style="width: 20px; height: 20px;">
                        <label for="s-isActive" style="font-weight: 600; cursor: pointer;">Active Student (Tick to include in ongoing classes & payments)</label>
                    </div>

                    <button type="submit" id="btn-save-student-submit" class="btn primary mt-4">Save Student Record</button>
                </form>
            </div>
        </div>

        <!-- Student QR Modal -->
        <div id="student-qr-modal" class="overlay hidden flex-center">
            <div class="glass modal-box" style="width: 100%; max-width: 440px; padding: 30px; text-align: center; position: relative;">
                <button id="close-qr-modal" class="icon-btn" style="position: absolute; right: 15px; top: 15px;">✖</button>
                <h3 id="qr-modal-student-name">Student QR Code</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin: 8px 0 16px;">
                    Scan with any smartphone camera to check full student details & fee clearance instantly without logging in!
                </p>
                <div id="modal-qrcode-target" style="background: white; padding: 16px; border-radius: 12px; display: inline-block;"></div>
                
                <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 10px;">
                    <a id="modal-qr-link" href="#" target="_blank" class="btn primary small">🔗 Open Direct Web View</a>
                </div>
            </div>
        </div>
    `;

    // Auto-calculate age from DOB
    document.getElementById('s-dob').addEventListener('change', (e) => {
        if (e.target.value) {
            const birthDate = new Date(e.target.value);
            const diff = Date.now() - birthDate.getTime();
            const ageDate = new Date(diff);
            const calcAge = Math.abs(ageDate.getUTCFullYear() - 1970);
            document.getElementById('s-age').value = calcAge || '';
        }
    });

    // Search and Filter logic
    const searchInput = document.getElementById('student-search-input');
    const syllabusSelect = document.getElementById('syllabus-filter-select');
    const filterAndRender = () => {
        const query = searchInput.value.toLowerCase().trim();
        const syl = syllabusSelect.value;
        const filtered = students.filter(s => {
            const matchQuery = !query || 
                (s.fullName || '').toLowerCase().includes(query) ||
                (s.parentPhone || '').includes(query) ||
                (s.school || '').toLowerCase().includes(query) ||
                (s.parentName || '').toLowerCase().includes(query);
            const matchSyl = syl === 'ALL' || s.syllabus === syl;
            return matchQuery && matchSyl;
        });
        document.getElementById('students-table-body').innerHTML = renderTable(filtered);
        attachRowEvents();
    };

    searchInput.addEventListener('input', filterAndRender);
    syllabusSelect.addEventListener('change', filterAndRender);

    const studentModal = document.getElementById('student-modal');
    const openAddBtn = document.getElementById('btn-open-add-student');
    if (openAddBtn) {
        openAddBtn.addEventListener('click', () => {
            document.getElementById('student-form').reset();
            document.getElementById('form-student-id').value = '';
            document.getElementById('student-modal-title').textContent = 'Register New Student';
            document.getElementById('s-isActive').checked = true;
            studentModal.classList.remove('hidden');
        });
    }

    const inactiveTabBtn = document.getElementById('btn-show-inactive-tab');
    if (inactiveTabBtn) {
        inactiveTabBtn.addEventListener('click', () => renderStudentsList(false, true));
    }

    const activeTabBtn = document.getElementById('btn-show-active-tab');
    if (activeTabBtn) {
        activeTabBtn.addEventListener('click', () => renderStudentsList(false, false));
    }

    document.getElementById('close-student-modal').addEventListener('click', () => {
        studentModal.classList.add('hidden');
    });

    document.getElementById('student-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-save-student-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const id = document.getElementById('form-student-id').value;
        const studentPayload = {
            fullName: document.getElementById('s-fullName').value,
            dob: document.getElementById('s-dob').value,
            age: parseInt(document.getElementById('s-age').value) || 0,
            joinDate: document.getElementById('s-joinDate').value,
            syllabus: document.getElementById('s-syllabus').value,
            school: document.getElementById('s-school').value,
            parentName: document.getElementById('s-parentName').value,
            parentPhone: document.getElementById('s-parentPhone').value,
            parentPhoneOptional: document.getElementById('s-parentPhoneOptional').value,
            isActive: document.getElementById('s-isActive').checked
        };

        if (id) {
            await DataService.updateStudent(id, studentPayload);
            alert('Student record updated successfully!');
        } else {
            await DataService.addStudent(studentPayload);
            alert('New student registered successfully!');
        }

        studentModal.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Student Record';
        renderStudentsList(false, showInactiveOnly);
    });

    const attachRowEvents = () => {
        document.querySelectorAll('.student-active-toggle').forEach(chk => {
            chk.addEventListener('change', async (e) => {
                await DataService.toggleStudentActive(e.target.dataset.id, e.target.checked);
                renderStudentsList(false, showInactiveOnly);
            });
        });

        document.querySelectorAll('.view-qr-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const token = btn.dataset.token;
                const sName = btn.dataset.name;
                const targetUrl = `${window.location.origin}${window.location.pathname}?student=${token}`;

                document.getElementById('qr-modal-student-name').textContent = `${sName} - QR Code`;
                const qrTarget = document.getElementById('modal-qrcode-target');
                qrTarget.innerHTML = '';
                
                new QRCode(qrTarget, {
                    text: targetUrl,
                    width: 200,
                    height: 200
                });

                document.getElementById('modal-qr-link').href = targetUrl;
                document.getElementById('student-qr-modal').classList.remove('hidden');
            });
        });

        document.querySelectorAll('.edit-student-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const s = await DataService.getStudentById(btn.dataset.id);
                if (s) {
                    document.getElementById('form-student-id').value = s.$id || s.id;
                    document.getElementById('s-fullName').value = s.fullName || '';
                    document.getElementById('s-dob').value = s.dob || '';
                    document.getElementById('s-age').value = s.age || '';
                    document.getElementById('s-joinDate').value = s.joinDate || '';
                    document.getElementById('s-syllabus').value = s.syllabus || 'Cambridge';
                    document.getElementById('s-school').value = s.school || '';
                    document.getElementById('s-parentName').value = s.parentName || '';
                    document.getElementById('s-parentPhone').value = s.parentPhone || '';
                    document.getElementById('s-parentPhoneOptional').value = s.parentPhoneOptional || '';
                    document.getElementById('s-isActive').checked = s.isActive !== false;

                    document.getElementById('student-modal-title').textContent = 'Edit Student Record';
                    studentModal.classList.remove('hidden');
                }
            });
        });

        document.querySelectorAll('.delete-student-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this student record?')) {
                    await DataService.deleteStudent(btn.dataset.id);
                    renderStudentsList(false, showInactiveOnly);
                }
            });
        });
    };

    document.getElementById('close-qr-modal').addEventListener('click', () => {
        document.getElementById('student-qr-modal').classList.add('hidden');
    });

    attachRowEvents();
}

// --- 3. Classes Management ---
export async function renderClassesManagement(openAddModal = false) {
    document.getElementById('page-title').textContent = "Classes & Syllabus Management";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const classes = await DataService.getClasses();
    const teachers = await DataService.getTeachers();

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between" style="flex-wrap: wrap; gap: 12px;">
                <div>
                    <h3>Classes & Curriculums</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">Manage course offerings across Cambridge, Edexcel, and National syllabus.</p>
                </div>
                <button id="btn-open-add-class" class="btn primary">➕ Create New Class</button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-top: 20px;">
                ${classes.map(c => `
                    <div class="card glass" style="border-top: 4px solid ${c.syllabus === 'Cambridge' ? '#6366f1' : c.syllabus === 'Edexcel' ? '#ec4899' : '#10b981'};">
                        <div class="flex-between">
                            <span class="badge" style="background: rgba(255,255,255,0.1);">${c.syllabus}</span>
                            <span style="font-weight: 700; color: #10b981;">Rs. ${Number(c.fee || 0).toLocaleString()} /mo</span>
                        </div>
                        <h3 style="margin: 12px 0 6px; font-size: 18px;">${c.className}</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">👨‍🏫 Teacher: <strong>${c.teacherName || 'Assigned Faculty'}</strong></p>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Add Class Modal -->
        <div id="class-modal" class="overlay ${openAddModal ? '' : 'hidden'} flex-center">
            <div class="glass modal-box" style="width: 100%; max-width: 480px; padding: 30px; position: relative;">
                <button id="close-class-modal" class="icon-btn" style="position: absolute; right: 15px; top: 15px;">✖</button>
                <h3>Create New Class</h3>
                <form id="class-form" class="auth-form" style="margin-top: 20px;">
                    <div class="input-group">
                        <label>Class / Subject Title *</label>
                        <input type="text" id="c-name" required placeholder="e.g. Cambridge Grade 11 Physics">
                    </div>
                    <div class="input-group">
                        <label>Syllabus *</label>
                        <select id="c-syllabus" required>
                            <option value="Cambridge">Cambridge</option>
                            <option value="Edexcel">Edexcel</option>
                            <option value="National">National (Sri Lanka)</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Monthly Fee (LKR) *</label>
                        <input type="number" id="c-fee" required placeholder="e.g. 4500">
                    </div>
                    <div class="input-group">
                        <label>Assign Teacher *</label>
                        <select id="c-teacher" required>
                            ${teachers.map(t => `<option value="${t.name}">${t.name} (${t.subject || 'Teacher'})</option>`).join('')}
                        </select>
                    </div>
                    <button type="submit" class="btn primary mt-4">Create Class</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('btn-open-add-class').addEventListener('click', () => {
        document.getElementById('class-modal').classList.remove('hidden');
    });
    document.getElementById('close-class-modal').addEventListener('click', () => {
        document.getElementById('class-modal').classList.add('hidden');
    });

    document.getElementById('class-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await DataService.addClass({
            className: document.getElementById('c-name').value,
            syllabus: document.getElementById('c-syllabus').value,
            fee: Number(document.getElementById('c-fee').value) || 0,
            teacherName: document.getElementById('c-teacher').value
        });
        alert('Class created successfully!');
        document.getElementById('class-modal').classList.add('hidden');
        renderClassesManagement();
    });
}

// --- 4. Payments Tracking & Printable Official Receipt (Clean Black Text) ---
export async function renderPaymentsManagement(openRecordModal = false) {
    document.getElementById('page-title').textContent = "Fee & Payments Tracking";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const payments = await DataService.getPayments();
    const activeStudents = await DataService.getStudents(true);
    const classes = await DataService.getClasses();

    const renderTable = (list) => {
        if (!list.length) return '<tr><td colspan="6" style="text-align:center; padding: 25px;">No payment records found.</td></tr>';
        return list.map(p => `
            <tr>
                <td><strong>${p.receiptNo || 'REC-N/A'}</strong></td>
                <td>
                    <div style="font-weight: 700;">${p.studentName || 'Student'}</div>
                    <small style="color: var(--text-secondary);">${p.className || 'Class Fee'}</small>
                </td>
                <td>${p.month || 'Current'}</td>
                <td><strong>Rs. ${Number(p.amount).toLocaleString()}</strong></td>
                <td><span class="status-badge status-${(p.status || 'paid').toLowerCase()}">${p.status}</span></td>
                <td>
                    <button class="btn small secondary print-receipt-btn" data-receipt="${p.receiptNo}" data-student="${p.studentName}" data-amount="${p.amount}" data-month="${p.month}" data-status="${p.status}" data-class="${p.className || 'Class Fee'}">📄 View & Print Receipt</button>
                </td>
            </tr>
        `).join('');
    };

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between" style="flex-wrap: wrap; gap: 12px;">
                <div>
                    <h3>Student Fee Collection Records</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">Manage tuition fees with instant official receipts.</p>
                </div>
                <button id="btn-open-payment-modal" class="btn primary">💳 Record New Payment</button>
            </div>

            <!-- Filters -->
            <div class="flex" style="gap: 12px; margin-top: 16px; flex-wrap: wrap;">
                <input type="text" id="payment-search-input" placeholder="🔍 Search student or receipt..." style="max-width: 320px; flex: 1;">
                <select id="payment-status-filter" style="max-width: 180px;">
                    <option value="ALL">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                </select>
            </div>

            <table class="data-table mt-4">
                <thead>
                    <tr>
                        <th>Receipt No</th>
                        <th>Student & Class</th>
                        <th>Billing Month</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="payments-table-body">
                    ${renderTable(payments)}
                </tbody>
            </table>
        </div>

        <!-- Record Payment Modal -->
        <div id="payment-modal" class="overlay ${openRecordModal ? '' : 'hidden'} flex-center">
            <div class="glass modal-box" style="width: 100%; max-width: 500px; padding: 30px; position: relative;">
                <button id="close-payment-modal" class="icon-btn" style="position: absolute; right: 15px; top: 15px;">✖</button>
                <h3>Record Fee Payment</h3>
                <form id="payment-form" class="auth-form" style="margin-top: 20px;">
                    <div class="input-group">
                        <label>Student (Active Only) *</label>
                        <select id="pay-student" required>
                            ${activeStudents.map(s => `<option value="${s.$id || s.id}" data-name="${s.fullName}">${s.fullName} (${s.parentPhone})</option>`).join('')}
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Class / Course *</label>
                        <select id="pay-class" required>
                            ${classes.map(c => `<option value="${c.$id || c.id}" data-name="${c.className}" data-fee="${c.fee}">${c.className} (Rs. ${c.fee})</option>`).join('')}
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="input-group">
                            <label>Payment Month *</label>
                            <select id="pay-month" required>
                                <option value="August 2026">August 2026</option>
                                <option value="September 2026">September 2026</option>
                                <option value="October 2026">October 2026</option>
                                <option value="November 2026">November 2026</option>
                                <option value="December 2026">December 2026</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Amount (LKR) *</label>
                            <input type="number" id="pay-amount" required placeholder="e.g. 4500" value="${classes[0] ? classes[0].fee : 4500}">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Payment Status *</label>
                        <select id="pay-status" required>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                    <button type="submit" class="btn primary mt-4">Save Payment</button>
                </form>
            </div>
        </div>

        <!-- Official Printable Receipt Modal (Crisp Black Text) -->
        <div id="receipt-modal" class="overlay hidden flex-center">
            <div class="modal-box" style="width: 100%; max-width: 480px; padding: 20px; position: relative;">
                <button id="close-receipt-modal" class="icon-btn no-print" style="position: absolute; right: 15px; top: 15px; color: #333333;">✖</button>
                
                <div id="receipt-print-target">
                    <!-- Clean Official Receipt Injected Here -->
                </div>

                <div class="no-print mt-4 flex" style="gap: 10px;">
                    <button id="execute-print-btn" class="btn primary" style="flex: 1;">🖨️ Print Receipt</button>
                    <button id="cancel-receipt-btn" class="btn secondary">Close</button>
                </div>
            </div>
        </div>
    `;

    // Filter Logic
    const pSearch = document.getElementById('payment-search-input');
    const pStatus = document.getElementById('payment-status-filter');
    const filterPayments = () => {
        const q = pSearch.value.toLowerCase();
        const stat = pStatus.value;
        const filtered = payments.filter(p => {
            const matchQ = !q || (p.studentName || '').toLowerCase().includes(q) || (p.receiptNo || '').toLowerCase().includes(q);
            const matchS = stat === 'ALL' || p.status === stat;
            return matchQ && matchS;
        });
        document.getElementById('payments-table-body').innerHTML = renderTable(filtered);
        attachReceiptEvents();
    };

    pSearch.addEventListener('input', filterPayments);
    pStatus.addEventListener('change', filterPayments);

    document.getElementById('btn-open-payment-modal').addEventListener('click', () => {
        document.getElementById('payment-modal').classList.remove('hidden');
    });
    document.getElementById('close-payment-modal').addEventListener('click', () => {
        document.getElementById('payment-modal').classList.add('hidden');
    });

    document.getElementById('payment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const stdSelect = document.getElementById('pay-student');
        const clsSelect = document.getElementById('pay-class');
        
        await DataService.addPayment({
            studentId: stdSelect.value,
            studentName: stdSelect.options[stdSelect.selectedIndex].dataset.name,
            classId: clsSelect.value,
            className: clsSelect.options[clsSelect.selectedIndex].dataset.name,
            month: document.getElementById('pay-month').value,
            amount: Number(document.getElementById('pay-amount').value),
            status: document.getElementById('pay-status').value
        });

        alert('Payment recorded successfully!');
        document.getElementById('payment-modal').classList.add('hidden');
        renderPaymentsManagement();
    });

    const attachReceiptEvents = () => {
        document.querySelectorAll('.print-receipt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const settings = DataService.getSettings();
                document.getElementById('receipt-print-target').innerHTML = `
                    <div class="official-receipt-card">
                        <div class="receipt-header">
                            <img src="${settings.logoUrl}" style="max-height: 52px; object-fit: contain; margin-bottom: 6px; border-radius: 6px;">
                            <h2 style="font-size: 20px; font-weight: 800; text-transform: uppercase;">${settings.institutionName}</h2>
                            <p style="font-size: 13px; font-weight: 600;">OFFICIAL TUITION FEE PAYMENT RECEIPT</p>
                            <p style="font-size: 11px; color: #555555;">${settings.address || 'Sri Lanka'} • ${settings.contactPhone || '+94 11 234 5678'}</p>
                        </div>
                        
                        <div class="receipt-row"><span class="r-label">Receipt Number:</span><span class="r-val">${btn.dataset.receipt}</span></div>
                        <div class="receipt-row"><span class="r-label">Student Name:</span><span class="r-val">${btn.dataset.student}</span></div>
                        <div class="receipt-row"><span class="r-label">Enrolled Course:</span><span class="r-val">${btn.dataset.class}</span></div>
                        <div class="receipt-row"><span class="r-label">Billing Month:</span><span class="r-val">${btn.dataset.month}</span></div>
                        <div class="receipt-row"><span class="r-label">Amount Paid:</span><span class="r-val" style="font-size: 16px;">Rs. ${Number(btn.dataset.amount).toLocaleString()}</span></div>
                        <div class="receipt-row"><span class="r-label">Status:</span><span class="r-val" style="color: ${btn.dataset.status === 'Paid' ? '#10b981' : '#f59e0b'};">[ ${btn.dataset.status.toUpperCase()} ]</span></div>
                        <div class="receipt-row"><span class="r-label">Issued Date:</span><span class="r-val">8/21/2026</span></div>
                        
                        <div style="margin-top: 24px; padding-top: 12px; border-top: 1px dashed #000000; text-align: center; font-size: 11px; font-weight: 600;">
                            Thank you for your payment! • Powered by Minyara SMS
                        </div>
                    </div>
                `;
                document.getElementById('receipt-modal').classList.remove('hidden');
            });
        });
    };

    document.getElementById('execute-print-btn').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('cancel-receipt-btn').addEventListener('click', () => {
        document.getElementById('receipt-modal').classList.add('hidden');
    });

    document.getElementById('close-receipt-modal').addEventListener('click', () => {
        document.getElementById('receipt-modal').classList.add('hidden');
    });

    attachReceiptEvents();
}

// --- 5. Faculty & Teachers Activity & Suspension ---
export async function renderTeachersManagement() {
    document.getElementById('page-title').textContent = "Faculty & Teachers Activity";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const teachers = await DataService.getTeachers();

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between" style="flex-wrap: wrap; gap: 12px;">
                <div>
                    <h3>Teaching Faculty & Login Status</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">View logged in activity and manage access permissions (Suspend / Activate).</p>
                </div>
                <button id="btn-open-teacher-modal" class="btn primary">➕ Add Faculty Member</button>
            </div>

            <table class="data-table mt-4">
                <thead>
                    <tr>
                        <th>Teacher Name & Subject</th>
                        <th>Email (Login ID)</th>
                        <th>Login Activity</th>
                        <th>Access Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${teachers.map(t => `
                        <tr>
                            <td>
                                <strong>${t.name}</strong><br>
                                <small style="color: var(--text-secondary);">${t.subject || 'Faculty Member'}</small>
                            </td>
                            <td>${t.email}</td>
                            <td>
                                <span class="badge" style="background: ${t.hasLoggedIn ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)'}; color: ${t.hasLoggedIn ? '#10b981' : '#94a3b8'};">
                                    ${t.hasLoggedIn ? '🟢 Logged In' : '⚪ Never Logged In'}
                                </span>
                                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Last: ${t.lastLogin || 'Never'}</div>
                            </td>
                            <td>
                                <span class="status-badge ${t.isSuspended ? 'status-overdue' : 'status-paid'}">
                                    ${t.isSuspended ? '🔴 SUSPENDED' : '🟢 ACTIVE'}
                                </span>
                            </td>
                            <td>
                                <button class="btn small ${t.isSuspended ? 'primary' : 'danger'} toggle-teacher-suspend-btn" data-id="${t.$id || t.id}" data-suspended="${t.isSuspended ? 'true' : 'false'}">
                                    ${t.isSuspended ? '✅ Unsuspend Access' : '🚫 Suspend Teacher'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Add Teacher Modal -->
        <div id="teacher-modal" class="overlay hidden flex-center">
            <div class="glass modal-box" style="width: 100%; max-width: 480px; padding: 30px; position: relative;">
                <button id="close-teacher-modal" class="icon-btn" style="position: absolute; right: 15px; top: 15px;">✖</button>
                <h3>Add New Faculty Member</h3>
                <form id="teacher-form" class="auth-form" style="margin-top: 20px;">
                    <div class="input-group">
                        <label>Teacher Full Name *</label>
                        <input type="text" id="t-name" required placeholder="e.g. Mr. Rohan Weerasinghe">
                    </div>
                    <div class="input-group">
                        <label>Teacher Email (Login ID) *</label>
                        <input type="email" id="t-email" required placeholder="e.g. rohan.teacher@minyara.lk">
                    </div>
                    <div class="input-group">
                        <label>Phone Number *</label>
                        <input type="tel" id="t-phone" required placeholder="e.g. 0773344556">
                    </div>
                    <div class="input-group">
                        <label>Subject / Department *</label>
                        <input type="text" id="t-subject" required placeholder="e.g. Combined Mathematics">
                    </div>
                    <button type="submit" class="btn primary mt-4">Save Faculty Member</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('btn-open-teacher-modal').addEventListener('click', () => {
        document.getElementById('teacher-modal').classList.remove('hidden');
    });
    document.getElementById('close-teacher-modal').addEventListener('click', () => {
        document.getElementById('teacher-modal').classList.add('hidden');
    });

    document.getElementById('teacher-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await DataService.addTeacher({
            name: document.getElementById('t-name').value,
            email: document.getElementById('t-email').value,
            phone: document.getElementById('t-phone').value,
            subject: document.getElementById('t-subject').value
        });
        alert('Faculty member registered successfully!');
        document.getElementById('teacher-modal').classList.add('hidden');
        renderTeachersManagement();
    });

    document.querySelectorAll('.toggle-teacher-suspend-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const isSusp = btn.dataset.suspended === 'true';
            const action = isSusp ? 'unsuspend' : 'suspend';
            if (confirm(`Are you sure you want to ${action} this teacher? ${!isSusp ? 'They will be blocked from logging in.' : ''}`)) {
                await DataService.toggleTeacherSuspension(btn.dataset.id, !isSusp);
                renderTeachersManagement();
            }
        });
    });
}

// --- 6. Parents Activity & Suspension ---
export async function renderParentsManagement() {
    document.getElementById('page-title').textContent = "Parents Portal & Activity Directory";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const parents = await DataService.getParents();

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between" style="flex-wrap: wrap; gap: 12px;">
                <div>
                    <h3>Parents Directory & Portal Activity</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">View parent login activity, linked students, and control login suspension.</p>
                </div>
            </div>

            <table class="data-table mt-4">
                <thead>
                    <tr>
                        <th>Parent Name</th>
                        <th>Parent ID (Phone Login)</th>
                        <th>Linked Students</th>
                        <th>Login Activity</th>
                        <th>Account Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${parents.map(p => `
                        <tr>
                            <td><strong>${p.parentName}</strong></td>
                            <td><code>${p.parentPhone}</code></td>
                            <td>${p.linkedStudentNames?.join(', ') || 'Enrolled Student'}</td>
                            <td>
                                <span class="badge" style="background: ${p.hasLoggedIn ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)'}; color: ${p.hasLoggedIn ? '#10b981' : '#94a3b8'};">
                                    ${p.hasLoggedIn ? '🟢 Logged In' : '⚪ Never Logged In'}
                                </span>
                                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Last: ${p.lastLogin || 'Never'}</div>
                            </td>
                            <td>
                                <span class="status-badge ${p.isSuspended ? 'status-overdue' : 'status-paid'}">
                                    ${p.isSuspended ? '🔴 SUSPENDED' : '🟢 ACTIVE'}
                                </span>
                            </td>
                            <td>
                                <button class="btn small ${p.isSuspended ? 'primary' : 'danger'} toggle-parent-suspend-btn" data-id="${p.$id || p.id}" data-suspended="${p.isSuspended ? 'true' : 'false'}">
                                    ${p.isSuspended ? '✅ Unsuspend Access' : '🚫 Suspend Parent'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.querySelectorAll('.toggle-parent-suspend-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const isSusp = btn.dataset.suspended === 'true';
            const action = isSusp ? 'unsuspend' : 'suspend';
            if (confirm(`Are you sure you want to ${action} this parent? ${!isSusp ? 'They will not be able to log into the parent portal.' : ''}`)) {
                await DataService.toggleParentSuspension(btn.dataset.id, !isSusp);
                renderParentsManagement();
            }
        });
    });
}

// --- 7. Full System Settings Page ---
export async function renderSystemSettings() {
    document.getElementById('page-title').textContent = "System Settings & Configuration";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const settings = DataService.getSettings();
    const teachers = await DataService.getTeachers();
    const parents = await DataService.getParents();

    const suspendedTeachers = teachers.filter(t => t.isSuspended);
    const suspendedParents = parents.filter(p => p.isSuspended);

    contentArea.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
            <!-- Branding Settings -->
            <div class="card glass">
                <div class="card-header">
                    <h3>🎨 Institution Branding & Logo</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">Update the institute name, logo, and contact info visible everywhere.</p>
                </div>
                <form id="settings-branding-form" class="auth-form mt-4">
                    <div class="input-group">
                        <label>Institution Name</label>
                        <input type="text" id="set-brand-name" value="${settings.institutionName}" required>
                    </div>
                    <div class="input-group">
                        <label>Logo Image URL</label>
                        <input type="url" id="set-brand-logo" value="${settings.logoUrl}" required>
                    </div>
                    <div class="input-group">
                        <label>Preview</label>
                        <div style="text-align: center; padding: 12px; background: rgba(0,0,0,0.1); border-radius: 8px;">
                            <img id="set-brand-preview" src="${settings.logoUrl}" style="max-height: 80px; max-width: 120px; object-fit: contain; border-radius: 8px;">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Address / Location</label>
                        <input type="text" id="set-address" value="${settings.address || 'Sri Lanka'}">
                    </div>
                    <div class="input-group">
                        <label>Contact Phone Number</label>
                        <input type="text" id="set-phone" value="${settings.contactPhone || '+94 11 234 5678'}">
                    </div>
                    <button type="submit" class="btn primary mt-4">Save Branding Settings</button>
                </form>
            </div>

            <!-- Database & Suspension Security Overview -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Appwrite Status -->
                <div class="card glass">
                    <div class="card-header">
                        <h3>☁️ Appwrite Cloud Database</h3>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <span style="font-size: 24px;">🟢</span>
                        <div>
                            <div style="font-weight: 700; font-size: 15px;">Appwrite Database: MinyaraDB</div>
                            <small style="color: var(--text-secondary);">Project ID: <code>6a873ee0000f018920d8</code></small>
                        </div>
                    </div>
                    <div class="detail-row"><span class="detail-label">Endpoint:</span><span class="detail-value">fra.cloud.appwrite.io/v1</span></div>
                    <div class="detail-row"><span class="detail-label">Collections:</span><span class="detail-value">Students, Classes, Payments, Teachers</span></div>
                    <div class="detail-row"><span class="detail-label">Sync Engine:</span><span class="detail-value" style="color: #10b981;">Active & Ready</span></div>
                </div>

                <!-- Account Suspension Summary -->
                <div class="card glass">
                    <div class="card-header">
                        <h3>🚫 Suspended Accounts Overview</h3>
                        <p style="color: var(--text-secondary); font-size: 13px;">Users currently blocked from logging in.</p>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Suspended Teachers:</span>
                        <span class="detail-value" style="color: ${suspendedTeachers.length ? '#ef4444' : '#10b981'};">${suspendedTeachers.length} Accounts</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Suspended Parents:</span>
                        <span class="detail-value" style="color: ${suspendedParents.length ? '#ef4444' : '#10b981'};">${suspendedParents.length} Accounts</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('set-brand-logo').addEventListener('input', (e) => {
        document.getElementById('set-brand-preview').src = e.target.value;
    });

    document.getElementById('settings-branding-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = DataService.saveSettings({
            institutionName: document.getElementById('set-brand-name').value,
            logoUrl: document.getElementById('set-brand-logo').value,
            address: document.getElementById('set-address').value,
            contactPhone: document.getElementById('set-phone').value
        });
        document.querySelectorAll('.institute-logo-preview, #app-logo, .small-logo').forEach(img => {
            if (img) img.src = updated.logoUrl;
        });
        alert('System settings and branding updated successfully!');
        renderSystemSettings();
    });
}
