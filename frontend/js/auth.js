// API URL
const API_URL = 'http://localhost:4000/api';

// Token storage
const AUTH_TOKEN_KEY = 'cng_auth_token';
const USER_DATA_KEY = 'cng_user_data';

// Check if user is authenticated
const isAuthenticated = () => {
    return localStorage.getItem(AUTH_TOKEN_KEY) !== null;
};

// Get current user data
const getCurrentUser = () => {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
};

// Set authentication data
const setAuthData = (token, user) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    updateAuthUI();
};

// Clear authentication data
const clearAuthData = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    updateAuthUI();
};

// Update UI based on authentication status
const updateAuthUI = () => {
    const loginRegisterLink = document.getElementById('login-register-link');
    const logoutLink = document.getElementById('logout-link');
    const bookingLink = document.getElementById('booking-link');
    const myBookingsLink = document.getElementById('my-bookings-link');
    
    if (isAuthenticated()) {
        loginRegisterLink.style.display = 'none';
        logoutLink.style.display = 'block';
        bookingLink.style.display = 'block';
        myBookingsLink.style.display = 'block';
    } else {
        loginRegisterLink.style.display = 'block';
        logoutLink.style.display = 'none';
        bookingLink.style.display = 'none';
        myBookingsLink.style.display = 'none';
    }
};

// Get authentication token
const getAuthToken = () => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

// Handle login form submission
const handleLogin = async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Save token and user data
        setAuthData(data.token, data.user);
        
        // Reset form and error message
        document.getElementById('login-form').reset();
        errorElement.textContent = '';
        
        // Switch to home section
        showSection('home-section');
        
    } catch (error) {
        errorElement.textContent = error.message;
    }
};

// Handle registration form submission
const handleRegister = async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorElement = document.getElementById('register-error');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        // Save token and user data
        setAuthData(data.token, data.user);
        
        // Reset form and error message
        document.getElementById('register-form').reset();
        errorElement.textContent = '';
        
        // Switch to home section
        showSection('home-section');
        
    } catch (error) {
        errorElement.textContent = error.message;
    }
};

// Handle logout
const handleLogout = () => {
    clearAuthData();
    showSection('home-section');
};

// Auth tab switching
const setupAuthTabs = () => {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });
    
    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });
};

// Initialize auth functionality
const initAuth = () => {
    // Setup form event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('logout-link').addEventListener('click', handleLogout);
    
    // Setup auth tabs
    setupAuthTabs();
    
    // Update UI based on auth status
    updateAuthUI();
};

// Initialize auth on DOM load
document.addEventListener('DOMContentLoaded', initAuth);

// Protect routes that require authentication
function protectRoute() {
    if (!isAuthenticated() && !window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
        window.location.href = window.location.href.includes('/pages/') ? 'login.html' : 'pages/login.html';
    }
}

// Call protectRoute on booking page
if (window.location.href.includes('booking.html')) {
    protectRoute();
}

// Handle password visibility toggle
const togglePasswordButtons = document.querySelectorAll('.toggle-password');
togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
        const input = document.querySelector(button.getAttribute('data-target'));
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        button.innerHTML = type === 'password' ? 
            '<i class="fas fa-eye"></i>' : 
            '<i class="fas fa-eye-slash"></i>';
    });
});

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.validity.valid) {
                input.classList.remove('invalid');
                input.classList.add('valid');
            } else {
                input.classList.remove('valid');
                input.classList.add('invalid');
            }
        });
    });
}

validateForm('login-form');
validateForm('register-form'); 