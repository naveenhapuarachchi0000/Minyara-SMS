// qr.js - Public QR Scan Instant Student & Payment Record Page

import { DataService } from './dataService.js';

export async function renderPublicQrView(token) {
    const container = document.getElementById('public-student-details');
    container.innerHTML = `<div class="flex-center" style="padding: 40px;"><div class="spinner"></div></div>`;

    const settings = DataService.getSettings();
    const student = await DataService.getStudentByQrToken(token);

    if (!student) {
        container.innerHTML = `
            <div class="card glass" style="text-align: center; padding: 40px 20px;">
                <span style="font-size: 48px;">⚠️</span>
                <h3 style="margin-top: 16px; color: var(--error-color); font-size: 20px;">Student Record Not Found</h3>
                <p style="color: var(--text-secondary); margin-top: 8px; font-size: 13.5px;">The scanned QR code is invalid, expired, or was removed by the academy administration.</p>
            </div>
        `;
        return;
    }

    const allPayments = await DataService.getPayments();
    const sId = (student.$id || student.id || '').toLowerCase();
    const sName = (student.fullName || '').toLowerCase();
    const payments = allPayments.filter(p => 
        (p.studentId && p.studentId.toLowerCase() === sId) ||
        (p.studentName && p.studentName.toLowerCase() === sName)
    );

    container.innerHTML = `
        <!-- Institution Header -->
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 20px;">
            <img src="${settings.logoUrl}" style="width: 72px; height: 72px; border-radius: 16px; object-fit: cover; border: 2px solid var(--primary-color); margin-bottom: 10px;">
            <h2 style="font-size: 22px; font-weight: 800;">${settings.institutionName}</h2>
            <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">Official Student Verification ID</span>
        </div>

        <!-- Student Profile Overview -->
        <div class="card glass mb-4" style="border-top: 4px solid ${student.syllabus === 'Cambridge' ? '#6366f1' : student.syllabus === 'Edexcel' ? '#ec4899' : '#10b981'};">
            <div class="flex-between" style="align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3 style="font-size: 20px; margin-bottom: 4px;">${student.fullName}</h3>
                    <p style="color: var(--text-secondary); font-size: 13.5px;">🏫 ${student.school || 'School Record'}</p>
                </div>
                <span class="status-badge ${student.isActive !== false ? 'status-paid' : 'status-overdue'}" style="font-size: 12px; padding: 6px 12px;">
                    ${student.isActive !== false ? '● ACTIVE STUDENT' : '● INACTIVE'}
                </span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 18px; background: rgba(0,0,0,0.06); padding: 16px; border-radius: 12px;">
                <div>
                    <span class="detail-label">Curriculum / Syllabus</span>
                    <p class="detail-value" style="color: var(--primary-color); font-size: 14px;">${student.syllabus} Syllabus</p>
                </div>
                <div>
                    <span class="detail-label">Age & DOB</span>
                    <p class="detail-value">${student.age || 'N/A'} yrs (${student.dob || 'N/A'})</p>
                </div>
                <div>
                    <span class="detail-label">Enrolled Date</span>
                    <p class="detail-value">${student.joinDate || 'N/A'}</p>
                </div>
                <div>
                    <span class="detail-label">Parent / Guardian</span>
                    <p class="detail-value">${student.parentName || 'Parent'}</p>
                </div>
                <div>
                    <span class="detail-label">Emergency Contact</span>
                    <p class="detail-value">${student.parentPhone} ${student.parentPhoneOptional ? ` / ${student.parentPhoneOptional}` : ''}</p>
                </div>
            </div>
        </div>

        <!-- Payment History -->
        <div class="card glass mb-4">
            <div class="card-header flex-between">
                <h3>Fee & Payment Clearance</h3>
                <span style="font-size: 13px; color: var(--text-secondary);">${payments.length} Payments Found</span>
            </div>

            <div class="table-responsive">
                <table class="data-table mt-2">
                    <thead>
                        <tr>
                            <th>Receipt</th>
                            <th>Month</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.length ? payments.map(p => `
                            <tr>
                                <td><strong>${p.receiptNo || 'REC'}</strong></td>
                                <td>${p.month || 'Current'}</td>
                                <td>Rs. ${Number(p.amount).toLocaleString()}</td>
                                <td><span class="status-badge status-${(p.status || 'paid').toLowerCase()}">${p.status}</span></td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" style="text-align: center; padding: 20px;">No payment records logged.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <div style="text-align: center; color: var(--text-secondary); font-size: 12px; margin-top: 20px;">
            🔒 Verified by Minyara SMS • Sri Lanka Best Student Management System
        </div>
    `;
}
