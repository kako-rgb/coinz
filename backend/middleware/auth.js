const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error('User not found');
        }

        // Check if the user is locked
        if (user.isLocked && user.lockUntil > new Date()) {
            const remainingTime = Math.ceil((user.lockUntil - new Date()) / 1000 / 60);
            return res.status(403).json({ 
                success: false, 
                error: `Account is locked. Please try again in ${remainingTime} minutes.` 
            });
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Please authenticate' });
    }
};

module.exports = auth;
