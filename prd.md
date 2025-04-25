# CNG Slot Booking System - Product Requirements Document (PRD)

## 1. Overview
The CNG Slot Booking System is designed to allow users to book time slots for CNG pumps, avoiding long waiting times and ensuring efficient resource utilization. The system consists of user authentication, slot booking mechanism, and an admin dashboard for management and reporting. **MySQL will be the only external dependency, with all other functionality implemented within the application environment.**

## 2. Authentication System

### 2.1 User Authentication
- **Registration (Sign Up):**
  - Users will provide:
    - Email address (unique identifier)
    - Password (with minimum security requirements)
    - Confirm password (must match password)
  - System will validate inputs and create user record in database
  - Passwords will be hashed using bcrypt before storage
  - Upon successful registration, users will receive a JWT token for authentication

- **Login:**
  - Users enter email and password
  - System validates credentials against database records
  - Upon successful authentication, system issues a JWT token
  - Failed login attempts should be handled with appropriate error messages

### 2.2 Admin Authentication
- **Admin Login:**
  - Separate login page for administrators
  - Fixed credentials:
    - Username: admin
    - Password: 265325
  - No registration option for admin accounts
  - Admin privileges are assigned at database level

## 3. Database Connection

### 3.1 MySQL Configuration
- **MySQL 8.0 will be the only external system integration**
- Connection parameters stored in environment variables:
  ```
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=your_mysql_password
  DB_NAME=cng_slot_booking
  ```
- Direct database connection without relying on external ORMs
- Custom connection pooling implementation if needed

### 3.2 Schema Design
- **Users Table:**
  - id (PK, auto-increment)
  - name (string, required)
  - email (string, required, unique)
  - password (string, hashed, required)
  - role (enum: 'user', 'admin', default: 'user')
  - created_at (timestamp)
  - updated_at (timestamp)

- **Slots Table:**
  - id (PK, auto-increment)
  - date (date, required)
  - start_time (time, required)
  - end_time (time, required)
  - status (enum: 'available', 'booked', 'cancelled', default: 'available')
  - created_at (timestamp)
  - updated_at (timestamp)

- **Bookings Table:**
  - id (PK, auto-increment)
  - user_id (FK to Users, required)
  - slot_id (FK to Slots, required)
  - booking_reference (string, unique)
  - vehicle_number (string, required)
  - status (enum: 'confirmed', 'cancelled', 'completed', default: 'confirmed')
  - created_at (timestamp)
  - updated_at (timestamp)

### 3.3 Connection Setup
- Custom database connector implementation
- Connect at application startup with proper error handling
- Implement error logging through custom logging solution
- Graceful handling of connection failures

## 4. Booking System

### 4.1 Slot Management
- System will display available slots for a selected date
- Slots will have fixed duration (e.g., 15 minutes)
- Slots display should show:
  - Date
  - Time slot (start and end time)
  - Availability status

### 4.2 Booking Process
- Only authenticated users can book slots
- User selects date and available time slot
- User provides vehicle information
- System checks availability before confirming booking
- Upon confirmation, user receives booking reference

### 4.3 Concurrency and Conflict Management
- **Preventing Double Booking by Same User:**
  - Database validation to prevent user from booking same time slot twice
  - Frontend validation to disable already booked slots for user

- **Handling Concurrent Bookings:**
  - Implement database transactions to ensure data integrity
  - Use MySQL's built-in transaction and locking capabilities
  - Implement row-level locking for the slot being booked
  - First user to complete transaction gets the slot
  - Second user receives "slot no longer available" message

- **Edge Cases Handling:**
  - Slot becomes unavailable during booking process
  - Network interruptions during booking
  - Booking cancellation processes

## 5. Admin Dashboard

### 5.1 Features
- Overview of all bookings with filtering options
- User management capabilities
- Slot management (create, update, delete slots)
- Analytics and reporting

### 5.2 Data Export Functionality
- **Export to Excel:**
  - Custom implementation using Node.js CSV generation
  - No external libraries required
  - Allow filtering before export (date range, status)
  - Include all relevant booking data in structured format
  - Proper file naming convention with date stamp
  - Protected download via authentication

- **Export to PDF:**
  - Custom PDF generation using HTML-to-PDF conversion
  - Implementation within the application environment
  - Summary statistics at top of report
  - Detailed booking data in tabular format
  - Option for landscape/portrait orientation

### 5.3 Admin Controls
- Enable/disable specific slots
- Block certain time periods for maintenance
- Override bookings in exceptional cases
- View system logs and activity

## 6. Security Considerations

### 6.1 Authentication Security
- Custom JWT implementation for token management
- HTTPS for all communications
- Custom rate limiting implementation
- Input validation on all endpoints
- XSS and CSRF protection using built-in methods

### 6.2 Database Security
- Prepared statements to prevent SQL injection
- Encrypted sensitive data
- Proper indexing for performance
- Regular backups

## 7. Technical Implementation

### 7.1 Backend Implementation
- Node.js with Express framework
- Custom database access layer for MySQL
- Custom JWT implementation for authentication
- Custom logging solution
- Custom rate limiting implementation
- Error handling middleware

### 7.2 Frontend Implementation
- Custom UI components without external dependencies
- Custom state management solution
- Custom form handling and validation
- CSS styling without external frameworks
- Custom AJAX implementation for API communication

## 8. Deployment Considerations
- Environment variables for configuration
- Database migration strategy through custom scripts
- Custom deployment scripts
- Self-contained monitoring and logging

## 9. Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Load testing for concurrency handling
- Security testing

## 10. Future Enhancements
- Mobile application using the same codebase
- Custom notification system
- QR code generation for booking verification
- Rating system for service quality 