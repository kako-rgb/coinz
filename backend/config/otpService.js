const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

class OTPService {
    static async generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    static async sendOTP(phoneNumber, otp) {
        try {
            await client.messages.create({
                body: `Your verification code is: ${otp}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber
            });
            return true;
        } catch (error) {
            console.error('OTP sending failed:', error);
            return false;
        }
    }

    static async verifyOTP(userOTP, storedOTP) {
        return userOTP === storedOTP;
    }
}

module.exports = OTPService;