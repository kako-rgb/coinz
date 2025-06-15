require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('🔌 Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('ℹ️ Admin user already exists');
            console.log('Username: admin');
            console.log('Role: admin');
            process.exit(0);
        }

        // Create new admin user
        const admin = new User({
            username: 'admin',
            password: 'Qwerty12345',
            role: 'admin',
            email: 'admin@coinz.com',
            isVerified: true
        });

        // Save the admin user (password will be hashed by the pre-save hook)
        await admin.save();
        
        console.log('✅ Admin user created successfully');
        console.log('Username: admin');
        console.log('Password: Qwerty12345');
        console.log('Role: admin');
        console.log('\n⚠️ IMPORTANT: Change the default password after first login!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.errors) {
            console.error('Validation errors:', error.errors);
        }
    } finally {
        // Close the connection
        await mongoose.connection.close();
        process.exit(0);
    }
};

createAdminUser();
