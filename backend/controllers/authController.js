const User = require('../models/User');
const PuzzleService = require('../services/puzzleService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class AuthController {
    static async getPuzzle() {
        try {
            const puzzle = PuzzleService.generatePuzzle();
            return { 
                success: true, 
                puzzle: {
                    question: puzzle.question,
                    token: puzzle.token
                },
                answerHash: puzzle.answerHash
            };
        } catch (error) {
            return { success: false, error: 'Failed to generate puzzle' };
        }
    }

    static async register(phoneNumber, password, puzzleToken, puzzleAnswer, answerHash) {
        try {
            // Check if phone number already exists
            const existingUser = await User.findOne({ phoneNumber });
            if (existingUser) {
                throw new Error('Phone number already registered');
            }

            // Validate puzzle answer
            const isPuzzleValid = PuzzleService.validatePuzzle(puzzleToken, puzzleAnswer, answerHash);
            if (!isPuzzleValid) {
                throw new Error('Invalid puzzle answer');
            }

            const user = new User({
                phoneNumber,
                password,
                isVerified: true,
                lastPuzzleSolvedAt: new Date()
            });

            await user.save();
            const token = await user.generateAuthToken();
            
            return { 
                success: true, 
                user: user.toJSON(),
                token 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async login(phoneNumber, password) {
        try {
            // Use the findByCredentials method from the User model
            const user = await User.findByCredentials(phoneNumber, password);
            
            // If we get here, the credentials are valid
            const token = await user.generateAuthToken();
            
            return { 
                success: true, 
                user: user.toJSON(),
                token 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async requestPasswordReset(phoneNumber) {
        try {
            const user = await User.findOne({ phoneNumber });
            if (!user) {
                // Don't reveal that the phone number doesn't exist
                return { success: true };
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(20).toString('hex');
            const resetTokenExpiry = Date.now() + 3600000; // 1 hour

            user.resetPasswordToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
            user.resetPasswordExpires = resetTokenExpiry;
            
            await user.save();

            // In a real app, you would send an SMS with the reset token
            // For now, we'll just return it (for testing purposes)
            return { 
                success: true, 
                resetToken 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async resetPassword(phoneNumber, token, newPassword) {
        try {
            const resetPasswordToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await User.findOne({
                phoneNumber,
                resetPasswordToken,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                throw new Error('Invalid or expired token');
            }

            user.password = newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            
            await user.save();
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = AuthController;