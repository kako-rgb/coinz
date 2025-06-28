# Authentication System Documentation

This document outlines the new puzzle-based authentication system that replaces the Twilio verification.

## Overview

The authentication system now uses a puzzle-based verification during registration to prevent automated signups. Once registered, users can log in using their phone number and password.

## API Endpoints

### 1. Get Puzzle for Registration
- **Endpoint**: `GET /auth/puzzle`
- **Description**: Generates a new puzzle for the registration process
- **Response**:
  ```json
  {
    "success": true,
    "puzzle": {
      "question": "What is 3 + 2?",
      "token": "unique_puzzle_token"
    },
    "answerHash": "hashed_answer"
  }
  ```

### 2. Register New User
- **Endpoint**: `POST /auth/register`
- **Body**:
  ```json
  {
    "phoneNumber": "+1234567890",
    "password": "securepassword",
    "puzzleToken": "token_from_puzzle_endpoint",
    "puzzleAnswer": "5",
    "answerHash": "hashed_answer_from_puzzle_endpoint"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "user": { /* user object */ },
    "token": "jwt_token"
  }
  ```

### 3. Login
- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "phoneNumber": "+1234567890",
    "password": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "user": { /* user object */ },
    "token": "jwt_token"
  }
  ```

### 4. Request Password Reset
- **Endpoint**: `POST /auth/request-password-reset`
- **Body**:
  ```json
  {
    "phoneNumber": "+1234567890"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "If your phone number is registered, you will receive a reset link"
  }
  ```

### 5. Reset Password
- **Endpoint**: `POST /auth/reset-password`
- **Body**:
  ```json
  {
    "phoneNumber": "+1234567890",
    "token": "reset_token_from_email",
    "newPassword": "new_secure_password"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Password reset successful"
  }
  ```

## Security Features

1. **Account Lockout**: After 3 failed login attempts, the account is locked for 15 minutes.
2. **Password Hashing**: Passwords are hashed using bcrypt before storing in the database.
3. **JWT Tokens**: Secure authentication using JSON Web Tokens with a configurable secret.
4. **Puzzle Verification**: Prevents automated signups with simple math puzzles.
5. **Rate Limiting**: Implemented to prevent brute force attacks.

## Testing

1. Start the server:
   ```bash
   node server.js
   ```

2. Run the test script:
   ```bash
   npm install axios
   node test-auth.js
   ```

## Environment Variables

Make sure to set these environment variables in your `.env` file:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

## Notes

- The system ensures phone numbers are unique in the database.
- Passwords must be at least 8 characters long.
- All API responses follow a consistent format with `success` and `error` fields.
