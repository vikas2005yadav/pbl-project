// API URL
const API_URL = 'http://localhost:4000/api';

// Token storage
const ADMIN_TOKEN_KEY = 'cng_admin_token';
const ADMIN_DATA_KEY = 'cng_admin_data';

// Check if admin is authenticated
const isAdminAuthenticated = () => {
    return localStorage.getItem(ADMIN_TOKEN_KEY) !== null;
};

// Get admin token
const getAdminToken = () => {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
};

// Set admin authentication data
const setAdminAuthData = (token, admin) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(admin));
};

// Clear admin authentication data
const clearAdminAuthData = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_DATA_KEY);
};

// Handle admin login form submission
const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('admin-login-error');
    
    try {
        const response = await fetch(`${API_URL}/auth/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Admin login failed');
        }
        
        // Save token and admin data
        setAdminAuthData(data.token, data.user);
        
        // Redirect to admin dashboard
        window.location.href = 'admin-dashboard.html';
        
    } catch (error) {
        errorElement.textContent = error.message;
    }
};

// Handle admin logout
const handleAdminLogout = () => {
    clearAdminAuthData();
    window.location.href = 'admin-login.html';
};

// Protect admin routes
const protectAdminRoute = () => {
    if (!isAdminAuthenticated()) {
        window.location.href = 'admin-login.html';
    }
};

// Initialize admin authentication
document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin login form
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Initialize admin logout button
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    // Protect admin routes
    if (window.location.pathname.includes('admin-dashboard') || 
        window.location.pathname.includes('admin-users') || 
        window.location.pathname.includes('admin-slots') || 
        window.location.pathname.includes('admin-reports')) {
        protectAdminRoute();
    }
}); 