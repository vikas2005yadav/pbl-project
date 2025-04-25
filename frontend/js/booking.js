// API URL - update this with your backend URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    const bookingDate = document.getElementById('booking-date');
    const loadSlotsBtn = document.getElementById('load-slots-btn');
    const slotsList = document.getElementById('slots-list');
    const bookingForm = document.getElementById('booking-form');
    const vehicleNumberInput = document.getElementById('vehicle-number');
    const selectedDateSpan = document.getElementById('selected-date');
    const selectedTimeSpan = document.getElementById('selected-time');
    const bookingFormContainer = document.getElementById('booking-form-container');
    
    // Set minimum date to today
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7); // Allow booking up to 7 days in advance
    
    bookingDate.min = today.toISOString().split('T')[0];
    bookingDate.max = maxDate.toISOString().split('T')[0];
    bookingDate.value = today.toISOString().split('T')[0];

    // Load slots when button is clicked
    loadSlotsBtn.addEventListener('click', async function() {
        const date = bookingDate.value;
        if (!date) {
            showAlert('Please select a date first', 'error');
            return;
        }

        try {
            slotsList.innerHTML = '<div class="loading">Loading available slots...</div>';
            
            const response = await fetch(`${API_URL}/slots/date/${date}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error loading slots');
            }

            displaySlots(data.data);
            selectedDateSpan.textContent = new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            showAlert(error.message, 'error');
            slotsList.innerHTML = '<div class="error">Failed to load slots. Please try again.</div>';
        }
    });

    function displaySlots(slots) {
        if (!slots || slots.length === 0) {
            slotsList.innerHTML = '<div class="no-slots">No slots available for this date</div>';
            return;
        }

        slotsList.innerHTML = '';
        slots.forEach(slot => {
            const slotCard = document.createElement('div');
            slotCard.classList.add('slot-card');
            slotCard.dataset.slotId = slot.id;
            
            const startTime = new Date(`2000-01-01T${slot.start_time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });
            const endTime = new Date(`2000-01-01T${slot.end_time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });

            slotCard.innerHTML = `
                <div class="time">${startTime} - ${endTime}</div>
                <div class="status">Available</div>
            `;

            slotCard.addEventListener('click', function() {
                document.querySelectorAll('.slot-card').forEach(card => card.classList.remove('selected'));
                this.classList.add('selected');
                selectedTimeSpan.textContent = `${startTime} - ${endTime}`;
                bookingFormContainer.style.display = 'block';
            });

            slotsList.appendChild(slotCard);
        });
    }

    // Handle booking form submission
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const selectedSlot = document.querySelector('.slot-card.selected');
        if (!selectedSlot) {
            showAlert('Please select a time slot', 'error');
            return;
        }

        const vehicleNumber = vehicleNumberInput.value.trim();
        if (!validateVehicleNumber(vehicleNumber)) {
            showAlert('Please enter a valid vehicle number', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    slot_id: selectedSlot.dataset.slotId,
                    vehicle_number: vehicleNumber,
                    date: bookingDate.value
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create booking');
            }

            // Redirect to success page with booking details
            window.location.href = `booking-success.html?booking_id=${data.data.id}`;
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });

    // Helper functions
    function validateVehicleNumber(number) {
        // Update regex pattern based on your vehicle number format requirements
        const pattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
        return pattern.test(number);
    }

    function showAlert(message, type) {
        const alertElement = document.createElement('div');
        alertElement.classList.add('alert', `alert-${type}`);
        alertElement.textContent = message;

        const container = document.querySelector('.booking-container');
        container.insertBefore(alertElement, container.firstChild);

        setTimeout(() => alertElement.remove(), 5000);
    }
});