// Show selected section and hide others
const showSection = (sectionId) => {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update active link
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Determine which link to activate
    let activeLink;
    switch (sectionId) {
        case 'home-section':
            activeLink = document.getElementById('home-link');
            break;
        case 'auth-section':
            activeLink = document.getElementById('login-register-link');
            break;
        case 'booking-section':
            activeLink = document.getElementById('booking-link');
            break;
        case 'my-bookings-section':
            activeLink = document.getElementById('my-bookings-link');
            break;
    }
    
    if (activeLink) {
        activeLink.classList.add('active');
    }
};

// Initialize app
const initApp = () => {
    // Set up navigation
    document.getElementById('home-link').addEventListener('click', () => showSection('home-section'));
    document.getElementById('booking-link').addEventListener('click', () => {
        if (isAuthenticated()) {
            showSection('booking-section');
            // Refresh slots if date is selected
            if (document.getElementById('booking-date').value) {
                loadSlots();
            }
        } else {
            showSection('auth-section');
        }
    });
    document.getElementById('my-bookings-link').addEventListener('click', () => {
        if (isAuthenticated()) {
            showSection('my-bookings-section');
            loadMyBookings();
        } else {
            showSection('auth-section');
        }
    });
    document.getElementById('login-register-link').addEventListener('click', () => showSection('auth-section'));
    
    // Add event listener for the Book Now button
    document.getElementById('book-now-btn').addEventListener('click', () => {
        if (isAuthenticated()) {
            showSection('booking-section');
            if (document.getElementById('booking-date').value) {
                loadSlots();
            }
        } else {
            showSection('auth-section');
        }
    });
    
    // Check authentication status and update UI
    updateAuthUI();
    
    // Show home section by default
    showSection('home-section');
};

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', initApp); 