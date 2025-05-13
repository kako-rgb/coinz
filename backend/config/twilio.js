// Twilio configuration
const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACee5bb3f219495bd3378f72cace6d16a7';
const authToken = process.env.TWILIO_AUTH_TOKEN || '360fcd0913327f01770ff9d0460892c3';
const verifySid = process.env.TWILIO_VERIFY_SID || 'VA5c0b2c0a9e0c2c0b2c0a9e0c2c0b2c0';
const phoneNumber = process.env.TWILIO_PHONE_NUMBER || '+15705308778';

// Initialize Twilio client
const client = twilio(accountSid, authToken);

module.exports = {
  client,
  verifySid,
  phoneNumber
};
