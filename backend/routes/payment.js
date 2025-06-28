const express = require('express');
const router = express.Router();

// Test route for payment API
router.get('/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'Payment API is working'
    });
});

module.exports = router;