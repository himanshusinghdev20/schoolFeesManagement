// Students Management JavaScript
const API_URL = 'http://localhost:3000/api';

// Load students on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStudents();
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value;
        if (searchTerm.length >= 2) {
            searchStudents(searchTerm);
        } else if (searchTerm.length === 0) {
            loadStudents();
        }
    });
    
    // Set default admission date to today
    document.querySelector('input[name="admission_date"]').value = new Date().toISOString().split('T')[0];
});

// Load all students
async function loadStudents() {
    try {
        const response = await fetch(`${API_URL}/students`);
        const result = await response.json();
        
        if (result.success) {
            displayStudents(result.data);
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Error loading students', 'danger');
    }
}

// Search students
async function searchStudents(term) {
    try {
        const response = await fetch(`${API_URL}/students/search/${term}`);
        const result = await response.json();
        
        if (result.success) {
            displayStudents(result.data);
        }
    } catch (error) {
        console.error('Error searching students:', error);
    }
}

// Display students in table
function displayStudents(students) {
    const tbody = document.getElementById('studentsTable');
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr>
            <td><strong>${student.roll_number}</strong></td>
            <td>${student.student_name}</td>
            <td>${student.course}</td>
            <td>${student.phone || '-'}</td>
            <td>₹${formatCurrency(student.total_fees)}</td>
            <td class="text-success">₹${formatCurrency(student.total_paid)}</td>
            <td class="text-${student.total_pending > 0 ? 'danger' : 'success'}">₹${formatCurrency(student.total_pending)}</td>
            <td><span class="badge status-${student.status}">${student.status.toUpperCase()}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewStudent(${student.student_id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="openAddFeeModal(${student.student_id})" title="Add Fee">
                    <i class="fas fa-dollar-sign"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editStudent(${student.student_id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Add new student
async function addStudent() {
    const form = document.getElementById('addStudentForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validation
    if (!data.roll_number || !data.student_name || !data.course || !data.admission_date) {
        showToast('Please fill all required fields', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Student added successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
            form.reset();
            loadStudents();
        } else {
            showToast(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error adding student:', error);
        showToast('Error adding student', 'danger');
    }
}

// Open Add Fee Modal
function openAddFeeModal(studentId) {
    document.getElementById('feeStudentId').value = studentId;
    const modal = new bootstrap.Modal(document.getElementById('addFeeModal'));
    modal.show();
}

// Add fee structure
async function addFeeStructure() {
    const form = document.getElementById('addFeeForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    if (!data.student_id || !data.fee_type || !data.total_amount) {
        showToast('Please fill all required fields', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/fees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Fee structure added successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addFeeModal')).hide();
            form.reset();
            loadStudents();
        } else {
            showToast(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error adding fee:', error);
        showToast('Error adding fee structure', 'danger');
    }
}

// View student details
async function viewStudent(studentId) {
    window.location.href = `/students/${studentId}`;
}

// Edit student
async function editStudent(studentId) {
    // This would open an edit modal - simplified for now
    showToast('Edit functionality coming soon', 'info');
}

// Utility functions
function formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
