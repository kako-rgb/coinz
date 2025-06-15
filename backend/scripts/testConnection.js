require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
    try {
        console.log('🔄 Attempting to connect to MongoDB...');
        
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ Successfully connected to MongoDB!');
        console.log('Host:', mongoose.connection.host);
        console.log('Database:', mongoose.connection.name);
        
        // List all collections to verify access
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📋 Available collections:');
        collections.forEach(collection => console.log(`- ${collection.name}`));
        
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        if (error.name === 'MongoServerError') {
            console.error('Error code:', error.code);
            console.error('Error code name:', error.codeName);
        }
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

testConnection();
