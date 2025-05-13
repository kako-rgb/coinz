// Twilio configuration
const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN';
const verifySid = process.env.TWILIO_VERIFY_SID || 'YOUR_TWILIO_VERIFY_SID';

// Initialize Twilio client
const client = twilio(accountSid, authToken);

module.exports = {
  client,
  verifySid
};
