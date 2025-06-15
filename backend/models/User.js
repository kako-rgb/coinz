const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please use a valid phone number with country code']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastPuzzleSolvedAt: Date,
    failedPuzzleAttempts: {
        type: Number,
        default: 0
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lockUntil: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    
    // Only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();
    
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        const hash = await bcrypt.hash(user.password, salt);
        // Override the cleartext password with the hashed one
        user.password = hash;
        next();
    } catch (error) {
        next(error);
    }
});

// Add a method to check if the password is correct
userSchema.methods.isValidPassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

// Generate auth token
userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString(), role: user.role }, process.env.JWT_SECRET || 'your_jwt_secret', {
        expiresIn: '7d'
    });
    
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

// Find user by phone number and password
userSchema.statics.findByCredentials = async (phoneNumber, password) => {
    try {
        // Find user by phone number
        const user = await User.findOne({ phoneNumber });
        
        if (!user) {
            throw new Error('Invalid login credentials');
        }
        
        // Check if account is locked
        if (user.isLocked && user.lockUntil > new Date()) {
            const remainingTime = Math.ceil((user.lockUntil - new Date()) / 1000 / 60);
            throw new Error(`Account is locked. Please try again in ${remainingTime} minutes.`);
        }
        
        // Verify password
        const isPasswordValid = await user.isValidPassword(password);
        
        if (!isPasswordValid) {
            // Increment failed login attempts
            user.failedPuzzleAttempts += 1;
            
            // Lock account after 3 failed attempts for 15 minutes
            if (user.failedPuzzleAttempts >= 3) {
                user.isLocked = true;
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                await user.save();
                throw new Error('Too many failed attempts. Account locked for 15 minutes.');
            }
            
            await user.save();
            throw new Error('Invalid login credentials');
        }
        
        // Reset failed attempts on successful login
        user.failedPuzzleAttempts = 0;
        user.isLocked = false;
        user.lockUntil = undefined;
        await user.save();
        
        return user;
    } catch (error) {
        throw error;
    }
};

// Hide sensitive data
userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;

    return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
