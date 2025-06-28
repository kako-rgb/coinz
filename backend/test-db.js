const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabaseConnection() {
    console.log('=== Starting Database Connection Test ===');
    
    // Get MongoDB URI from environment variables
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ Error: MONGO_URI is not defined in environment variables');
        process.exit(1);
    }
    
    console.log('Connecting to MongoDB...');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Successfully connected to MongoDB');
        
        // Test a simple query
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('\nAvailable collections:');
        collections.forEach(coll => console.log(`- ${coll.name}`));
        
        // Test user collection if it exists
        if (collections.some(c => c.name === 'users')) {
            const userCount = await db.collection('users').countDocuments();
            console.log(`\nTotal users in database: ${userCount}`);
        }
        
        // Close the connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
}

// Run the test
testDatabaseConnection().catch(console.error);
