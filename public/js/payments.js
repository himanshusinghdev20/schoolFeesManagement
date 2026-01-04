// Payments Management JavaScript
const API_URL = 'http://localhost:3000/api';
let selectedFeeDetails = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadPayments();
    loadTodaySummary();
    
    // Set default payment date to today
    document.querySelector('input[name="payment_date"]').value = new Date().toISOString().split('T')[0];
    
    // Student search functionality
    document.getElementById('studentSearch').addEventListener('input', debounce(function(e) {
        const term = e.target.value;
        if (term.length >= 2) {
            searchStudents(term);
        } else {
            document.getElementById('studentSearchResults').innerHTML = '';
        }
    }, 300));
    
    // Payment mode change handler
    document.getElementById('paymentMode').addEventListener('change', function(e) {
        const mode = e.target.value;
        document.getElementById('transactionIdDiv').style.display = 
            (mode === 'upi' || mode === 'card' || mode === 'bank_transfer') ? 'block' : 'none';
        document.getElementById('chequeNumberDiv').style.display = 
            (mode === 'cheque') ? 'block' : 'none';
    });
});

// Load all payments
async function loadPayments() {
    try {
        const response = await fetch(`${API_URL}/payments`);
        const result = await response.json();
        
        if (result.success) {
            displayPayments(result.data);
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        showToast('Error loading payments', 'danger');
    }
}

// Load today's summary
async function loadTodaySummary() {
    try {
        const response = await fetch(`${API_URL}/payments/today/summary`);
        const result = await response.json();
        
        if (result.success) {
            const summary = result.data.summary;
            const total = result.data.total;
            
            // Reset all totals
            document.getElementById('cashTotal').textContent = '0';
            document.getElementById('upiTotal').textContent = '0';
            document.getElementById('cardTotal').textContent = '0';
            
            // Update each payment mode
            summary.forEach(item => {
                const elementId = item.payment_mode + 'Total';
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = formatCurrency(item.total);
                }
            });
            
            document.getElementById('todayTotal').textContent = formatCurrency(total);
        }
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Display payments in table
function displayPayments(payments) {
    const tbody = document.getElementById('paymentsTable');
    
    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No payments recorded</td></tr>';
        return;
    }
    
    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td><strong>#${payment.payment_id}</strong></td>
            <td>${formatDate(payment.payment_date)}</td>
            <td>${payment.student_name}</td>
            <td>${payment.roll_number}</td>
            <td><span class="badge bg-secondary">${payment.fee_type}</span></td>
            <td class="text-success fw-bold">₹${formatCurrency(payment.amount_paid)}</td>
            <td><span class="badge bg-${getPaymentModeColor(payment.payment_mode)}">${payment.payment_mode.toUpperCase()}</span></td>
            <td>${payment.transaction_id || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="generateReceipt(${payment.payment_id})" title="Generate Receipt">
                    <i class="fas fa-receipt"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="viewPaymentDetails(${payment.payment_id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Search students
async function searchStudents(term) {
    try {
        const response = await fetch(`${API_URL}/students/search/${term}`);
        const result = await response.json();
        
        if (result.success) {
            displaySearchResults(result.data);
        }
    } catch (error) {
        console.error('Error searching students:', error);
    }
}

// Display search results
function displaySearchResults(students) {
    const resultsDiv = document.getElementById('studentSearchResults');
    
    if (students.length === 0) {
        resultsDiv.innerHTML = '<div class="list-group-item">No students found</div>';
        return;
    }
    
    resultsDiv.innerHTML = students.map(student => `
        <a href="#" class="list-group-item list-group-item-action" onclick="selectStudent(${student.student_id}, '${student.student_name}', '${student.roll_number}'); return false;">
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${student.student_name}</strong><br>
                    <small class="text-muted">${student.roll_number} - ${student.course}</small>
                </div>
                <div class="text-end">
                    <small class="text-danger">Pending: ₹${formatCurrency(student.total_pending)}</small>
                </div>
            </div>
        </a>
    `).join('');
}

// Select student and load fees
async function selectStudent(studentId, studentName, rollNumber) {
    document.getElementById('selectedStudentId').value = studentId;
    document.getElementById('studentSearch').value = `${studentName} (${rollNumber})`;
    document.getElementById('studentSearchResults').innerHTML = '';
    
    // Load student's fees
    try {
        const response = await fetch(`${API_URL}/fees/student/${studentId}`);
        const result = await response.json();
        
        if (result.success) {
            const feeSelect = document.getElementById('feeSelect');
            feeSelect.disabled = false;
            
            const pendingFees = result.data.filter(fee => fee.pending_amount > 0);
            
            if (pendingFees.length === 0) {
                feeSelect.innerHTML = '<option value="">No pending fees</option>';
                return;
            }
            
            feeSelect.innerHTML = '<option value="">Select fee type</option>' + 
                pendingFees.map(fee => `
                    <option value="${fee.fee_id}" data-pending="${fee.pending_amount}">
                        ${fee.fee_type.toUpperCase()} - Pending: ₹${formatCurrency(fee.pending_amount)}
                    </option>
                `).join('');
            
            feeSelect.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                const pending = selectedOption.getAttribute('data-pending');
                document.getElementById('pendingAmount').textContent = formatCurrency(pending);
                document.getElementById('amountPaid').max = pending;
            });
        }
    } catch (error) {
        console.error('Error loading fees:', error);
    }
}

// Record payment
async function recordPayment() {
    const form = document.getElementById('recordPaymentForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    console.log('📝 Payment form data:', data);
    
    // Validation
    if (!data.student_id || !data.fee_id || !data.amount_paid || !data.payment_mode || !data.payment_date) {
        showToast('Please fill all required fields', 'warning');
        return;
    }
    
    if (parseFloat(data.amount_paid) <= 0) {
        showToast('Amount must be greater than zero', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Payment recorded successfully', 'success');
            
            // Generate receipt automatically
            const paymentId = result.payment_id;
            const studentId = data.student_id;
            
            console.log('💰 Payment successful! Payment ID:', paymentId, 'Student ID:', studentId);
            await generateReceiptAfterPayment(paymentId, studentId, data.amount_paid);
            
            bootstrap.Modal.getInstance(document.getElementById('recordPaymentModal')).hide();
            form.reset();
            loadPayments();
            loadTodaySummary();
        } else {
            showToast(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        showToast('Error recording payment', 'danger');
    }
}

// Generate receipt after payment
async function generateReceiptAfterPayment(paymentId, studentId, amount) {
    try {
        console.log('Generating receipt for payment:', paymentId, 'student:', studentId, 'amount:', amount);
        
        const receiptData = {
            payment_id: paymentId,
            profile_id: studentId, // Using profile_id
            total_amount: amount,
            issued_by: 'Admin',
            receipt_date: new Date().toISOString().split('T')[0]
        };
        
        const response = await fetch(`${API_URL}/receipts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receiptData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Receipt generated:', result.receipt_number);
            showToast(`Receipt ${result.receipt_number} generated successfully!`, 'success');
            
            // Optional: View receipt after 2 seconds
            setTimeout(() => {
                if (confirm('Receipt generated! Do you want to view it now?')) {
                    window.open(`/receipts.html?id=${result.receipt_id}`, '_blank');
                }
            }, 1000);
        } else {
            console.error('Receipt generation failed:', result.message);
            showToast('Payment recorded but receipt generation failed', 'warning');
        }
    } catch (error) {
        console.error('Error generating receipt:', error);
    }
}

// Generate receipt from payment
async function generateReceipt(paymentId) {
    try {
        const response = await fetch(`${API_URL}/payments/${paymentId}`);
        const result = await response.json();
        
        if (result.success) {
            const payment = result.data;
            await generateReceiptAfterPayment(paymentId, payment.student_id, payment.amount_paid);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error generating receipt', 'danger');
    }
}

// View payment details
function viewPaymentDetails(paymentId) {
    // Redirect to receipt page or show details modal
    window.location.href = `/receipts`;
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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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

// Auto-refresh payments every 30 seconds
setInterval(() => {
    loadPayments();
    loadTodaySummary();
}, 30000);
