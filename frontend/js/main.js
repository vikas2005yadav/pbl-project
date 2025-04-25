// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const authLinks = document.querySelector('.auth-links');
const userProfile = document.querySelector('.user-profile');

// Toggle mobile menu - only if elements exist
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
}

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        showAuthenticatedUI();
    } else {
        showUnauthenticatedUI();
    }
});

// Show authenticated UI elements
function showAuthenticatedUI() {
    if (authLinks) authLinks.classList.add('hidden');
    if (userProfile) userProfile.classList.remove('hidden');
}

// Show unauthenticated UI elements
function showUnauthenticatedUI() {
    if (authLinks) authLinks.classList.remove('hidden');
    if (userProfile) userProfile.classList.add('hidden');
}

// Handle logout
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showUnauthenticatedUI();
        window.location.href = '/';
    });
}

// API Base URL
const API_BASE_URL = 'http://localhost:4000/api';

// Generic fetch function with authentication
async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Something went wrong');
        }

        return await response.json();
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// Toast notification system
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger reflow
    toast.offsetHeight;

    // Add visible class
    toast.classList.add('visible');

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add toast styles
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 5px;
        color: white;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        z-index: 1000;
    }

    .toast.visible {
        opacity: 1;
        transform: translateY(0);
    }

    .toast-info {
        background-color: #3498db;
    }

    .toast-success {
        background-color: #2ecc71;
    }

    .toast-error {
        background-color: #e74c3c;
    }

    .toast-warning {
        background-color: #f1c40f;
    }
`;
document.head.appendChild(style);

// Export functions for use in other scripts
window.app = {
    fetchWithAuth,
    showToast,
    showAuthenticatedUI,
    showUnauthenticatedUI,
    API_BASE_URL
}; 