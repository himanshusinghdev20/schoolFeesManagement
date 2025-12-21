// Receipts Management JavaScript
const API_URL = 'http://localhost:3000/api';
let currentReceiptId = null;

// Load receipts on page load
document.addEventListener('DOMContentLoaded', function() {
    loadReceipts();
});

// Load all receipts
async function loadReceipts() {
    try {
        const response = await fetch(`${API_URL}/receipts`);
        const result = await response.json();
        
        if (result.success) {
            displayReceipts(result.data);
        }
    } catch (error) {
        console.error('Error loading receipts:', error);
        showToast('Error loading receipts', 'danger');
    }
}

// Display receipts in table
function displayReceipts(receipts) {
    const tbody = document.getElementById('receiptsTable');
    
    if (receipts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No receipts found</td></tr>';
        return;
    }
    
    tbody.innerHTML = receipts.map(receipt => `
        <tr>
            <td><strong>${receipt.receipt_number}</strong></td>
            <td>${formatDate(receipt.receipt_date)}</td>
            <td>${receipt.student_name}</td>
            <td>${receipt.roll_number}</td>
            <td class="text-success fw-bold">₹${formatCurrency(receipt.total_amount)}</td>
            <td><span class="badge bg-${getPaymentModeColor(receipt.payment_mode)}">${receipt.payment_mode.toUpperCase()}</span></td>
            <td class="text-${receipt.balance_remaining > 0 ? 'danger' : 'success'}">₹${formatCurrency(receipt.balance_remaining)}</td>
            <td><span class="badge bg-${receipt.status === 'active' ? 'success' : 'danger'}">${receipt.status.toUpperCase()}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewReceipt(${receipt.receipt_id})" title="View Receipt">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="printReceiptDirect(${receipt.receipt_id})" title="Print">
                    <i class="fas fa-print"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="downloadReceiptPDFDirect(${receipt.receipt_id})" title="Download PDF">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Search receipt
async function searchReceipt() {
    const receiptNumber = document.getElementById('searchReceipt').value.trim();
    
    if (!receiptNumber) {
        showToast('Please enter receipt number', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/receipts/number/${receiptNumber}`);
        const result = await response.json();
        
        if (result.success) {
            displayReceipts([result.data]);
            showToast('Receipt found', 'success');
        } else {
            showToast('Receipt not found', 'danger');
            loadReceipts();
        }
    } catch (error) {
        console.error('Error searching receipt:', error);
        showToast('Error searching receipt', 'danger');
    }
}

// View receipt details
async function viewReceipt(receiptId) {
    try {
        const response = await fetch(`${API_URL}/receipts/${receiptId}`);
        const result = await response.json();
        
        if (result.success) {
            currentReceiptId = receiptId;
            displayReceiptDetails(result.data);
            const modal = new bootstrap.Modal(document.getElementById('viewReceiptModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error loading receipt:', error);
        showToast('Error loading receipt details', 'danger');
    }
}

// Display receipt details
function displayReceiptDetails(data) {
    const receipt = data.receipt;
    const institute = data.institute;
    
    const receiptHtml = `
        <div class="receipt-header">
            <h2>${institute.institute_name}</h2>
            <p>${institute.institute_address}</p>
            <p>Phone: ${institute.institute_phone} | Email: ${institute.institute_email}</p>
            <p>GST No: ${institute.gst_number}</p>
            <hr>
            <h4>FEE RECEIPT</h4>
            <p><strong>Receipt No:</strong> ${receipt.receipt_number}</p>
            <p><strong>Date:</strong> ${formatDate(receipt.receipt_date)}</p>
        </div>
        
        <div class="receipt-body">
            <div class="receipt-row">
                <strong>Student Name:</strong>
                <span>${receipt.student_name}</span>
            </div>
            <div class="receipt-row">
                <strong>Roll Number:</strong>
                <span>${receipt.roll_number}</span>
            </div>
            <div class="receipt-row">
                <strong>Course:</strong>
                <span>${receipt.course}</span>
            </div>
            <div class="receipt-row">
                <strong>Fee Type:</strong>
                <span>${receipt.fee_type ? receipt.fee_type.toUpperCase() : 'N/A'}</span>
            </div>
            <div class="receipt-row">
                <strong>Payment Mode:</strong>
                <span>${receipt.payment_mode.toUpperCase()}</span>
            </div>
            ${receipt.transaction_id ? `
            <div class="receipt-row">
                <strong>Transaction ID:</strong>
                <span>${receipt.transaction_id}</span>
            </div>
            ` : ''}
            ${receipt.cheque_number ? `
            <div class="receipt-row">
                <strong>Cheque Number:</strong>
                <span>${receipt.cheque_number}</span>
            </div>
            ` : ''}
            <hr>
            <div class="receipt-row">
                <strong>Amount Paid:</strong>
                <span class="text-success" style="font-size: 1.3em;"><strong>₹${formatCurrency(receipt.total_amount)}</strong></span>
            </div>
            <div class="receipt-row">
                <strong>Amount in Words:</strong>
                <span>${receipt.amount_in_words}</span>
            </div>
            <div class="receipt-row">
                <strong>Balance Remaining:</strong>
                <span class="${receipt.balance_remaining > 0 ? 'text-danger' : 'text-success'}">
                    <strong>₹${formatCurrency(receipt.balance_remaining)}</strong>
                </span>
            </div>
        </div>
        
        <div class="receipt-footer">
            <p><strong>Issued By:</strong> ${receipt.issued_by}</p>
            <div class="signature-line">
                <strong>Authorized Signature</strong>
            </div>
            <p class="text-center mt-3"><small>This is a computer-generated receipt and does not require a physical signature.</small></p>
        </div>
    `;
    
    document.getElementById('receiptContent').innerHTML = receiptHtml;
}

// Print receipt
function printReceipt() {
    window.print();
}

// Print receipt directly
async function printReceiptDirect(receiptId) {
    await viewReceipt(receiptId);
    setTimeout(() => {
        window.print();
    }, 500);
}

// Download receipt as PDF
function downloadReceiptPDF() {
    const element = document.getElementById('receiptContent');
    const receiptNumber = element.querySelector('.receipt-header p strong').parentElement.textContent.split(':')[1].trim();
    
    const opt = {
        margin: 0.5,
        filename: `Receipt_${receiptNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
    showToast('Receipt downloaded successfully', 'success');
}

// Download receipt PDF directly
async function downloadReceiptPDFDirect(receiptId) {
    await viewReceipt(receiptId);
    setTimeout(() => {
        downloadReceiptPDF();
    }, 500);
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
