const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
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
    balance: {
        type: Number,
        default: 10000 // Starting balance
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
    try {
        console.log('[User] generateAuthToken called for user:', this._id);
        const user = this;

        if (!user._id || !user.role) {
            console.error('[User] User document missing _id or role:', user);
            throw new Error('User document is invalid');
        }

        if (!process.env.JWT_SECRET) {
            console.error('[User] JWT_SECRET is not set in environment variables');
            throw new Error('JWT_SECRET is not configured');
        }

        const token = jwt.sign(
            { _id: user._id.toString(), role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        if (!token) {
            console.error('[User] Failed to generate JWT token');
            throw new Error('Failed to generate JWT token');
        }

        user.tokens = user.tokens.concat({ token });
        await user.save();
        return token;
    } catch (error) {
        console.error('[User] Error in generateAuthToken:', error);
        throw error;
    }
};

// Normalize phone number by removing all non-digit characters and handling country codes
const normalizePhoneNumber = (phone) => {
    if (!phone) return phone;
    
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    
    // If empty after removing non-digits, return as is
    if (!digits) return phone;
    
    // Handle Kenyan numbers specifically
    if (digits.startsWith('254')) {
        // If it's a full Kenyan number with extra 0 (13 digits: 2540...)
        if (digits.length === 13 && digits.startsWith('2540')) {
            return `+${digits}`; // Keep the format as is (+2540...)
        }
        // If it's a standard Kenyan number (12 digits: 2547...)
        else if (digits.length === 12) {
            return `+${digits}`;
        }
    }
    // Handle Kenyan numbers without country code (10 digits starting with 0)
    else if (digits.length === 10 && digits.startsWith('0')) {
        return `+254${digits.substring(1)}`;
    }
    // Handle Kenyan numbers without country code and without leading 0 (9 digits)
    else if (digits.length === 9) {
        return `+254${digits}`;
    }
    // Handle numbers with country code but without +
    else if (digits.length >= 10) {
        return `+${digits}`;
    }
    
    // For any other format, return as is with + if not present
    return phone.startsWith('+') ? phone : `+${phone}`;
};

// Generate all possible phone number variations for matching
const getPhoneVariations = (phone) => {
    if (!phone) return [];
    
    const variations = new Set();
    const digits = phone.replace(/\D/g, '');
    
    // Add the original number with and without +
    variations.add(`+${digits}`);
    variations.add(digits);
    
    // Handle Kenyan numbers (country code 254)
    if (digits.startsWith('254')) {
        // Full number with country code (e.g., +254712345678)
        if (digits.length === 12) {
            // Add version with 0 after country code (e.g., 2540712345678)
            const withZero = `2540${digits.substring(3)}`;
            variations.add(withZero);
            variations.add(`+${withZero}`);
            
            // Add local number variations (without country code)
            const localNumber = digits.substring(3);
            variations.add(localNumber); // 712345678
            variations.add(`0${localNumber}`); // 0712345678
            
            // Add variations with different country code formats
            variations.add(`00254${digits.substring(3)}`); // 00254712345678
            variations.add(`+00254${digits.substring(3)}`); // +00254712345678
        }
        // Handle case where there's already a 0 after country code (e.g., 2540712345678)
        else if (digits.startsWith('2540') && digits.length === 13) {
            // Keep the original format with 0
            variations.add(digits);
            variations.add(`+${digits}`);
            
            // Add version without the extra 0 (e.g., 2540712345678 -> 254712345678)
            const withoutExtraZero = `254${digits.substring(4)}`;
            variations.add(withoutExtraZero);
            variations.add(`+${withoutExtraZero}`);
            
            // Add local number variations
            const localNumber = digits.substring(4);
            variations.add(localNumber); // 712345678
            variations.add(`0${localNumber}`); // 0712345678
        }
    }
    // Handle local Kenyan numbers (starts with 0)
    else if (digits.startsWith('0') && digits.length === 10) {
        // Add with country code
        const withCountryCode = `254${digits.substring(1)}`;
        variations.add(withCountryCode);
        variations.add(`+${withCountryCode}`);
        
        // Add without leading 0
        variations.add(digits.substring(1));
    }
    // Handle local Kenyan numbers without leading 0 (9 digits)
    else if (digits.length === 9) {
        // Add with country code
        const withCountryCode = `254${digits}`;
        variations.add(withCountryCode);
        variations.add(`+${withCountryCode}`);
        
        // Add with leading 0
        variations.add(`0${digits}`);
    }
    
    // Add variations with different separators (e.g., spaces, hyphens)
    if (digits.length >= 10) {
        // Format: XXX-XXX-XXXX
        const formatted1 = digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        variations.add(formatted1);
        variations.add(`+${formatted1}`);
        
        // Format: (XXX) XXX-XXXX
        const formatted2 = digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        variations.add(formatted2);
        variations.add(`+${formatted2}`);
    }
    
    return Array.from(variations).filter(v => v); // Remove any empty strings
};

// Find user by phone number and password
userSchema.statics.findByCredentials = async (phoneNumber, password) => {
    try {
        if (!phoneNumber) {
            throw new Error('Phone number is required');
        }
        
        // Normalize the input phone number
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        console.log('Login attempt with:', { 
            inputPhone: phoneNumber, 
            normalizedPhone,
            inputLength: phoneNumber.length,
            normalizedLength: normalizedPhone.length
        });
        
        // Remove all non-digit characters for consistent comparison
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const cleanNormalized = normalizedPhone.replace(/\D/g, '');
        
        // Generate all possible phone number variations for matching
        const phoneVariations = getPhoneVariations(phoneNumber);
        console.log('Trying phone variations:', phoneVariations);
        
        // Create a set of all possible phone number formats to try
        const allPossibleFormats = new Set([
            phoneNumber,
            normalizedPhone,
            cleanPhone,
            cleanNormalized,
            ...phoneVariations,
            ...phoneVariations.map(p => p.replace(/\D/g, ''))
        ]);
        
        // Convert to array and remove any empty values
        const searchValues = Array.from(allPossibleFormats).filter(Boolean);
        
        console.log('Searching with phone numbers:', searchValues);
        
        // Find user by any of the phone number variations
        const user = await User.findOne({
            $or: [
                { phoneNumber: { $in: searchValues } }
            ]
        });
        
        if (!user) {
            console.log('User not found for any phone variation');
            throw new Error('Invalid login credentials');
        }
        
        console.log('Found user:', { 
            id: user._id, 
            storedPhone: user.phoneNumber,
            storedLength: user.phoneNumber.length,
            normalizedStoredPhone: normalizePhoneNumber(user.phoneNumber),
            phoneMatches: phoneVariations.includes(user.phoneNumber) || 
                         phoneVariations.includes(user.phoneNumber.replace('+', ''))
        });
        
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
        console.error('[User] Error in findByCredentials:', error);
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
