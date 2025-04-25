# CNG Pump Slot Booking System

A simple web-based CNG pump slot booking system with frontend-only implementation using HTML, CSS, and JavaScript. The system uses browser's localStorage for data persistence.

## Project Structure

```
frontend/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   └── booking.js
└── pages/
    ├── booking.html
    └── booking-success.html
```

## Features

- CNG Pump Selection
- Date and Time Slot Booking
- Booking Confirmation
- Local Storage Data Persistence
- Responsive Design

## Implementation Details

### 1. Booking System

#### Files:
- `frontend/pages/booking.html`: Main booking interface
- `frontend/js/booking.js`: Booking logic
- `frontend/pages/booking-success.html`: Booking confirmation page

#### Features:
- CNG pump selection from available stations
- Date picker (7 days range)
- Time slot selection
- Booking summary with confirmation
- Local storage for booking history

### 2. UI Components

#### Navigation Bar
```html
<nav class="navbar">
    <div class="container">
        <div class="logo">
            <h1>CNG Booking</h1>
        </div>
        <ul class="nav-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="pages/booking.html">Book Slot</a></li>
        </ul>
    </div>
</nav>
```

#### Booking Form
```html
<form id="booking-form" class="booking-form">
    <div class="form-section">
        <h2>Select CNG Pump</h2>
        <div class="pump-list" id="pump-list">
            <!-- Pumps are dynamically loaded -->
        </div>
    </div>

    <div class="form-section">
        <h2>Select Date & Time</h2>
        <div class="date-time-section">
            <div class="form-group">
                <label for="booking-date">Select Date</label>
                <input type="date" id="booking-date" required>
            </div>
            <div class="form-group">
                <label>Available Time Slots</label>
                <div class="time-slots" id="time-slots">
                    <!-- Time slots are dynamically loaded -->
                </div>
            </div>
        </div>
    </div>

    <div class="booking-summary">
        <h3>Booking Summary</h3>
        <div id="summary-details">
            <p><strong>Selected Pump:</strong> <span id="summary-pump">Not selected</span></p>
            <p><strong>Date:</strong> <span id="summary-date">Not selected</span></p>
            <p><strong>Time:</strong> <span id="summary-time">Not selected</span></p>
        </div>
        <button type="submit" class="book-btn">Confirm Booking</button>
    </div>
</form>
```

### 3. Data Storage

The system uses browser's localStorage to store booking history.

#### Storage Structure:
```javascript
// Booking object structure
const booking = {
    bookingId: Date.now(),
    pump: "CNG Pump Station 1",
    date: "March 15, 2024",
    time: "10:00 AM",
    createdAt: new Date().toISOString()
};

// Storing bookings
const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
bookings.push(booking);
localStorage.setItem('bookings', JSON.stringify(bookings));
```

### 4. CSS Styling

Key CSS classes and their purposes:

```css
/* Container Styles */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

/* Form Styles */
.form-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group input {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 5px;
}

/* Pump Selection Styles */
.pump-item {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
    cursor: pointer;
    transition: transform 0.2s;
}

.pump-item:hover {
    transform: translateY(-2px);
}

.pump-item.active {
    border: 2px solid var(--primary-color);
}

/* Time Slot Styles */
.time-slots {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
}

.time-slot {
    text-align: center;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
}

.time-slot.active {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

/* Button Styles */
.book-btn {
    width: 100%;
    padding: 1rem 2rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
}

.book-btn:hover {
    background-color: var(--secondary-color);
}

/* Summary Styles */
.booking-summary {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 2rem;
}

#summary-details p {
    margin: 0.5rem 0;
}
```

## Setup Instructions

1. Clone the repository
2. Open the project in a web server (local or hosted)
3. Navigate to `index.html`
4. Start booking your CNG slot!

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- This is a frontend-only implementation
- All booking data is stored in browser's localStorage
- No backend/database integration required
- Console messages will show booking confirmations and storage updates 