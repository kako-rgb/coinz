const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        console.log('🔄 Attempting to connect to MongoDB...');
        await client.connect();
        
        // Check if the server is running
        await client.db('admin').command({ ping: 1 });
        console.log('✅ Successfully connected to MongoDB!');
        
        // List all databases
        const databases = await client.db().admin().listDatabases();
        console.log('📋 Available databases:');
        databases.databases.forEach(db => console.log(`- ${db.name}`));
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        if (error.name === 'MongoServerError') {
            console.error('Error code:', error.code);
            console.error('Error code name:', error.codeName);
        }
    } finally {
        await client.close();
    }
}

testConnection();
