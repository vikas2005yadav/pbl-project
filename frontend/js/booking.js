// DOM Elements
const bookingForm = document.getElementById('booking-form');
const pumpList = document.getElementById('pump-list');
const bookingDate = document.getElementById('booking-date');
const timeSlots = document.getElementById('time-slots');
const summaryPump = document.getElementById('summary-pump');
const summaryDate = document.getElementById('summary-date');
const summaryTime = document.getElementById('summary-time');

// Sample pump data
const pumps = [
    { id: 1, name: 'CNG Pump Station 1', location: 'Main Street, City Center' },
    { id: 2, name: 'CNG Pump Station 2', location: 'Highway Road, Industrial Area' },
    { id: 3, name: 'CNG Pump Station 3', location: 'Ring Road, Suburb Area' }
];

// Sample time slots
const availableSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM'
];

// Initialize booking page
document.addEventListener('DOMContentLoaded', function() {
    const pumpList = document.getElementById('pump-list');
    const bookingDate = document.getElementById('booking-date');
    const timeSlots = document.getElementById('time-slots');
    const bookingForm = document.getElementById('booking-form');

    // Set date constraints
    if (bookingDate) {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 7);
        
        bookingDate.min = today.toISOString().split('T')[0];
        bookingDate.max = maxDate.toISOString().split('T')[0];
        
        bookingDate.addEventListener('change', function() {
            const formattedDate = new Date(this.value).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            // Ensure elements exist before accessing them
            if (document.getElementById('summary-date')) {
                document.getElementById('summary-date').textContent = formattedDate;
            }
            console.log('Date selected:', formattedDate);
        });
    }

    // Load pump list
    if (pumpList) {
        pumps.forEach(pump => {
            const pumpDiv = document.createElement('div');
            pumpDiv.className = 'pump-item';
            pumpDiv.innerHTML = `
                <h3>${pump.name}</h3>
                <p>${pump.location}</p>
                <button type="button" class="select-pump" data-pump-id="${pump.id}">Select</button>
            `;
            pumpList.appendChild(pumpDiv);
        });

        // Handle pump selection
        pumpList.addEventListener('click', function(e) {
            if (e.target.classList.contains('select-pump')) {
                const pumpId = e.target.dataset.pumpId;
                const selectedPump = pumps.find(p => p.id === parseInt(pumpId));
                
                // Update UI
                document.querySelectorAll('.pump-item').forEach(item => {
                    item.classList.remove('active');
                });
                e.target.closest('.pump-item').classList.add('active');
                
                // Update summary
                document.getElementById('summary-pump').textContent = selectedPump.name;
                console.log('Pump selected:', selectedPump.name);
            }
        });
    }

    // Load time slots
    if (timeSlots) {
        availableSlots.forEach(slot => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'time-slot';
            slotDiv.innerHTML = slot;
            slotDiv.addEventListener('click', function() {
                // Update UI
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                
                // Update summary
                document.getElementById('summary-time').textContent = slot;
                console.log('Time slot selected:', slot);
            });
            timeSlots.appendChild(slotDiv);
        });
    }

    // Handle form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const selectedPump = document.getElementById('summary-pump').textContent;
            const selectedDate = document.getElementById('summary-date').textContent;
            const selectedTime = document.getElementById('summary-time').textContent;

            // Validate selections
            if (selectedPump === 'Not selected' || selectedDate === 'Not selected' || selectedTime === 'Not selected') {
                console.error('Please select all booking details');
                alert('Please select all booking details (Pump, Date, and Time)');
                return;
            }

            // Create booking object
            const booking = {
                bookingId: Date.now(),
                pump: selectedPump,
                date: selectedDate,
                time: selectedTime,
                createdAt: new Date().toISOString()
            };

            // Save to localStorage
            const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            bookings.push(booking);
            localStorage.setItem('bookings', JSON.stringify(bookings));

            console.log('Booking saved successfully:', booking);
            alert('Booking confirmed! Your booking ID is: ' + booking.bookingId);

            // Redirect to success page
            window.location.href = 'booking-success.html';
        });
    }
});