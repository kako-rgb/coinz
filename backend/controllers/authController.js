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

    static async register(username, phoneNumber, password, puzzleToken, puzzleAnswer, answerHash) {
        try {
            // Check if username already exists
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                throw new Error('Username already taken');
            }

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
                username,
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
            console.log(`[AuthController] Login attempt for phone number: ${phoneNumber}`);
            
            // Basic input validation
            if (!phoneNumber || !password) {
                console.log('[AuthController] Missing credentials');
                return { 
                    success: false, 
                    error: 'Please provide both phone number and password',
                    status: 400
                };
            }

            console.log('[AuthController] Calling User.findByCredentials');
            // Use the findByCredentials method from the User model
            const user = await User.findByCredentials(phoneNumber, password);
            
            if (!user) {
                console.log('[AuthController] Invalid credentials');
                return { 
                    success: false, 
                    error: 'Invalid phone number or password',
                    status: 401
                };
            }
            
            console.log(`[AuthController] User found: ${user._id}, generating token...`);
            // If we get here, the credentials are valid
            const token = await user.generateAuthToken();
            
            if (!token) {
                console.error('[AuthController] Failed to generate token');
                throw new Error('Failed to generate authentication token');
            }
            
            console.log('[AuthController] Token generated successfully');
            
            // Prepare user data for response (exclude sensitive info)
            const userData = user.toJSON();
            delete userData.password;
            delete userData.tokens;
            
            console.log(`[AuthController] Login successful for user: ${user._id}`);
            
            return { 
                success: true, 
                user: userData,
                token 
            };
            
        } catch (error) {
            console.error('Login error:', error);
            let statusCode = 500;
            let errorMessage = 'Login failed. Please try again later.';
            if (error.message.includes('Invalid credentials') || 
                error.message.includes('Unable to login')) {
                statusCode = 401;
                errorMessage = 'Invalid phone number or password';
            } else if (error.message.includes('Account locked')) {
                statusCode = 403;
                errorMessage = error.message;
            } else if (error.message.includes('JWT_SECRET')) {
                statusCode = 500;
                errorMessage = 'Server configuration error. Please contact support.';
            }
            return { 
                success: false, 
                error: errorMessage,
                status: statusCode
            };
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

    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isCurrentPasswordValid = await user.isValidPassword(currentPassword);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Update password
            user.password = newPassword;
            await user.save();
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async updateBalance(userId, balance) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.balance = balance;
            await user.save();
            
            return { success: true, balance: user.balance };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async getUserProfile(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            
            return { 
                success: true, 
                user: user.toJSON()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = AuthController;