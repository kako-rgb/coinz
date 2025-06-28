const mongoose = require('mongoose');

const MAX_RETRIES = 3;
let retryCount = 0;

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MongoDB connection string not found in environment variables');
        }

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // Increased to 10 seconds
            socketTimeoutMS: 45000,
            family: 4, // Use IPv4, skip trying IPv6
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 10, // Maximum number of connections in the connection pool
            connectTimeoutMS: 10000, // Time to wait for connection to be established
            heartbeatFrequencyMS: 10000, // How often to send heartbeat to keep connection alive
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        retryCount = 0; // Reset retry count on successful connection
        return conn;
    } catch (error) {
        retryCount++;
        console.error(`Error connecting to MongoDB (Attempt ${retryCount}/${MAX_RETRIES}):`, {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying connection in 5 seconds... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return connectDB(); // Retry the connection
        }

        console.error('Max retries reached. Exiting process...');
        process.exit(1);
    }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB Atlas');
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

module.exports = connectDB;
