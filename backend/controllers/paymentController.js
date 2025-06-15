const User = require('../models/user');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentController {
    static async processPayment(userId, amount, paymentMethod) {
        try {
            const payment = await stripe.paymentIntents.create({
                amount,
                currency: 'usd',
                payment_method: paymentMethod,
                confirm: true
            });

            if (payment.status === 'succeeded') {
                await User.findByIdAndUpdate(userId, {
                    $inc: { tokens: amount / 100 } // Convert cents to tokens
                });
                return { success: true };
            }
            return { success: false, error: 'Payment failed' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async processWithdrawal(userId, amount) {
        try {
            const user = await User.findById(userId);
            if (user.tokens < amount) {
                throw new Error('Insufficient tokens');
            }
            
            // Implement withdrawal logic here
            await User.findByIdAndUpdate(userId, {
                $inc: { tokens: -amount }
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = PaymentController;