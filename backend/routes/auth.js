const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Test endpoint for CORS and authentication
router.get('/test-auth', auth, (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }
        res.json({ 
            success: true, 
            message: 'Authentication successful',
            user: {
                id: req.user._id,
                username: req.user.username,
                phoneNumber: req.user.phoneNumber
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test auth error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get a new puzzle for registration
router.get('/puzzle', async (req, res) => {
    try {
        const result = await AuthController.getPuzzle();
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, phoneNumber, password, puzzleToken, puzzleAnswer, answerHash } = req.body;
        
        if (!username || !phoneNumber || !password || !puzzleToken || !puzzleAnswer || !answerHash) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        const result = await AuthController.register(username, phoneNumber, password, puzzleToken, puzzleAnswer, answerHash);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Enable CORS pre-flight for login
router.options('/login', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(204).send();
});

// Login user
router.post('/login', async (req, res) => {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    try {
        const { phoneNumber, password } = req.body;
        
        // Log the login attempt (without logging the password)
        console.log('Login attempt received for phone number:', phoneNumber);
        
        if (!phoneNumber || !password) {
            console.log('Missing credentials in login attempt');
            return res.status(400).json({ 
                success: false, 
                error: 'Phone number and password are required',
                status: 400
            });
        }

        // Call the auth controller
        const result = await AuthController.login(phoneNumber, password);
        
        // Log the result (without sensitive data)
        console.log('Login result:', { 
            success: result.success, 
            userId: result.user?._id,
            status: result.status || 200 
        });
        
        // Set the auth token in an HTTP-only cookie for better security
        if (result.success && result.token) {
            res.cookie('authToken', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            // Remove the token from the response body for security
            const { token, ...responseData } = result;
            return res.json(responseData);
        }
        
        // Handle failed login
        const statusCode = result.status || 401;
        return res.status(statusCode).json({
            success: false,
            error: result.error || 'Authentication failed',
            status: statusCode
        });
        
    } catch (error) {
        console.error('Login route error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'An unexpected error occurred',
            status: 500
        });
    }
});

// Request password reset
router.post('/request-password-reset', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'Phone number is required' });
        }

        const result = await AuthController.requestPasswordReset(phoneNumber);
        
        // Always return success to prevent user enumeration
        res.json({ success: true, message: 'If your phone number is registered, you will receive a reset link' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { phoneNumber, token, newPassword } = req.body;
        
        if (!phoneNumber || !token || !newPassword) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        const result = await AuthController.resetPassword(phoneNumber, token, newPassword);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Current password and new password are required' });
        }

        const result = await AuthController.changePassword(req.user._id, currentPassword, newPassword);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Update user balance
router.post('/update-balance', auth, async (req, res) => {
    try {
        const { balance } = req.body;
        
        if (typeof balance !== 'number') {
            return res.status(400).json({ success: false, error: 'Balance must be a number' });
        }

        const result = await AuthController.updateBalance(req.user._id, balance);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json({ success: true, balance: result.balance });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const result = await AuthController.getUserProfile(req.user._id);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Protected test route
router.get('/test', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'You are authenticated',
            user: req.user
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;