// Load available slots based on the selected date
const loadSlots = () => {
    const bookingDate = document.getElementById('booking-date').value;
    if (!bookingDate) {
        alert('Please select a date first.');
        return;
    }

    const slotsList = document.getElementById('slots-list');
    slotsList.innerHTML = ''; // Clear previous slots

    // Simulate fetching slots (replace with API call if needed)
    const availableSlots = [
        '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
        '05:00 PM', '06:00 PM'
    ];

    availableSlots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot';
        slotDiv.textContent = slot;
        slotDiv.addEventListener('click', () => {
            document.getElementById('selected-time').textContent = slot;
            document.getElementById('booking-form-container').style.display = 'block';
        });
        slotsList.appendChild(slotDiv);
    });
};

// Load user's bookings
const loadMyBookings = () => {
    const myBookingsContainer = document.getElementById('my-bookings-container');
    myBookingsContainer.innerHTML = ''; // Clear previous bookings

    // Simulate fetching bookings (replace with API call if needed)
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');

    if (bookings.length === 0) {
        document.getElementById('no-bookings-message').style.display = 'block';
        return;
    }

    document.getElementById('no-bookings-message').style.display = 'none';

    bookings.forEach(booking => {
        const bookingDiv = document.createElement('div');
        bookingDiv.className = 'booking';
        bookingDiv.innerHTML = `
            <p><strong>Pump:</strong> ${booking.pump}</p>
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
        `;
        myBookingsContainer.appendChild(bookingDiv);
    });
};

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