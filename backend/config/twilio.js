// Twilio configuration
const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const verifySid = process.env.TWILIO_VERIFY_SID || '';
const phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

// Initialize Twilio client
const client = twilio(accountSid, authToken);

module.exports = {
  client,
  verifySid,
  phoneNumber
};
