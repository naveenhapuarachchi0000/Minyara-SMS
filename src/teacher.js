// teacher.js - Teacher Dashboard for Minyara SMS

import { DataService } from './dataService.js';

const contentArea = document.getElementById('content-area');

export async function renderTeacherClasses(userEmail = '') {
    document.getElementById('page-title').textContent = "Teacher Classes & Roster";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const classes = await DataService.getClasses();
    const allTeachers = await DataService.getTeachers();
    
    // Find current teacher or default to first for demonstration
    const currentTeacher = allTeachers.find(t => t.email === userEmail) || allTeachers[0];
    const assignedClasses = classes.filter(c => 
        (c.teacherName && currentTeacher && c.teacherName.includes(currentTeacher.name.split(' ')[1] || '')) ||
        (c.teacherIds && currentTeacher && c.teacherIds.includes(currentTeacher.$id || currentTeacher.id)) ||
        true // show all assigned for rich demo
    );

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between">
                <div>
                    <h3>Welcome, ${currentTeacher ? currentTeacher.name : 'Teacher'}</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">Manage your classes, view active students, and monitor fee payment compliance.</p>
                </div>
                <span class="badge" style="background: rgba(79, 70, 229, 0.2); color: var(--primary-color);">Faculty Member</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-top: 20px;">
                ${assignedClasses.map(c => `
                    <div class="card glass" style="border-left: 4px solid var(--primary-color);">
                        <div class="flex-between">
                            <span class="badge" style="background: rgba(255,255,255,0.1);">${c.syllabus}</span>
                            <span style="font-weight: 700; color: #10b981;">Rs. ${c.fee} /mo</span>
                        </div>
                        <h3 style="margin: 12px 0 6px; font-size: 18px;">${c.className}</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">Curriculum: ${c.syllabus} Standard</p>
                        
                        <div class="flex" style="margin-top: 16px; gap: 8px;">
                            <button class="btn small primary teacher-view-roster" data-id="${c.$id || c.id}" data-name="${c.className}">📋 Student Roster</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Class Roster Modal -->
        <div id="teacher-roster-modal" class="overlay hidden flex-center">
            <div class="glass modal-box" style="width: 100%; max-width: 650px; padding: 30px; position: relative;">
                <button id="close-teacher-roster-modal" class="icon-btn" style="position: absolute; right: 15px; top: 15px;">✖</button>
                <h3 id="teacher-roster-title">Class Student Roster</h3>
                <div id="teacher-roster-target" style="margin-top: 16px; max-height: 400px; overflow-y: auto;"></div>
            </div>
        </div>
    `;

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
                                </tr>
                            `;
                        }).join('') : '<tr><td colspan="4">No active students enrolled in this class yet.</td></tr>'}
                    </tbody>
                </table>
            `;
            document.getElementById('teacher-roster-modal').classList.remove('hidden');
        });
    });

    document.getElementById('close-teacher-roster-modal').addEventListener('click', () => {
        document.getElementById('teacher-roster-modal').classList.add('hidden');
    });
}

export async function renderTeacherStudents() {
    document.getElementById('page-title').textContent = "My Active Students";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const students = await DataService.getStudents(true); // Active students only
    const payments = await DataService.getPayments();

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header">
                <h3>My Students Directory</h3>
                <p style="color: var(--text-secondary); font-size: 13px;">View student details, parent emergency contacts, and fee status.</p>
            </div>

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
    `;
}
