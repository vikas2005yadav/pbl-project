// API URL
const API_URL = 'http://localhost:4000/api';

// Get dashboard statistics
const fetchDashboardStats = async () => {
    try {
        const token = getAdminToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard statistics');
        }

        const data = await response.json();
        
        // Update dashboard statistics
        document.getElementById('total-users').textContent = data.totalUsers || 0;
        document.getElementById('total-bookings').textContent = data.totalBookings || 0;
        document.getElementById('today-bookings').textContent = data.todayBookings || 0;
        document.getElementById('active-stations').textContent = data.activeStations || 0;
        
        // Update booking status chart
        updateStatusChart(data.bookingStatusCounts);
        
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
};

// Update booking status chart
const updateStatusChart = (statusCounts) => {
    const total = statusCounts.confirmed + statusCounts.cancelled + statusCounts.completed;
    
    if (total > 0) {
        const confirmedPercent = (statusCounts.confirmed / total) * 100;
        const cancelledPercent = (statusCounts.cancelled / total) * 100;
        const completedPercent = (statusCounts.completed / total) * 100;
        
        document.getElementById('status-confirmed').style.width = `${confirmedPercent}%`;
        document.getElementById('status-cancelled').style.width = `${cancelledPercent}%`;
        document.getElementById('status-completed').style.width = `${completedPercent}%`;
        
        document.getElementById('status-confirmed').textContent = statusCounts.confirmed;
        document.getElementById('status-cancelled').textContent = statusCounts.cancelled;
        document.getElementById('status-completed').textContent = statusCounts.completed;
    }
};

// Fetch recent bookings
const fetchRecentBookings = async () => {
    try {
        const token = getAdminToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/admin/bookings/recent`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recent bookings');
        }

        const bookings = await response.json();
        
        // Update recent bookings table
        updateRecentBookingsTable(bookings);
        
    } catch (error) {
        console.error('Error fetching recent bookings:', error);
        document.getElementById('recent-bookings-table').innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Error loading bookings. Please try again.</td>
            </tr>
        `;
    }
};

// Update recent bookings table
const updateRecentBookingsTable = (bookings) => {
    const tableBody = document.getElementById('recent-bookings-table');
    
    if (bookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No bookings found.</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${booking.id}</td>
            <td>${booking.userName}</td>
            <td>${booking.stationName}</td>
            <td>${formatDate(booking.date)}</td>
            <td>${booking.time}</td>
            <td>
                <span class="status-badge ${booking.status.toLowerCase()}">
                    ${capitalizeFirstLetter(booking.status)}
                </span>
            </td>
            <td>
                <button class="btn btn-small" onclick="viewBookingDetails(${booking.id})">View</button>
            </td>
        </tr>
    `).join('');
};

// Format date for display
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Capitalize first letter
const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// View booking details
window.viewBookingDetails = (bookingId) => {
    window.location.href = `admin-booking-details.html?id=${bookingId}`;
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Display admin username
    const adminData = JSON.parse(localStorage.getItem('cng_admin_data') || '{}');
    if (adminData.username) {
        document.getElementById('admin-username').textContent = adminData.username;
    }
    
    // Fetch dashboard data
    fetchDashboardStats();
    fetchRecentBookings();
}); 