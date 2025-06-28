require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUser(phoneNumber) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Find user by phone number (trying multiple formats)
        const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        
        console.log('Searching for user with phone number variations:', {
            original: phoneNumber,
            normalized: normalizedPhone,
            clean: cleanPhone
        });

        const users = await User.find({
            $or: [
                { phoneNumber: phoneNumber },
                { phoneNumber: normalizedPhone },
                { phoneNumber: cleanPhone },
                { phoneNumber: phoneNumber.replace(/^0/, '+254') },
                { phoneNumber: phoneNumber.replace(/^0/, '254') },
                { phoneNumber: phoneNumber.replace(/^\+?254/, '0') },
                { phoneNumber: phoneNumber.replace(/^254/, '0') }
            ]
        });

        if (users.length === 0) {
            console.log('No users found with the provided phone number variations');
            
            // Try to find any users in the database
            const allUsers = await User.find({}).limit(5).select('username phoneNumber');
            console.log('First few users in the database:', allUsers);
            
            return;
        }

        console.log(`Found ${users.length} matching users:`);
        users.forEach((user, index) => {
            console.log(`\nUser ${index + 1}:`);
            console.log(`ID: ${user._id}`);
            console.log(`Username: ${user.username}`);
            console.log(`Phone Number: ${user.phoneNumber}`);
            console.log(`Stored Length: ${user.phoneNumber.length}`);
            console.log(`Normalized: ${user.phoneNumber.replace(/\D/g, '')}`);
        });

    } catch (error) {
        console.error('Error checking user:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Get phone number from command line argument or use the one from the error logs
const phoneNumber = process.argv[2] || '2540708393237';
checkUser(phoneNumber);
