const { query, getConnection, initializeDatabase } = require('./config/database');

async function insertSampleData() {
    try {
        const connection = await getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Insert sample stations
            await connection.query(`
                INSERT INTO stations (name, address, rating, avg_wait_time) VALUES
                ('CNG Station 1', '123 Main St, City', 4.5, 15),
                ('CNG Station 2', '456 Oak Ave, City', 4.2, 20),
                ('CNG Station 3', '789 Pine Rd, City', 4.0, 25)
            `);
            
            // Insert sample time slots
            const timeSlots = [
                '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00',
                '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00'
            ];
            
            for (const time of timeSlots) {
                await connection.query('INSERT INTO time_slots (slot_time, max_bookings) VALUES (?, ?)', [time, 5]);
            }
            
            await connection.commit();
            console.log('Sample data inserted successfully!');
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error inserting sample data:', error);
    }
}

// Initialize database and insert sample data
async function setup() {
    try {
        await initializeDatabase();
        // Check if sample data exists
        const stations = await query('SELECT COUNT(*) as count FROM stations');
        if (stations[0].count === 0) {
            await insertSampleData();
        } else {
            console.log('Sample data already exists. Skipping insertion.');
        }
        console.log('Database setup completed successfully!');
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

setup(); 