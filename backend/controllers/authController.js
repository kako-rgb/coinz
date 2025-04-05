const User = require('../models/user');
const OTPService = require('../services/otpService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthController {
    static async register(userData) {
        try {
            const user = new User(userData);
            await user.save();
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async login(username, password) {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                throw new Error('User not found');
            }
            
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                throw new Error('Invalid credentials');
            }

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            return { success: true, token, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async resetPassword(email) {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('User not found');
            }
            // Implementation of password reset logic
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = AuthController;