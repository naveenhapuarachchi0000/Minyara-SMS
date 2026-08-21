// teacher.js - Teacher Dashboard (Strict View-Only Isolation for Minyara SMS)

import { DataService } from './dataService.js';

const contentArea = document.getElementById('content-area');

/**
 * Helper: Find teacher and their assigned classes
 */
async function getTeacherContext(userEmail = '') {
    const allTeachers = await DataService.getTeachers();
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    
    const currentTeacher = allTeachers.find(t => 
        (t.email || '').trim().toLowerCase() === cleanEmail
    ) || allTeachers[0];

    const allClasses = await DataService.getClasses();
    
    let teacherClasses = [];
    if (currentTeacher) {
        const tName = (currentTeacher.name || '').trim().toLowerCase();
        const tSubject = (currentTeacher.subject || '').trim().toLowerCase();
        
        teacherClasses = allClasses.filter(c => {
            const cTeacher = (c.teacherName || '').trim().toLowerCase();
            const cName = (c.className || '').trim().toLowerCase();
            return (tName && cTeacher.includes(tName)) || 
                   (tName && tName.includes(cTeacher) && cTeacher.length > 3) ||
                   (tSubject && cName.includes(tSubject));
        });
    }

    const teacherClassIds = teacherClasses.map(c => c.$id || c.id);
    const allStudents = await DataService.getStudents(true);
    const teacherStudents = allStudents.filter(s => 
        (s.enrolledClassIds || []).some(id => teacherClassIds.includes(id))
    );

    return {
        currentTeacher,
        teacherClasses,
        teacherClassIds,
        teacherStudents,
        allClasses
    };
}

/**
 * Render Teacher Classes & Subjects (Only their own assigned subjects)
 */
export async function renderTeacherClasses(userEmail = '') {
    document.getElementById('page-title').textContent = "My Assigned Subjects & Classes";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const { currentTeacher, teacherClasses, teacherStudents } = await getTeacherContext(userEmail);

    if (!teacherClasses.length) {
        contentArea.innerHTML = `
            <div class="card glass mb-4" style="text-align: center; padding: 40px 20px;">
                <span style="font-size: 48px;">👨‍🏫</span>
                <h3 style="margin-top: 16px; font-size: 20px;">No Classes Assigned to Faculty Profile</h3>
                <p style="color: var(--text-secondary); margin-top: 8px; max-width: 480px; margin-left: auto; margin-right: auto; font-size: 13.5px;">
                    Welcome, <strong>${currentTeacher ? currentTeacher.name : 'Teacher'}</strong>. You currently do not have any subjects or classes assigned to your faculty profile. Please contact the academy administration to assign your courses.
                </p>
            </div>
        `;
        return;
    }

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between" style="flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3>Faculty Portal: ${currentTeacher ? currentTeacher.name : 'Teacher'}</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">
                        Subject / Department: <strong>${currentTeacher ? currentTeacher.subject : 'Faculty'}</strong> • 
                        My Assigned Classes: <strong>${teacherClasses.length}</strong> • 
                        My Students: <strong>${teacherStudents.length}</strong>
                    </p>
                </div>
                <div class="flex" style="gap: 8px;">
                    <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">My Subjects Only</span>
                    <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">👁️ View Only</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                ${teacherClasses.map(c => {
                    const enrolledStudents = teacherStudents.filter(s => (s.enrolledClassIds || []).includes(c.$id || c.id));
                    return `
                        <div class="card glass" style="border-left: 4px solid var(--primary-color);">
                            <div class="flex-between">
                                <span class="badge" style="background: rgba(255,255,255,0.1);">${c.syllabus}</span>
                                <span style="font-weight: 700; color: #10b981;">Rs. ${Number(c.fee || 0).toLocaleString()} /mo</span>
                            </div>
                            <h3 style="margin: 12px 0 6px; font-size: 18px;">${c.className}</h3>
                            <p style="color: var(--text-secondary); font-size: 13px;">Grade: <strong>${c.grade || 'Grade 11'}</strong> • ${c.syllabus} Standard</p>
                            
                            <div style="margin: 14px 0; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 8px; font-size: 13px;">
                                <div><span style="color: var(--text-secondary);">Instructor:</span> <strong>${c.teacherName || currentTeacher.name}</strong></div>
                                <div><span style="color: var(--text-secondary);">My Enrolled Students:</span> <strong style="color: #6366f1;">${enrolledStudents.length} Students</strong></div>
                            </div>
                            
                            <div class="flex" style="margin-top: 12px;">
                                <button class="btn small primary teacher-view-roster" data-id="${c.$id || c.id}" data-name="${c.className}" style="width: 100%;">
                                    📋 View Class Roster (${enrolledStudents.length})
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Class Roster View-Only Modal -->
        <div id="teacher-roster-modal" class="overlay hidden flex-center">
            <div class="glass modal-box" style="width: 100%; max-width: 680px; padding: 28px; position: relative;">
                <button id="close-teacher-roster-modal" class="icon-btn" style="position: absolute; right: 15px; top: 15px;">✖</button>
                <div class="flex-between" style="padding-right: 30px;">
                    <div>
                        <h3 id="teacher-roster-title">Class Student Roster</h3>
                        <p style="color: var(--text-secondary); font-size: 13px; margin: 4px 0 16px;">View enrolled students and fee clearance status (View-Only).</p>
                    </div>
                    <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">👁️ View Only</span>
                </div>
                
                <div id="teacher-roster-target" class="table-responsive" style="max-height: 400px;"></div>
            </div>
        </div>
    `;

    document.querySelectorAll('.teacher-view-roster').forEach(btn => {
        btn.addEventListener('click', async () => {
            const classId = btn.dataset.id;
            const className = btn.dataset.name;
            const enrolled = await DataService.getStudentsInClass(classId);
            const allPayments = await DataService.getPayments();

            document.getElementById('teacher-roster-title').textContent = `${className} - Enrolled Students (${enrolled.length})`;
            document.getElementById('teacher-roster-target').innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Grade & School</th>
                            <th>Parent Contact</th>
                            <th>Fee Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${enrolled.length ? enrolled.map(s => {
                            const p = allPayments.find(pay => pay.studentId === (s.$id || s.id) && (pay.classId === classId || !pay.classId));
                            const stat = p ? p.status : 'Pending';
                            return `
                                <tr>
                                    <td>
                                        <strong>${s.fullName}</strong>
                                        <div style="font-size: 11.5px; color: var(--text-secondary);">${s.syllabus} Syllabus</div>
                                    </td>
                                    <td>
                                        <div>${s.grade || 'Grade 11'}</div>
                                        <small style="color: var(--text-secondary);">${s.school || 'School N/A'}</small>
                                    </td>
                                    <td>
                                        <div>${s.parentName || 'Parent'}</div>
                                        <strong style="color: var(--primary-color);">${s.parentPhone}</strong>
                                    </td>
                                    <td><span class="status-badge status-${stat.toLowerCase()}">${stat}</span></td>
                                </tr>
                            `;
                        }).join('') : '<tr><td colspan="4" style="text-align: center; padding: 25px; color: var(--text-secondary);">No active students enrolled in this class yet.</td></tr>'}
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

/**
 * Render Teacher Students Directory (Only students enrolled in this teacher's classes)
 */
export async function renderTeacherStudents(userEmail = '') {
    document.getElementById('page-title').textContent = "My Students Directory (View-Only)";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const { currentTeacher, teacherClasses, teacherStudents, allClasses } = await getTeacherContext(userEmail);
    const payments = await DataService.getPayments();

    if (!teacherStudents.length) {
        contentArea.innerHTML = `
            <div class="card glass mb-4" style="text-align: center; padding: 40px 20px;">
                <span style="font-size: 48px;">👨‍🎓</span>
                <h3 style="margin-top: 16px; font-size: 20px;">No Students Enrolled in Your Classes Yet</h3>
                <p style="color: var(--text-secondary); margin-top: 8px; max-width: 480px; margin-left: auto; margin-right: auto; font-size: 13.5px;">
                    There are currently no students enrolled in your assigned classes (<strong>${teacherClasses.map(c => c.className).join(', ') || 'No Classes'}</strong>).
                </p>
            </div>
        `;
        return;
    }

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between" style="flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3>My Students Directory (${teacherStudents.length})</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">Showing students enrolled in your assigned courses only.</p>
                </div>
                <div class="flex" style="gap: 8px;">
                    <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">My Students Only</span>
                    <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">👁️ View Only</span>
                </div>
            </div>

            <!-- Search input -->
            <div style="margin-top: 14px;">
                <input type="text" id="teacher-student-search" placeholder="🔍 Search within your students by name, school, or parent phone..." style="max-width: 380px; width: 100%;">
            </div>

            <div class="table-responsive">
                <table class="data-table mt-4" id="teacher-students-table">
                    <thead>
                        <tr>
                            <th>Student & School</th>
                            <th>Grade & Syllabus</th>
                            <th>My Classes Enrolled</th>
                            <th>Parent Emergency Contact</th>
                            <th>Fee Status</th>
                        </tr>
                    </thead>
                    <tbody id="teacher-students-tbody">
                        ${renderStudentRows(teacherStudents, teacherClasses, allClasses, payments)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('teacher-student-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = teacherStudents.filter(s => 
            s.fullName.toLowerCase().includes(q) ||
            (s.school || '').toLowerCase().includes(q) ||
            (s.parentPhone || '').includes(q) ||
            (s.parentName || '').toLowerCase().includes(q) ||
            (s.syllabus || '').toLowerCase().includes(q)
        );
        document.getElementById('teacher-students-tbody').innerHTML = renderStudentRows(filtered, teacherClasses, allClasses, payments);
    });
}

function renderStudentRows(list, teacherClasses, allClasses, payments) {
    if (!list.length) {
        return `<tr><td colspan="5" style="text-align: center; padding: 25px; color: var(--text-secondary);">No student records found matching search.</td></tr>`;
    }
    const teacherClassIds = teacherClasses.map(c => c.$id || c.id);

    return list.map(s => {
        const p = payments.find(pay => pay.studentId === (s.$id || s.id));
        const stat = p ? p.status : 'Pending';
        
        // Show classes taught by this teacher that the student is in
        const myClassNames = (s.enrolledClassIds || [])
            .filter(cid => teacherClassIds.includes(cid))
            .map(cid => {
                const c = allClasses.find(cl => (cl.$id || cl.id) === cid);
                return c ? c.className : cid;
            }).join(', ') || 'Enrolled';

        return `
            <tr>
                <td>
                    <strong style="color: var(--text-primary);">${s.fullName}</strong><br>
                    <small style="color: var(--text-secondary);">${s.school || 'School N/A'} • Age: ${s.age || 'N/A'}</small>
                </td>
                <td>
                    <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">${s.grade || 'Grade 11'}</span>
                    <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">${s.syllabus}</div>
                </td>
                <td><small style="color: #10b981; font-weight: 600;">${myClassNames}</small></td>
                <td>
                    <div>${s.parentName || 'Parent'}</div>
                    <strong style="color: var(--primary-color);">${s.parentPhone}</strong>
                </td>
                <td><span class="status-badge status-${stat.toLowerCase()}">${stat}</span></td>
            </tr>
        `;
    }).join('');
}
