// teacher.js - Teacher Dashboard for Minyara SMS

import { DataService } from './dataService.js';

const contentArea = document.getElementById('content-area');

export async function renderTeacherClasses(userEmail = '') {
    document.getElementById('page-title').textContent = "Teacher Classes & Student Rosters";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const classes = await DataService.getClasses();
    const allTeachers = await DataService.getTeachers();
    const activeStudents = await DataService.getStudents(true);
    
    const currentTeacher = allTeachers.find(t => t.email.toLowerCase() === (userEmail || '').toLowerCase()) || allTeachers[0];
    const assignedClasses = classes; // Display all classes for demo/faculty

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between" style="flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3>Welcome, ${currentTeacher ? currentTeacher.name : 'Teacher'}</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">Manage course rosters, assign new joiners, or decline enrollments.</p>
                </div>
                <span class="badge" style="background: rgba(79, 70, 229, 0.2); color: var(--primary-color);">Faculty Portal</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                ${assignedClasses.map(c => `
                    <div class="card glass" style="border-left: 4px solid var(--primary-color);">
                        <div class="flex-between">
                            <span class="badge" style="background: rgba(255,255,255,0.1);">${c.syllabus}</span>
                            <span style="font-weight: 700; color: #10b981;">Rs. ${c.fee} /mo</span>
                        </div>
                        <h3 style="margin: 12px 0 6px; font-size: 18px;">${c.className}</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">Curriculum: ${c.syllabus} Standard</p>
                        
                        <div class="flex" style="margin-top: 16px; gap: 8px; flex-wrap: wrap;">
                            <button class="btn small primary teacher-view-roster" data-id="${c.$id || c.id}" data-name="${c.className}">📋 Manage Roster</button>
                            <button class="btn small secondary teacher-assign-btn" data-id="${c.$id || c.id}" data-name="${c.className}">➕ Assign Student</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Teacher Assign Modal -->
        <div id="teacher-assign-modal" class="overlay hidden flex-center">
            <div class="glass modal-box" style="width: 100%; max-width: 480px; padding: 28px; position: relative;">
                <button id="close-teacher-assign-modal" class="icon-btn" style="position: absolute; right: 15px; top: 15px;">✖</button>
                <h3 id="teacher-assign-title">Assign Student to Class</h3>
                <form id="teacher-assign-form" class="auth-form" style="margin-top: 18px;">
                    <input type="hidden" id="teacher-assign-class-id">
                    <div class="input-group">
                        <label>Select Active Student *</label>
                        <select id="teacher-assign-student-select" required>
                            ${activeStudents.map(s => `<option value="${s.$id || s.id}">${s.fullName} (${s.syllabus} - ${s.school || 'School'})</option>`).join('')}
                        </select>
                    </div>
                    <button type="submit" class="btn primary mt-4">Confirm Assignment</button>
                </form>
            </div>
        </div>

        <!-- Class Roster & Decline Modal -->
        <div id="teacher-roster-modal" class="overlay hidden flex-center">
            <div class="glass modal-box" style="width: 100%; max-width: 660px; padding: 28px; position: relative;">
                <button id="close-teacher-roster-modal" class="icon-btn" style="position: absolute; right: 15px; top: 15px;">✖</button>
                <h3 id="teacher-roster-title">Class Student Roster</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin: 4px 0 16px;">View fee clearance or decline student enrollment.</p>
                
                <div id="teacher-roster-target" class="table-responsive" style="max-height: 400px;"></div>
            </div>
        </div>
    `;

    document.querySelectorAll('.teacher-assign-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('teacher-assign-class-id').value = btn.dataset.id;
            document.getElementById('teacher-assign-title').textContent = `Assign Student to ${btn.dataset.name}`;
            document.getElementById('teacher-assign-modal').classList.remove('hidden');
        });
    });

    document.getElementById('close-teacher-assign-modal').addEventListener('click', () => {
        document.getElementById('teacher-assign-modal').classList.add('hidden');
    });

    document.getElementById('teacher-assign-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const cId = document.getElementById('teacher-assign-class-id').value;
        const sId = document.getElementById('teacher-assign-student-select').value;
        await DataService.assignStudentToClass(sId, cId);
        alert('Student successfully assigned to class!');
        document.getElementById('teacher-assign-modal').classList.add('hidden');
    });

    document.querySelectorAll('.teacher-view-roster').forEach(btn => {
        btn.addEventListener('click', async () => {
            const classId = btn.dataset.id;
            const className = btn.dataset.name;
            const enrolled = await DataService.getStudentsInClass(classId);
            const allPayments = await DataService.getPayments();

            document.getElementById('teacher-roster-title').textContent = `${className} - Active Students`;
            document.getElementById('teacher-roster-target').innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>School</th>
                            <th>Parent Phone</th>
                            <th>Payment Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${enrolled.length ? enrolled.map(s => {
                            const p = allPayments.find(pay => pay.studentId === (s.$id || s.id));
                            const stat = p ? p.status : 'Pending';
                            return `
                                <tr>
                                    <td><strong>${s.fullName}</strong></td>
                                    <td>${s.school || 'N/A'}</td>
                                    <td>${s.parentPhone}</td>
                                    <td><span class="status-badge status-${stat.toLowerCase()}">${stat}</span></td>
                                    <td>
                                        <button class="btn small danger teacher-decline-btn" data-student="${s.$id || s.id}" data-class="${classId}" data-name="${s.fullName}">
                                            🚫 Decline
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('') : '<tr><td colspan="5" style="text-align: center; padding: 25px;">No active students enrolled in this class yet.</td></tr>'}
                    </tbody>
                </table>
            `;

            document.querySelectorAll('.teacher-decline-btn').forEach(decBtn => {
                decBtn.addEventListener('click', async () => {
                    if (confirm(`Decline / remove ${decBtn.dataset.name} from this class?`)) {
                        await DataService.declineStudentFromClass(decBtn.dataset.student, decBtn.dataset.class);
                        btn.click();
                    }
                });
            });

            document.getElementById('teacher-roster-modal').classList.remove('hidden');
        });
    });

    document.getElementById('close-teacher-roster-modal').addEventListener('click', () => {
        document.getElementById('teacher-roster-modal').classList.add('hidden');
    });
}

export async function renderTeacherStudents() {
    document.getElementById('page-title').textContent = "My Active Students Directory";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const students = await DataService.getStudents(true);
    const payments = await DataService.getPayments();

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header">
                <h3>My Students Directory</h3>
                <p style="color: var(--text-secondary); font-size: 13px;">View student details, parent emergency contacts, and fee status.</p>
            </div>

            <div class="table-responsive">
                <table class="data-table mt-4">
                    <thead>
                        <tr>
                            <th>Student Name & School</th>
                            <th>Syllabus</th>
                            <th>Parent Contact</th>
                            <th>Fee Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => {
                            const p = payments.find(pay => pay.studentId === (s.$id || s.id));
                            const stat = p ? p.status : 'Pending';
                            return `
                                <tr>
                                    <td>
                                        <strong>${s.fullName}</strong><br>
                                        <small style="color: var(--text-secondary);">${s.school || 'School N/A'}</small>
                                    </td>
                                    <td><span class="badge">${s.syllabus}</span></td>
                                    <td>${s.parentName || 'Parent'}: <strong>${s.parentPhone}</strong></td>
                                    <td><span class="status-badge status-${stat.toLowerCase()}">${stat}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
