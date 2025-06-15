const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/auth');

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
        const { phoneNumber, password, puzzleToken, puzzleAnswer, answerHash } = req.body;
        
        if (!phoneNumber || !password || !puzzleToken || !puzzleAnswer || !answerHash) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        const result = await AuthController.register(phoneNumber, password, puzzleToken, puzzleAnswer, answerHash);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        
        if (!phoneNumber || !password) {
            return res.status(400).json({ success: false, error: 'Phone number and password are required' });
        }

        const result = await AuthController.login(phoneNumber, password);
        
        if (!result.success) {
            return res.status(401).json(result);
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
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