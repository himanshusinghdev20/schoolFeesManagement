// Reports JavaScript
const API_URL = 'http://localhost:3000/api';
let currentReport = 'pending';

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    showReport('pending');
    
    // Set default date to today
    document.getElementById('reportDate').value = new Date().toISOString().split('T')[0];
    
    // Set default month and year
    const now = new Date();
    document.getElementById('reportMonth').value = now.getMonth() + 1;
    document.getElementById('reportYear').value = now.getFullYear();
});

// Show report based on type
function showReport(type) {
    currentReport = type;
    
    // Update active button
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide date filters
    const dateFilter = document.getElementById('dateFilter');
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');
    
    if (type === 'daily') {
        dateFilter.style.display = 'flex';
        monthFilter.style.display = 'none';
        yearFilter.style.display = 'none';
    } else if (type === 'monthly') {
        dateFilter.style.display = 'flex';
        monthFilter.style.display = 'block';
        yearFilter.style.display = 'block';
    } else {
        dateFilter.style.display = 'none';
    }
    
    loadReport();
}

// Load report based on type
async function loadReport() {
    const reportContent = document.getElementById('reportContent');
    
    switch(currentReport) {
        case 'pending':
            await loadPendingReport();
            break;
        case 'overdue':
            await loadOverdueReport();
            break;
        case 'daily':
            await loadDailyReport();
            break;
        case 'monthly':
            await loadMonthlyReport();
            break;
    }
}

// Load pending fees report
async function loadPendingReport() {
    try {
        const response = await fetch(`${API_URL}/reports/pending`);
        const result = await response.json();
        
        if (result.success) {
            displayPendingReport(result.data);
        }
    } catch (error) {
        console.error('Error loading pending report:', error);
        showToast('Error loading report', 'danger');
    }
}

// Display pending fees report
function displayPendingReport(data) {
    document.getElementById('pendingStudents').textContent = data.summary.total_students || 0;
    document.getElementById('pendingTotal').textContent = formatCurrency(data.summary.total_pending || 0);
    document.getElementById('lateFeeTotal').textContent = formatCurrency(data.summary.total_late_fee || 0);
    
    const tbody = document.getElementById('pendingTable');
    
    if (data.pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No pending fees</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.pending.map(item => `
        <tr>
            <td>${item.roll_number}</td>
            <td>${item.student_name}</td>
            <td>${item.course}</td>
            <td>${item.phone || '-'}</td>
            <td>₹${formatCurrency(item.total_fees)}</td>
            <td class="text-success">₹${formatCurrency(item.paid_amount)}</td>
            <td class="text-danger fw-bold">₹${formatCurrency(item.pending_amount)}</td>
            <td>${item.earliest_due_date ? formatDate(item.earliest_due_date) : '-'}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="sendReminderModal(${item.student_id}, '${item.student_name}', ${item.pending_amount})" title="Send Reminder">
                    <i class="fas fa-bell"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Load overdue fees report
async function loadOverdueReport() {
    try {
        const response = await fetch(`${API_URL}/reports/overdue`);
        const result = await response.json();
        
        if (result.success) {
            displayOverdueReport(result.data);
        }
    } catch (error) {
        console.error('Error loading overdue report:', error);
        showToast('Error loading report', 'danger');
    }
}

// Display overdue report
function displayOverdueReport(data) {
    const reportHtml = `
        <div class="card">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas fa-exclamation-triangle text-danger"></i> Overdue Fees Report</h5>
                <button class="btn btn-sm btn-danger" onclick="exportReport('overdue')">
                    <i class="fas fa-file-excel"></i> Export
                </button>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-3">
                        <div class="alert alert-danger">
                            <strong>Total Students:</strong> ${data.summary.total_students || 0}
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="alert alert-danger">
                            <strong>Overdue Fees:</strong> ${data.summary.total_overdue_fees || 0}
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="alert alert-danger">
                            <strong>Total Amount:</strong> ₹${formatCurrency(data.summary.total_overdue_amount || 0)}
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="alert alert-danger">
                            <strong>Late Fees:</strong> ₹${formatCurrency(data.summary.total_late_fee || 0)}
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Roll No.</th>
                                <th>Student Name</th>
                                <th>Course</th>
                                <th>Phone</th>
                                <th>Fee Type</th>
                                <th>Pending</th>
                                <th>Due Date</th>
                                <th>Days Overdue</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.overdue.length === 0 ? 
                                '<tr><td colspan="9" class="text-center">No overdue fees</td></tr>' :
                                data.overdue.map(item => `
                                    <tr>
                                        <td>${item.roll_number}</td>
                                        <td>${item.student_name}</td>
                                        <td>${item.course}</td>
                                        <td>${item.phone || '-'}</td>
                                        <td><span class="badge bg-secondary">${item.fee_type}</span></td>
                                        <td class="text-danger fw-bold">₹${formatCurrency(item.pending_amount)}</td>
                                        <td>${formatDate(item.due_date)}</td>
                                        <td><span class="badge bg-danger">${item.days_overdue} days</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-warning" onclick="sendReminderModal(${item.student_id}, '${item.student_name}', ${item.pending_amount})">
                                                <i class="fas fa-bell"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportHtml;
}

// Load daily collection report
async function loadDailyReport() {
    const date = document.getElementById('reportDate').value;
    
    try {
        const response = await fetch(`${API_URL}/reports/daily?date=${date}`);
        const result = await response.json();
        
        if (result.success) {
            displayDailyReport(result.data, date);
        }
    } catch (error) {
        console.error('Error loading daily report:', error);
        showToast('Error loading report', 'danger');
    }
}

// Display daily report
function displayDailyReport(data, date) {
    const reportHtml = `
        <div class="card">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas fa-calendar-day"></i> Daily Collection Report - ${formatDate(date)}</h5>
                <button class="btn btn-sm btn-success" onclick="exportReport('daily')">
                    <i class="fas fa-file-excel"></i> Export
                </button>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="alert alert-success">
                            <h3>₹${formatCurrency(data.total.total_collection || 0)}</h3>
                            <small>Total Collection (${data.total.total_transactions || 0} transactions)</small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Payment Mode Breakdown:</h6>
                        ${data.summary.map(item => `
                            <div class="d-flex justify-content-between mb-2">
                                <span><span class="badge bg-${getPaymentModeColor(item.payment_mode)}">${item.payment_mode.toUpperCase()}</span> (${item.count})</span>
                                <strong>₹${formatCurrency(item.total)}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Student Name</th>
                                <th>Roll No.</th>
                                <th>Fee Type</th>
                                <th>Amount</th>
                                <th>Mode</th>
                                <th>Transaction ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.payments.length === 0 ?
                                '<tr><td colspan="7" class="text-center">No payments on this date</td></tr>' :
                                data.payments.map(payment => `
                                    <tr>
                                        <td>${new Date(payment.created_at).toLocaleTimeString('en-IN')}</td>
                                        <td>${payment.student_name}</td>
                                        <td>${payment.roll_number}</td>
                                        <td><span class="badge bg-secondary">${payment.fee_type}</span></td>
                                        <td class="text-success fw-bold">₹${formatCurrency(payment.amount_paid)}</td>
                                        <td><span class="badge bg-${getPaymentModeColor(payment.payment_mode)}">${payment.payment_mode.toUpperCase()}</span></td>
                                        <td>${payment.transaction_id || '-'}</td>
                                    </tr>
                                `).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportHtml;
}

// Load monthly collection report
async function loadMonthlyReport() {
    const month = document.getElementById('reportMonth').value;
    const year = document.getElementById('reportYear').value;
    
    try {
        const response = await fetch(`${API_URL}/reports/monthly?month=${month}&year=${year}`);
        const result = await response.json();
        
        if (result.success) {
            displayMonthlyReport(result.data, month, year);
        }
    } catch (error) {
        console.error('Error loading monthly report:', error);
        showToast('Error loading report', 'danger');
    }
}

// Display monthly report
function displayMonthlyReport(data, month, year) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const reportHtml = `
        <div class="card">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas fa-calendar-alt"></i> Monthly Collection Report - ${monthNames[month-1]} ${year}</h5>
                <button class="btn btn-sm btn-success" onclick="exportReport('monthly')">
                    <i class="fas fa-file-excel"></i> Export
                </button>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="alert alert-success">
                            <h3>₹${formatCurrency(data.total.total_collection || 0)}</h3>
                            <small>Total Collection (${data.total.total_transactions || 0} transactions)</small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Payment Mode Breakdown:</h6>
                        ${data.summary.map(item => `
                            <div class="d-flex justify-content-between mb-2">
                                <span><span class="badge bg-${getPaymentModeColor(item.payment_mode)}">${item.payment_mode.toUpperCase()}</span> (${item.count})</span>
                                <strong>₹${formatCurrency(item.total)}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Payment Mode</th>
                                <th>Transactions</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.report.length === 0 ?
                                '<tr><td colspan="4" class="text-center">No payments in this month</td></tr>' :
                                data.report.map(item => `
                                    <tr>
                                        <td>${formatDate(item.date)}</td>
                                        <td><span class="badge bg-${getPaymentModeColor(item.payment_mode)}">${item.payment_mode.toUpperCase()}</span></td>
                                        <td>${item.count}</td>
                                        <td class="text-success fw-bold">₹${formatCurrency(item.total)}</td>
                                    </tr>
                                `).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportHtml;
}

// Send reminder modal
function sendReminderModal(studentId, studentName, amount) {
    document.getElementById('reminderStudentName').textContent = studentName;
    document.getElementById('reminderAmount').textContent = formatCurrency(amount);
    
    const modal = new bootstrap.Modal(document.getElementById('reminderModal'));
    modal.show();
}

// Send reminder
function sendReminder() {
    const sendSMS = document.getElementById('sendSMS').checked;
    const sendEmail = document.getElementById('sendEmail').checked;
    
    if (!sendSMS && !sendEmail) {
        showToast('Please select at least one reminder method', 'warning');
        return;
    }
    
    // Simulate sending reminder
    showToast('Reminder sent successfully', 'success');
    bootstrap.Modal.getInstance(document.getElementById('reminderModal')).hide();
}

// Export report
function exportReport(type) {
    showToast('Export functionality coming soon', 'info');
}

// Utility functions
function formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getPaymentModeColor(mode) {
    const colors = {
        cash: 'success',
        upi: 'info',
        card: 'primary',
        cheque: 'warning',
        bank_transfer: 'secondary'
    };
    return colors[mode] || 'secondary';
}

function showToast(message, type = 'success') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    const toastContainer = document.createElement('div');
    toastContainer.innerHTML = toastHtml;
    toastContainer.className = 'toast';
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '80px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    
    document.body.appendChild(toastContainer);
    
    const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
    toast.show();
    
    setTimeout(() => document.body.removeChild(toastContainer), 3500);
}
