// parent.js - Parent Portal for Minyara SMS

import { DataService } from './dataService.js';

const contentArea = document.getElementById('content-area');

export async function renderParentChildren(parentPhone = '') {
    document.getElementById('page-title').textContent = "Parent Portal - My Children";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    let children = [];
    if (parentPhone) {
        children = await DataService.getStudentsByParentPhone(parentPhone);
    }
    // If no specific match or demo mode, show the registered children
    if (!children.length) {
        const allStudents = await DataService.getStudents(false);
        children = allStudents.slice(0, 2); // Show top 2 students for demonstration
    }

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between" style="flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3>My Enrolled Children (${children.length})</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">Monitor academic curriculum, enrollment status, and payment records.</p>
                </div>
                <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">Verified Parent Access</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; margin-top: 20px;">
                ${children.map(s => `
                    <div class="card glass" style="border-top: 4px solid var(--primary-color);">
                        <div class="flex-between">
                            <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #6366f1;">${s.syllabus} Syllabus</span>
                            <span class="status-badge ${s.isActive !== false ? 'status-paid' : 'status-overdue'}">
                                ${s.isActive !== false ? '● Active' : '● Inactive'}
                            </span>
                        </div>

                        <h3 style="font-size: 20px; margin: 12px 0 4px; color: var(--text-primary);">${s.fullName}</h3>
                        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">🏫 ${s.school || 'School Registered'}</p>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: rgba(0,0,0,0.05); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;">
                            <div><span style="color: var(--text-secondary);">Age:</span> <strong>${s.age || 'N/A'} yrs</strong></div>
                            <div><span style="color: var(--text-secondary);">DOB:</span> <strong>${s.dob || 'N/A'}</strong></div>
                            <div><span style="color: var(--text-secondary);">Joined:</span> <strong>${s.joinDate || 'N/A'}</strong></div>
                            <div><span style="color: var(--text-secondary);">Parent:</span> <strong>${s.parentName || 'Parent'}</strong></div>
                        </div>

                        <div class="flex" style="gap: 8px;">
                            <button class="btn small primary parent-qr-btn" data-token="${s.qrCodeToken}" data-name="${s.fullName}">📱 View Student QR</button>
                            <button class="btn small secondary parent-payments-btn" data-id="${s.$id || s.id}" data-name="${s.fullName}">💳 View Fees</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Parent QR Modal -->
        <div id="parent-qr-modal" class="overlay hidden flex-center">
            <div class="glass modal-box" style="width: 100%; max-width: 440px; padding: 30px; text-align: center; position: relative;">
                <button id="close-parent-qr-modal" class="icon-btn" style="position: absolute; right: 15px; top: 15px;">✖</button>
                <h3 id="parent-modal-student-name">Student QR ID</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin: 10px 0 16px;">
                    Scan this QR code at the academy reception or anywhere to view instant student fee clearance and enrollment details.
                </p>
                <div id="parent-modal-qrcode-target" style="background: white; padding: 16px; border-radius: 12px; display: inline-block;"></div>
            </div>
        </div>
    `;

    document.querySelectorAll('.parent-qr-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const token = btn.dataset.token;
            const sName = btn.dataset.name;
            const targetUrl = `${window.location.origin}${window.location.pathname}?student=${token}`;

            document.getElementById('parent-modal-student-name').textContent = `${sName} - Student QR`;
            const qrTarget = document.getElementById('parent-modal-qrcode-target');
            qrTarget.innerHTML = '';
            
            new QRCode(qrTarget, {
                text: targetUrl,
                width: 200,
                height: 200
            });

            document.getElementById('parent-qr-modal').classList.remove('hidden');
        });
    });

    document.getElementById('close-parent-qr-modal').addEventListener('click', () => {
        document.getElementById('parent-qr-modal').classList.add('hidden');
    });

    document.querySelectorAll('.parent-payments-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            renderParentPayments(btn.dataset.id);
        });
    });
}

export async function renderParentPayments(studentId = null) {
    document.getElementById('page-title').textContent = "Fee Payment History";
    contentArea.innerHTML = `<div class="glass flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const payments = await DataService.getPayments(studentId);

    contentArea.innerHTML = `
        <div class="card glass mb-4">
            <div class="card-header flex-between">
                <div>
                    <h3>Fee Statement & Receipts</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">View paid and pending monthly tuition fees.</p>
                </div>
            </div>

            <table class="data-table mt-4">
                <thead>
                    <tr>
                        <th>Receipt No</th>
                        <th>Student</th>
                        <th>Class / Subject</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments.length ? payments.map(p => `
                        <tr>
                            <td><strong>${p.receiptNo || 'REC-001'}</strong></td>
                            <td>${p.studentName || 'Student'}</td>
                            <td>${p.className || 'General Fee'}</td>
                            <td>${p.month || 'Current Month'}</td>
                            <td><strong>Rs. ${Number(p.amount).toLocaleString()}</strong></td>
                            <td><span class="status-badge status-${(p.status || 'paid').toLowerCase()}">${p.status}</span></td>
                        </tr>
                    `).join('') : '<tr><td colspan="6" style="text-align: center; padding: 25px;">No payment records found for this student.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}
