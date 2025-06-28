# Coinz - Spin Game with Secure Authentication

A secure coin spin game application featuring puzzle-based registration and phone number authentication.

## Features

- 🔒 Secure user registration with puzzle verification
- 📱 Phone number based authentication
- 🔄 Password reset functionality
- 🛡️ Account lockout after multiple failed attempts
- 🔐 JWT-based authentication
- 🧩 Simple math puzzles to prevent automated signups

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   PORT=3000
   ```

4. Start the backend server:
   ```bash
   npm start
   # or for development with auto-reload:
   # npm run dev
   ```

## Frontend Setup

The frontend is a simple HTML/JS example that demonstrates the authentication flow:

1. Open `frontend/auth-example.html` in a web browser
2. The example is pre-configured to connect to `http://localhost:3000`
3. If your backend is running on a different URL, update the `API_BASE_URL` in the JavaScript code

## API Documentation

Detailed API documentation is available in [backend/README-AUTH.md](backend/README-AUTH.md)

## Authentication Flow

1. **Registration**:
   - User provides phone number and password
   - Solves a simple math puzzle
   - Account is created after successful verification

2. **Login**:
   - User provides phone number and password
   - After 3 failed attempts, account is locked for 15 minutes
   - Successful login returns a JWT token for authenticated requests

3. **Password Reset**:
   - User requests a password reset with their phone number
   - Receives a reset token (simulated in this example)
   - Submits the token and new password to complete the reset

## Security Features

- Password hashing with bcrypt
- Account lockout after multiple failed attempts
- Secure JWT token handling
- Input validation and sanitization
- Rate limiting (recommended to be implemented at the web server level)

## Testing

Run the test script to verify the authentication flow:

```bash
cd backend
npm test
```

## Deployment

For production deployment, consider:

1. Using a process manager like PM2
2. Setting up HTTPS with a valid SSL certificate
3. Implementing rate limiting
4. Configuring CORS appropriately
5. Using environment variables for sensitive configuration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
