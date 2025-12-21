// Dashboard JavaScript
const API_URL = 'http://localhost:3000/api';

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

// Load dashboard statistics
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/reports/dashboard`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Update statistics
            document.getElementById('totalStudents').textContent = data.totalStudents || 0;
            document.getElementById('todayCollection').textContent = formatCurrency(data.todayCollection || 0);
            document.getElementById('monthCollection').textContent = formatCurrency(data.monthCollection || 0);
            document.getElementById('totalPending').textContent = formatCurrency(data.totalPending || 0);
            document.getElementById('overdueCount').textContent = data.overdueCount || 0;
            
            // Load recent payments
            loadRecentPayments(data.recentPayments);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard data', 'danger');
    }
}

// Load recent payments table
function loadRecentPayments(payments) {
    const tbody = document.getElementById('recentPaymentsTable');
    
    if (!payments || payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No recent payments</td></tr>';
        return;
    }
    
    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td>REC-${payment.payment_id}</td>
            <td>${payment.student_name}</td>
            <td>${payment.roll_number}</td>
            <td class="text-success fw-bold">₹${formatCurrency(payment.amount_paid)}</td>
            <td><span class="badge bg-${getPaymentModeColor(payment.payment_mode)}">${payment.payment_mode.toUpperCase()}</span></td>
            <td>${formatDate(payment.payment_date)}</td>
        </tr>
    `).join('');
}

// Utility functions
function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    const toastContainer = document.createElement('div');
    toastContainer.innerHTML = toastHtml;
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '80px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    
    document.body.appendChild(toastContainer);
    
    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
}

// Auto-refresh dashboard every 30 seconds
setInterval(loadDashboardData, 30000);
