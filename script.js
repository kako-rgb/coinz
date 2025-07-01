// Global variables
let currentUser = null;
let isLoggedIn = false;
let tokens = 10000;
let userCountryCode = '+1'; // Default country code
let authToken = localStorage.getItem('authToken');
let isAdmin = false;
let isSubmitting = false; // Track form submission state

// Country code to country mapping
const countryToCountryCode = {
    'US': '+1', 'CA': '+1', 'GB': '+44', 'AU': '+61', 'DE': '+49',
    'FR': '+33', 'IT': '+39', 'ES': '+34', 'NL': '+31', 'BE': '+32',
    'CH': '+41', 'AT': '+43', 'SE': '+46', 'NO': '+47', 'DK': '+45',
    'FI': '+358', 'IE': '+353', 'PT': '+351', 'GR': '+30', 'LU': '+352',
    'JP': '+81', 'KR': '+82', 'SG': '+65', 'IN': '+91', 'CN': '+86',
    'HK': '+852', 'TW': '+886', 'MY': '+60', 'TH': '+66', 'ID': '+62',
    'PH': '+63', 'VN': '+84', 'BR': '+55', 'MX': '+52', 'AR': '+54',
    'CL': '+56', 'CO': '+57', 'PE': '+51', 'ZA': '+27', 'NG': '+234',
    'EG': '+20', 'KE': '+254', 'GH': '+233', 'MA': '+212', 'DZ': '+213',
    'TN': '+216', 'UG': '+256', 'TZ': '+255', 'ZM': '+260', 'ZW': '+263',
    'RW': '+250', 'MW': '+265', 'MZ': '+258', 'AO': '+244', 'NA': '+264'
};

// Function to detect user's country using IP geolocation
async function detectCountryByIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP geolocation API failed');
        const data = await response.json();
        return data.country_code; // Returns country code like 'US', 'KE', etc.
    } catch (error) {
        console.warn('IP geolocation failed, trying browser geolocation...', error);
        showToast('Using default country code. Some features may be limited.', 'warning');
        return null;
    }
}

// Function to detect user's country using browser geolocation
async function detectCountryByGeolocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by this browser');
            showToast('Geolocation not supported by your browser', 'warning');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(`https://geocode.xyz/${latitude},${longitude}?geoit=json`);
                    if (!response.ok) throw new Error('Reverse geocoding failed');
                    const data = await response.json();
                    resolve(data.country); // Returns country code
                } catch (error) {
                    console.warn('Reverse geocoding failed', error);
                    resolve(null);
                }
            },
            (error) => {
                console.warn('Geolocation permission denied or failed', error);
                resolve(null);
            },
            { timeout: 5000 } // 5 second timeout
        );
    });
}

// Main function to detect user's country and update country code
async function detectUserCountry() {
    let countryCode = null;
    
    // Try IP-based geolocation first
    countryCode = await detectCountryByIP();
    
    // If that fails, try browser geolocation
    if (!countryCode) {
        countryCode = await detectCountryByGeolocation();
    }
    
    // If we have a valid country code, update the UI
    if (countryCode && countryToCountryCode[countryCode]) {
        userCountryCode = countryToCountryCode[countryCode];
        updateCountryCodeSelectors(userCountryCode);
        console.log('Detected country code:', userCountryCode);
    } else {
        console.log('Using default country code:', userCountryCode);
        updateCountryCodeSelectors(userCountryCode);
    }
    
    return userCountryCode;
}

// Update all country code selectors with the detected country code
function updateCountryCodeSelectors(countryCode) {
    const selectors = [
        '#registerCountryCode',
        '#loginCountryCode',
        '#paymentCountryCode',
        '#recoveryCountryCode'
    ];
    
    selectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            // Check if the country code exists in the options
            const option = element.querySelector(`option[value="${countryCode}"]`);
            if (option) {
                element.value = countryCode;
            } else {
                // If the country code isn't in the options, add it
                const newOption = document.createElement('option');
                newOption.value = countryCode;
                newOption.textContent = `${countryCode} (Auto-detected)`;
                element.prepend(newOption);
                element.value = countryCode;
            }
        }
    });
}

// Initialize country code selectors with common country codes
function initializeCountryCodeSelectors() {
    const countries = [
        { code: '+1', name: 'USA/Canada (+1)' },
        { code: '+44', name: 'UK (+44)' },
        { code: '+61', name: 'Australia (+61)' },
        { code: '+27', name: 'South Africa (+27)' },
        { code: '+254', name: 'Kenya (+254)' },
        { code: '+234', name: 'Nigeria (+234)' },
        { code: '+233', name: 'Ghana (+233)' },
        { code: '+256', name: 'Uganda (+256)' },
        { code: '+255', name: 'Tanzania (+255)' },
        { code: '+260', name: 'Zambia (+260)' },
        { code: '+263', name: 'Zimbabwe (+263)' }
    ];

    const selectors = [
        '#registerCountryCode',
        '#loginCountryCode',
        '#paymentCountryCode',
        '#recoveryCountryCode'
    ];

    selectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            // Clear existing options
            element.innerHTML = '';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select country code';
            element.appendChild(defaultOption);
            
            // Add country options
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country.code;
                option.textContent = country.name;
                element.appendChild(option);
            });
        }
    });
}

// Check if user is logged in by verifying the auth token
async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('No auth token found');
        return false;
    }
    
    // Restore user data from localStorage if available
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        try {
            currentUser = JSON.parse(savedUserData);
            isLoggedIn = true;
            
            // Update status to LIVE if user is logged in
            const dbStatusIndicator = document.getElementById('dbStatusIndicator');
            if (dbStatusIndicator) {
                dbStatusIndicator.textContent = 'LIVE';
                dbStatusIndicator.className = 'db-status live';
                dbStatusIndicator.title = 'Live Mode - Connected';
            }
            authToken = token;
            console.log('Restored user session from localStorage:', currentUser);
        } catch (e) {
            console.error('Error parsing saved user data:', e);
            localStorage.removeItem('userData');
            return false;
        }
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            if (userData.user) {
                // Update the current user data
                currentUser = userData.user;
                isLoggedIn = true;
                authToken = token;
                
                // Update localStorage with fresh user data
                localStorage.setItem('userData', JSON.stringify(userData.user));
                console.log('Verified user session:', currentUser);
                
                // Update UI
                updateUIForLoggedInUser(userData.user);
                updateAuthUI(userData.user);
                return true;
            }
        }
        
        // If we get here, the token is invalid or expired
        console.log('Invalid or expired token');
        signOut();
        return false;
        
    } catch (error) {
        console.error('Error checking auth status:', error);
        // If there's an error (e.g., network issue), keep the user logged in with cached data
        if (currentUser) {
            console.log('Using cached user data due to error');
            return true;
        }
        return false;
    }
}

// Update UI based on login state
function updateUIForLoggedInUser(user) {
    // Show/hide elements based on login state
    const loginElements = document.querySelectorAll('.login-required');
    const guestElements = document.querySelectorAll('.guest-only');
    const userElements = document.querySelectorAll('.user-only');
    const adminElements = document.querySelectorAll('.admin-only');
    
    if (user) {
        // Update user-specific UI elements
        const usernameElements = document.querySelectorAll('.username');
        usernameElements.forEach(el => {
            el.textContent = user.username;
        });
        
        // Show/hide elements based on role
        loginElements.forEach(el => el.style.display = 'block');
        guestElements.forEach(el => el.style.display = 'none');
        userElements.forEach(el => el.style.display = 'block');
        adminElements.forEach(el => {
            el.style.display = user.role === 'admin' ? 'block' : 'none';
        });
    } else {
        // Show guest UI
        loginElements.forEach(el => el.style.display = 'none');
        guestElements.forEach(el => el.style.display = 'block');
        userElements.forEach(el => el.style.display = 'none');
        adminElements.forEach(el => el.style.display = 'none');
    }
    
    // Update database status indicator to reflect login state
    checkDatabaseConnection();
}

// Initialize form validation
function initializeFormValidation() {
    // Add input event listeners for real-time validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
        
        // Add input validation
        const inputs = form.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);
            });
        });
    });
}

// Validate a single form input
function validateInput(input) {
    if (input.required && !input.value.trim()) {
        input.setCustomValidity('This field is required');
        return false;
    }
    
    // Additional validation based on input type
    if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        input.setCustomValidity('Please enter a valid email address');
        return false;
    }
    
    if (input.type === 'tel' && !/^\+?[0-9\s-()]+$/.test(input.value)) {
        input.setCustomValidity('Please enter a valid phone number');
        return false;
    }
    
    if (input.pattern && !new RegExp(input.pattern).test(input.value)) {
        input.setCustomValidity(input.title || 'Invalid format');
        return false;
    }
    
    input.setCustomValidity('');
    return true;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formId = form.id;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Prevent double submission
    if (isSubmitting) return;
    isSubmitting = true;
    
    try {
        // Validate all inputs
        const inputs = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateInput(input)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            form.classList.add('was-validated');
            throw new Error('Please fill in all required fields correctly');
        }
        
        // Set loading state if submit button exists
        if (submitButton) {
            setButtonLoading(submitButton, true);
        }
        
        // Handle different forms
        switch(formId) {
            case 'loginForm':
                await handleLogin();
                break;
            case 'registerForm':
                await handleRegistration();
                break;
            case 'passwordRecoveryForm':
                await handlePasswordRecovery();
                break;
            case 'paymentForm':
                await handlePayment();
                break;
            default:
                console.warn('Unknown form submitted:', formId);
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        showToast(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
        if (submitButton) {
            setButtonLoading(submitButton, false);
        }
        isSubmitting = false;
    }
}

// Login function
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, rememberMe }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            // Store tokens if remember me is checked
            if (rememberMe) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            
            // Update UI for logged in user
            updateUIForLoggedInUser(data.user);
            
            // Update status to LIVE
            const dbStatusIndicator = document.getElementById('dbStatusIndicator');
            if (dbStatusIndicator) {
                dbStatusIndicator.textContent = 'LIVE';
                dbStatusIndicator.className = 'db-status live';
                dbStatusIndicator.title = 'Live Mode - Connected';
            }
            
            // Show success message
            showToast('Login successful!', 'success');
            
            // Close the login modal
            closeModal('login');
            
            // Start checking for deposits
            startDepositCheck();
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        const loginButton = document.querySelector('#loginForm button[type="submit"]');
        if (loginButton) setButtonLoading(loginButton, false);
    }
}

// Logout function
async function handleLogout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            // Update UI for logged out user
            updateUIForLoggedInUser(null);
            
            // Update status to DEMO
            const dbStatusIndicator = document.getElementById('dbStatusIndicator');
            if (dbStatusIndicator) {
                dbStatusIndicator.textContent = 'DEMO';
                dbStatusIndicator.className = 'db-status demo';
                dbStatusIndicator.title = 'Demo Mode - Disconnected';
            }
            
            // Show success message
            showToast('Logout successful!', 'success');
            
            // Close the logout modal
            closeModal('logout');
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast(error.message || 'Logout failed. Please try again.', 'error');
    }
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App initializing...');
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize country code selectors
    initializeCountryCodeSelectors();
    
    // Check if user is already logged in
    const isAuthenticated = await checkAuthStatus();
    
    if (isAuthenticated) {
        console.log('✅ User session restored successfully');
    } else {
        console.log('❌ No active session found');
        // If not logged in, detect country
        await detectUserCountry().catch(console.error);
    }
    
    // Initialize the rest of the UI
    updateUIForLoggedInUser(currentUser);
    updateAuthUI(currentUser);
});

let wagerAmount = 0;

// API Configuration
// Base URL for API requests - automatically switches between development and production
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'  // Development
    : 'https://coinz-tcfm.onrender.com';  // Production
console.log('API base URL set to:', API_BASE_URL);

// Session persistence - keep user logged in on page refresh
// Note: Session data is preserved to maintain login state

// Save form data to session storage
function saveFormData() {
    const formData = {
        username: document.getElementById('username').value,
        phoneNumber: document.getElementById('registerPhoneNumber').value,
        countryCode: document.getElementById('registerCountryCode').value
    };
    sessionStorage.setItem('registrationFormData', JSON.stringify(formData));
}

// Restore form data from session storage
function restoreFormData() {
    const savedData = sessionStorage.getItem('registrationFormData');
    if (savedData) {
        const formData = JSON.parse(savedData);
        document.getElementById('username').value = formData.username || '';
        document.getElementById('registerPhoneNumber').value = formData.phoneNumber || '';
        if (formData.countryCode) {
            document.getElementById('registerCountryCode').value = formData.countryCode;
        }
        // Clear the saved data after restoring
        sessionStorage.removeItem('registrationFormData');
    }
}

// Puzzle variables
let currentPuzzle = {
    num1: 0,
    num2: 0,
    operator: '+',
    answer: 0
};

// Generate a new math puzzle
function generateNewPuzzle() {
    const operators = ['+', '-', '*'];
    currentPuzzle.operator = operators[Math.floor(Math.random() * operators.length)];
    
    // Generate numbers based on the operator to keep it simple
    if (currentPuzzle.operator === '*') {
        currentPuzzle.num1 = Math.floor(Math.random() * 5) + 1; // 1-5
        currentPuzzle.num2 = Math.floor(Math.random() * 5) + 1; // 1-5
    } else {
        currentPuzzle.num1 = Math.floor(Math.random() * 10) + 1; // 1-10
        currentPuzzle.num2 = Math.floor(Math.random() * 10) + 1; // 1-10
        
        // For subtraction, ensure the result is positive
        if (currentPuzzle.operator === '-' && currentPuzzle.num1 < currentPuzzle.num2) {
            [currentPuzzle.num1, currentPuzzle.num2] = [currentPuzzle.num2, currentPuzzle.num1];
        }
    }
    
    // Calculate the answer
    currentPuzzle.answer = eval(`${currentPuzzle.num1} ${currentPuzzle.operator} ${currentPuzzle.num2}`);
    
    // Update the puzzle display
    document.getElementById('puzzleQuestion').textContent = 
        `${currentPuzzle.num1} ${currentPuzzle.operator} ${currentPuzzle.num2} = ?`;
    document.getElementById('puzzleAnswer').value = '';
    document.getElementById('puzzleError').style.display = 'none';
}

// Toggle puzzle section visibility
function togglePuzzleSection() {
    const puzzleSection = document.getElementById('puzzleSection');
    const ageCheckbox = document.getElementById('ageCheckbox');
    
    if (ageCheckbox.checked) {
        puzzleSection.style.display = 'block';
        generateNewPuzzle();
    } else {
        puzzleSection.style.display = 'none';
    }
}

// Validate puzzle answer
function validatePuzzle() {
    const userAnswer = parseInt(document.getElementById('puzzleAnswer').value);
    if (isNaN(userAnswer)) {
        document.getElementById('puzzleError').style.display = 'block';
        return false;
    }
    
    if (userAnswer !== currentPuzzle.answer) {
        document.getElementById('puzzleError').style.display = 'block';
        generateNewPuzzle();
        return false;
    }
    
    return true;
}
let isSpinning = false;
let attemptCount = 0;
let baseWagerAmount = 0;
let slowSpinInterval = null;
let previousWagerAmount = 0;
let winCount = 0; // Track total wins for bonus cycles
let spinCount = 0; // Track number of spins
let lastBetAmount = 0; // Track last bet amount for logged-in users
let consecutiveLosses = 0; // Track consecutive losses for logged-in users
let consecutiveWins = 0; // Track consecutive wins for bonus cycle (reset on loss or logout/refresh)
let coinRenderer;
let dbCheckInterval;

// Motivational messages for wins and losses
const winMessages = [
    { text: "🎉 Amazing Win! 🎉", class: 'win-message' },
    { text: "💰 Jackpot! You're on fire! 💰", class: 'win-message' },
    { text: "🌟 Legendary! Keep it up! 🌟", class: 'win-message' },
    { text: "🔥 Unstoppable! 🔥", class: 'win-message' },
    { text: "💎 Pure Skill! 💎", class: 'win-message' }
];

const lossMessages = [
    { text: "💪 Almost there! Next one's yours!", class: 'loss-message' },
    { text: "✨ The comeback will be epic!", class: 'loss-message' },
    { text: "🚀 Keep going, champion!", class: 'loss-message' },
    { text: "🎯 You're getting closer!", class: 'loss-message' },
    { text: "💡 Every loss is a lesson!", class: 'loss-message' }
];

const bonusMessages = [
    { text: "🎁 Bonus Win! 🎁", class: 'bonus-message' },
    { text: "✨ Lucky You! Extra Tokens! ✨", class: 'bonus-message' },
    { text: "💎 Bonus Streak! 💎", class: 'bonus-message' },
    { text: "🔥 Hot Streak Bonus! 🔥", class: 'bonus-message' },
    { text: "🌟 Bonus Round! 🌟", class: 'bonus-message' }
];

// Database check interval in milliseconds (10 seconds)
const DB_CHECK_INTERVAL = 10000;

// Log environment info for debugging
console.log('Environment Details:', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    href: window.location.href,
    origin: window.location.origin
});

// Authentication token storage (using the one from localStorage at the top)

function addWinAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .win-animation {
            animation: glow 0.5s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from {
                text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px gold;
                transform: translateX(-50%) scale(1);
            }
            to {
                text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px gold;
                transform: translateX(-50%) scale(1.1);
            }
        }

        .updating {
            color: gold !important;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8) !important;
            transition: all 0.3s ease-out;
        }

        #tokenCount.updating {
            animation: numberGlow 0.5s ease-in-out;
        }

        @keyframes numberGlow {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

function addHighlightStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .highlight {
            animation: highlight 0.5s ease-in-out;
        }

        @keyframes highlight {
            0% {
                transform: scale(1);
                text-shadow: none;
            }
            50% {
                transform: scale(1.2);
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
            }
            100% {
                transform: scale(1);
                text-shadow: none;
            }
        }
    `;
    document.head.appendChild(style);
}

function addParticleBackground() {
    const style = document.createElement('style');
    style.textContent = `
        .particle-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        }
        
        .particle {
            position: absolute;
            background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            opacity: 0;
            animation: floatParticle 3s ease-in-out infinite;
        }

        @keyframes floatParticle {
            0% {
                transform: translateY(100vh) scale(0);
                opacity: 0;
            }
            50% {
                opacity: 0.5;
            }
            100% {
                transform: translateY(-100px) scale(1);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    const background = document.createElement('div');
    background.className = 'particle-background';
    document.body.appendChild(background);

    // Create particles
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.width = particle.style.height = Math.random() * 20 + 10 + 'px';
        particle.style.animationDelay = Math.random() * 2 + 's';
        background.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
            particle.remove();
        }, 3000);
    }

    // Create particles periodically
    setInterval(createParticle, 300);
}

function addHoverEffects() {
    const style = document.createElement('style');
    style.textContent = `
        .mbtn:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            background: linear-gradient(45deg, #3498db, #2c3e50);
        }

        .close-btn:hover {
            background-color: rgba(255, 0, 0, 0.8);
            transform: scale(1.1);
        }

        #wagerAmount:hover {
            transform: scale(1.05);
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        }

        .form input:hover, .form select:hover {
            border-color: #3498db;
            box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
        }

        .form button:hover {
            background: linear-gradient(45deg, #3498db, #2980b9);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
    `;
    document.head.appendChild(style);
}

function startSlowSpin() {
    if (slowSpinInterval) {
        clearInterval(slowSpinInterval);
    }
    
    if (!isSpinning && coinRenderer && !coinRenderer.isSpinning) {
        slowSpinInterval = setInterval(() => {
            if (!isSpinning && !coinRenderer.isSpinning) {
                coinRenderer.coin.rotation.y += 0.01;
            }
        }, 50);
    }
}

function stopSlowSpin() {
    if (slowSpinInterval) {
        clearInterval(slowSpinInterval);
        slowSpinInterval = null;
    }
    if (coinRenderer) {
        coinRenderer.isSpinning = true; // Prevent slow spin from restarting
    }
}

function setupCloseButtons() {
    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const form = button.closest('.form');
            const container = button.closest('.form-container, .payment-container');
            
            if (form) {
                form.style.display = 'none';
                form.reset();
                
                // Hide any error messages
                const errorMessage = document.getElementById('errorMessage');
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
                
                // Hide puzzle section if visible
                const puzzleSection = document.getElementById('puzzleSection');
                if (puzzleSection) {
                    puzzleSection.style.display = 'none';
                }
                
                // Hide recovery steps
                const recoveryStep1 = document.getElementById('recoveryStep1');
                const recoveryStep2 = document.getElementById('recoveryStep2');
                if (recoveryStep1 && recoveryStep2) {
                    recoveryStep1.style.display = 'block';
                    recoveryStep2.style.display = 'none';
                }
            }
            
            if (container) {
                container.classList.remove('active');
            }
        });
    });
}

function addTryAgainAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeAnimation {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            20% { opacity: 1; transform: translate(-50%, 0); }
            80% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, 20px); }
        }

        @keyframes smokeAnimation {
            0% { opacity: 0; filter: blur(0); transform: translate(-50%, 0) scale(1); }
            20% { opacity: 1; transform: translate(-50%, 0) scale(1.1); }
            80% { opacity: 0.8; filter: blur(4px); transform: translate(-50%, -20px) scale(1.5); }
            100% { opacity: 0; filter: blur(8px); transform: translate(-50%, -40px) scale(2); }
        }

        @keyframes waterAnimation {
            0% { opacity: 1; transform: translate(-50%, 0); }
            50% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, 20px) scale(0.5); 
                   filter: blur(4px) hue-rotate(180deg); }
        }

        @keyframes glitchAnimation {
            0% { clip-path: inset(50% 0 30% 0); transform: translate(-50%, 0); }
            20% { clip-path: inset(20% 0 60% 0); transform: translate(-52%, 2px); }
            40% { clip-path: inset(40% 0 40% 0); transform: translate(-48%, -2px); }
            60% { clip-path: inset(30% 0 50% 0); transform: translate(-51%, 1px); }
            80% { clip-path: inset(10% 0 70% 0); transform: translate(-49%, -1px); }
            100% { clip-path: inset(50% 0 30% 0); transform: translate(-50%, 0); }
        }

        .try-again-base {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            font-size: 36px;
            font-weight: bold;
            z-index: 1001;
            pointer-events: none;
            text-align: center;
            width: 100%;
        }

        .try-again-fade {
            animation: fadeAnimation 3s ease-in-out forwards;
        }

        .try-again-smoke {
            animation: smokeAnimation 3s ease-out forwards;
        }

        .try-again-water {
            animation: waterAnimation 3s ease-in-out forwards;
        }

        .try-again-glitch {
            animation: glitchAnimation 0.2s steps(2) infinite;
            color: red;
            text-shadow: 2px 2px 4px rgba(255,0,0,0.5),
                         -2px -2px 4px rgba(0,255,255,0.5);
        }
    `;
    document.head.appendChild(style);
}

// Function to check database connection status
async function checkDatabaseConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const isConnected = data.status === 'ok';
        
        updateDbStatusIndicator(isConnected);
        return isConnected;
    } catch (error) {
        console.error('Error checking database connection:', error);
        updateDbStatusIndicator(false, true, error.message);
        return false;
    }
}

// Function to update the database status indicator
function updateDbStatusIndicator(isConnected, isError = false, errorMessage = '') {
    const dbStatusIndicator = document.getElementById('dbStatusIndicator');
    if (!dbStatusIndicator) return;
    
    const isLoggedIn = currentUser !== null;
    
    if (isError) {
        dbStatusIndicator.textContent = 'ERROR';
        dbStatusIndicator.className = 'db-status error';
        dbStatusIndicator.title = 'Database Error: ' + errorMessage;
        return;
    }
    
    if (isConnected) {
        if (isLoggedIn) {
            dbStatusIndicator.textContent = 'LIVE';
            dbStatusIndicator.className = 'db-status live';
            dbStatusIndicator.title = 'Connected to Live Database';
        } else {
            dbStatusIndicator.textContent = 'DEMO';
            dbStatusIndicator.className = 'db-status demo';
            dbStatusIndicator.title = 'Demo Mode - Not Logged In';
        }
    } else {
        // Not connected
        dbStatusIndicator.textContent = isLoggedIn ? 'LIVE' : 'DEMO';
        dbStatusIndicator.className = 'db-status';
        dbStatusIndicator.title = 'Database: Disconnected';
    }
}

// Start checking database connection status
function startDbConnectionMonitor() {
    // Initial check
    checkDatabaseConnection();
    
    // Set up periodic checking
    dbCheckInterval = setInterval(checkDatabaseConnection, DB_CHECK_INTERVAL);
}

// Stop checking database connection status
function stopDbConnectionMonitor() {
    if (dbCheckInterval) {
        clearInterval(dbCheckInterval);
    }
}
fetch(API_URL, {
  credentials: 'include'
});

// Authentication functions
async function loadPuzzle() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/puzzle`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load puzzle');
        }
        
        const data = await response.json();
        if (data.success) {
            document.getElementById('puzzleQuestion').textContent = data.puzzle.question;
            document.getElementById('puzzleToken').value = data.puzzle.token;
            document.getElementById('answerHash').value = data.answerHash;
            document.getElementById('puzzleSection').style.display = 'block';
        } else {
            throw new Error(data.message || 'Failed to load puzzle');
        }
    } catch (error) {
        console.error('Error loading puzzle:', error);
        displayErrorMessage(error.message || 'Error loading puzzle');
    }
}

async function register(username, phoneNumber, password, puzzleToken, puzzleAnswer, answerHash) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify({
                username,
                phoneNumber,
                password,
                puzzleToken,
                puzzleAnswer,
                answerHash
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Registration failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Format phone number to consistent E.164 format
function formatPhoneNumber(phoneNumber, countryCode = '') {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    let digits = phoneNumber.replace(/\D/g, '');
    
    // If country code is provided, handle it
    if (countryCode) {
        const cleanCountryCode = countryCode.replace(/\D/g, '');
        // If the phone number already starts with the country code, use it as is
        if (digits.startsWith(cleanCountryCode)) {
            return `+${digits}`;
        }
        // Otherwise, prepend the country code, removing only single leading zero
        const phoneWithoutLeadingZero = digits.replace(/^0/, '');
        return `+${cleanCountryCode}${phoneWithoutLeadingZero}`;
    }
    
    // Handle Kenyan numbers specifically
    if (digits.startsWith('254') && digits.length >= 12) {
        return `+${digits}`;
    }
    
    // If it's a local Kenyan number (starts with 0)
    if (digits.startsWith('0') && digits.length === 10) {
        return `+254${digits.substring(1)}`;
    }
    
    // For other formats, just ensure it starts with +
    return digits.startsWith('+') ? digits : `+${digits}`;
}

async function login(phoneNumber, password) {
    try {
        // Format phone number to consistent E.164 format
        const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
        
        console.log('Attempting login with:', { 
            rawPhoneNumber: phoneNumber,
            formattedPhoneNumber,
            hasPassword: !!password,
            timestamp: new Date().toISOString()
        });

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include', // Important: Include cookies in the request
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify({
                phoneNumber: formattedPhoneNumber,
                password: password
            })
        });

        // First check if we can parse the response as JSON
        let responseData;
        try {
            responseData = await response.json();
            console.log('Login response:', {
                status: response.status,
                statusText: response.statusText,
                data: responseData,
                headers: Object.fromEntries([...response.headers.entries()])
            });
        } catch (e) {
            console.error('Failed to parse login response:', e);
            throw new Error('Invalid response from server');
        }

        // Handle non-successful responses
        if (!response.ok) {
            let errorMessage = 'Login failed';
            if (response.status === 401) {
                errorMessage = responseData.error || 'Invalid phone number or password';
            } else if (response.status === 403) {
                errorMessage = responseData.error || 'Account is locked. Please try again later.';
            } else if (response.status >= 500) {
                errorMessage = 'Server error. Please try again later.';
            }
            
            const error = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }
        
        // If we get here, login was successful
        if (responseData.success && responseData.user) {
            // Store user data in memory and localStorage
            currentUser = responseData.user;
            isLoggedIn = true;
            
            // Store auth token if provided
            if (responseData.token) {
                authToken = responseData.token;
                localStorage.setItem('authToken', responseData.token);
            }
            
            // Store user data in localStorage (without sensitive info)
            const { password: _, tokens: __, ...safeUserData } = responseData.user;
            localStorage.setItem('userData', JSON.stringify(safeUserData));
            
            console.log('User authenticated successfully:', {
                userId: currentUser._id,
                username: currentUser.username,
                phoneNumber: currentUser.phoneNumber
            });
            
            // Update UI to reflect logged-in state
            updateUIForLoggedInUser(currentUser);
            
            // Show welcome message
            showWelcomeMessage(`Welcome back, ${currentUser.username || 'User'}!`);
            
            return currentUser;
        } else {
            console.error('Invalid response format from server:', responseData);
            throw new Error('Invalid response from server: missing user data');
        }
    } catch (error) {
        console.error('Login error:', error);
        // Rethrow with a more user-friendly message
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Unable to connect to the server. Please check your internet connection.');
        }
        throw error;
    }
}

async function requestPasswordReset(phoneNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify({ phoneNumber })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to request password reset');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Password reset request error:', error);
        throw error;
    }
}

async function resetPassword(phoneNumber, token, newPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify({
                phoneNumber,
                token,
                newPassword
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to reset password');
        }

        return await response.json();
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
}

async function changePassword(currentPassword, newPassword) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Origin': window.location.origin
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to change password');
        }

        return await response.json();
    } catch (error) {
        console.error('Change password error:', error);
        throw error;
    }
}

// Show loading state for a button
function setButtonLoading(button, isLoading) {
    try {
        if (!button) return;
        
        // Get the button element if a string ID was passed
        const buttonEl = typeof button === 'string' ? document.getElementById(button) : button;
        if (!buttonEl || !buttonEl.nodeType) return;
        
        if (isLoading) {
            // Store original HTML if not already stored
            if (!buttonEl.hasAttribute('data-original-html')) {
                buttonEl.setAttribute('data-original-html', buttonEl.innerHTML);
            }
            
            // Disable button and show loading state
            buttonEl.disabled = true;
            buttonEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (buttonEl.getAttribute('data-loading-text') || 'Loading...');
            buttonEl.classList.add('btn-loading');
        } else {
            // Re-enable button and restore original content
            buttonEl.disabled = false;
            const originalHtml = buttonEl.getAttribute('data-original-html');
            if (originalHtml) {
                buttonEl.innerHTML = originalHtml;
                buttonEl.removeAttribute('data-original-html');
            }
            buttonEl.classList.remove('btn-loading');
        }
    } catch (error) {
        console.error('Error in setButtonLoading:', error);
        // Ensure button is not stuck in loading state
        if (button && button.nodeType) {
            button.disabled = false;
            button.classList.remove('btn-loading');
            // Try to restore original content if possible
            const originalHtml = button.getAttribute('data-original-html');
            if (originalHtml) {
                button.innerHTML = originalHtml;
                button.removeAttribute('data-original-html');
            }
        }
    }
}

// Show toast notification
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => toast.remove();
    
    toast.appendChild(messageEl);
    toast.appendChild(closeBtn);
    container.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Handle login form submission
async function handleLogin() {
    const phoneNumber = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    const countryCode = document.getElementById('loginCountryCode').value;
    
    try {
        await login(phoneNumber, password, countryCode);
        showToast('Login successful!', 'success');
        // Additional logic after successful login
    } catch (error) {
        console.error('Login error:', error);
        throw error; // Re-throw to be caught by form handler
    }
}

// Handle registration form submission
async function handleRegistration() {
    const username = document.getElementById('username').value;
    const phoneNumber = document.getElementById('registerPhoneNumber').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const countryCode = document.getElementById('registerCountryCode').value;
    
    // Additional validation
    if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
    }
    
    try {
        // Load puzzle for registration
        const puzzle = await loadPuzzle();
        if (!puzzle) throw new Error('Failed to load registration puzzle');
        
        // Show puzzle to user and get their answer
        // ... (implement puzzle UI and get answer)
        const userAnswer = prompt('Please solve the puzzle: ' + puzzle.question);
        if (!userAnswer) throw new Error('Puzzle answer is required');
        
        // Complete registration
        await register(username, phoneNumber, password, puzzle.token, userAnswer, puzzle.answerHash);
        showToast('Registration successful!', 'success');
        // Additional logic after successful registration
    } catch (error) {
        console.error('Registration error:', error);
        throw error; // Re-throw to be caught by form handler
    }
}

// Handle password recovery
async function handlePasswordRecovery() {
    const phoneNumber = document.getElementById('recoveryPhone').value;
    try {
        await requestPasswordReset(phoneNumber);
        showToast('Password reset instructions have been sent to your phone', 'success');
    } catch (error) {
        console.error('Password recovery error:', error);
        throw error;
    }
}

// Handle payment submission
async function handlePayment() {
    // Implement payment processing logic
    // This is a placeholder - implement according to your payment processor
    showToast('Payment processing...', 'info');
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    showToast('Payment processed successfully!', 'success');
}

// UI Helper functions
function showWelcomeMessage(message) {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.textContent = message;
    
    // Style the welcome message
    Object.assign(welcomeDiv.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(46, 204, 113, 0.9)',
        color: 'white',
        padding: '15px 30px',
        borderRadius: '30px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        zIndex: '1000',
        fontSize: '1.1em',
        fontWeight: 'bold',
        textAlign: 'center',
        opacity: '0',
        transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        maxWidth: '90%',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    });

    document.body.appendChild(welcomeDiv);
    
    // Trigger reflow
    void welcomeDiv.offsetWidth;
    
    // Fade in
    welcomeDiv.style.opacity = '1';
    welcomeDiv.style.transform = 'translateX(-50%) translateY(0)';
    
    // Remove after animation
    setTimeout(() => {
        welcomeDiv.style.opacity = '0';
        welcomeDiv.style.transform = 'translateX(-50%) translateY(-20px)';
        
        // Remove from DOM after fade out
        setTimeout(() => {
            if (welcomeDiv.parentNode) {
                welcomeDiv.parentNode.removeChild(welcomeDiv);
            }
        }, 500);
    }, 3000);
}

// Display error message with toast notification
function displayErrorMessage(message, type = 'error') {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.className = `error-message ${type}`;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function openModal(modalId) {
    // Hide all form containers first
    document.querySelectorAll('.form-container').forEach(container => {
        container.classList.remove('active');
    });
    
    // Hide all forms
    document.querySelectorAll('.form').forEach(form => {
        form.style.display = 'none';
    });
    
    // Get the parent container based on the modal type
    let container, form;
    
    if (modalId === 'login-tab') {
        container = document.querySelector('.form-container');
        form = document.getElementById('loginForm');
    } else if (modalId === 'register-tab') {
        container = document.querySelector('.form-container');
        form = document.getElementById('registerForm');
    } else if (modalId === 'deposit-tab') {
        container = document.querySelector('.payment-container');
        form = document.getElementById('paymentForm');
    }
    
    if (form && container) {
        form.style.display = 'block';
        container.classList.add('active');
        
        // Add click event to close when clicking outside the form
        container.onclick = function(e) {
            if (e.target === container) {
                container.classList.remove('active');
            }
        };
    }
}

function updateAuthUI(user) {
    const loginBtn = document.getElementById('login-tab');
    const registerBtn = document.getElementById('register-tab');
    const depositBtn = document.getElementById('deposit-tab');
    const signoutBtn = document.getElementById('signout-tab');
    
    if (user) {
        currentUser = user;
        isLoggedIn = true;
        tokens = user.tokens || tokens;
        
        // Reset game state for logged-in users
        spinCount = 0;
        lastBetAmount = 0;
        consecutiveLosses = 0;
        consecutiveWins = 0; // Reset bonus cycle on login
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (depositBtn) depositBtn.style.display = 'block';
        if (signoutBtn) signoutBtn.style.display = 'block';
        
        // Show welcome message
        showWelcomeMessage(`Welcome back, ${user.username || 'Player'}! 🎮`);
        
        // Update token display
        updateDisplay();
    } else {
        currentUser = null;
        isLoggedIn = false;
        
        // Reset game state for non-logged-in users
        spinCount = 0;
        consecutiveWins = 0; // Reset bonus cycle on logout
        
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (depositBtn) depositBtn.style.display = 'none';
        if (signoutBtn) signoutBtn.style.display = 'none';
        updateDisplay();
    }
}

function signOut() {
    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Clear any session storage if needed
    sessionStorage.clear();
    
    // Reset all state variables
    authToken = null;
    currentUser = null;
    isLoggedIn = false;
    
    // Clear any pending timeouts/intervals
    if (dbCheckInterval) {
        clearInterval(dbCheckInterval);
    }
    
    // Update UI to show logged out state
    document.getElementById('login-tab').style.display = 'inline-block';
    document.getElementById('register-tab').style.display = 'inline-block';
    document.getElementById('deposit-tab').style.display = 'none';
    document.getElementById('signout-tab').style.display = 'none';
    document.getElementById('tokenCount').textContent = '0';
    
    // Update status to DEMO
    const dbStatusIndicator = document.getElementById('dbStatusIndicator');
    if (dbStatusIndicator) {
        dbStatusIndicator.textContent = 'DEMO';
        dbStatusIndicator.className = 'db-status demo';
        dbStatusIndicator.title = 'Demo Mode - Not Logged In';
    }
    
    // Close all modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Reset any forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());
    
    // Show login form
    openModal('login-tab');
    
    // Show success message
    showWelcomeMessage('You have been signed out successfully!');
    
    console.log('User signed out and all data cleared');
    
    // Force a full page reload to reset the application state
    setTimeout(() => {
        window.location.reload(true);
    }, 1000);
}

// Tab switching functionality
function setupAccountTabs() {
    const paymentTab = document.getElementById('paymentTab');
    const passwordTab = document.getElementById('passwordTab');
    const paymentSection = document.getElementById('paymentSection');
    const passwordSection = document.getElementById('passwordSection');

    paymentTab.addEventListener('click', () => {
        paymentTab.classList.add('active');
        passwordTab.classList.remove('active');
        paymentSection.style.display = 'block';
        passwordSection.style.display = 'none';
    });

    passwordTab.addEventListener('click', () => {
        passwordTab.classList.add('active');
        paymentTab.classList.remove('active');
        passwordSection.style.display = 'block';
        paymentSection.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize coin renderer
    coinRenderer = new CoinRenderer();
    
    // Start monitoring database connection
    startDbConnectionMonitor();

    initializeSelects();
    startSlowSpin();
    addWinAnimationStyles();
    addHighlightStyles();
    addParticleBackground();
    addHoverEffects();
    setupCloseButtons();
    addTryAgainAnimationStyles();
    setupAccountTabs();

    // Check if user is already logged in
    if (authToken) {
        // Verify token and load user data
        fetch(`${API_BASE_URL}/api/auth/test`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateAuthUI(data.user);
            } else {
                updateAuthUI(null);
            }
        })
        .catch(() => {
            updateAuthUI(null);
        });
    }

    // Forgot password link handler
    document.getElementById('forgot-password-link').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('passwordRecoveryForm').style.display = 'block';
    });

    // Back to login link handler
    document.getElementById('back-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('passwordRecoveryForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    });

    // Registration form handler
    // Show puzzle when user starts interacting with registration form
    const registerForm = document.getElementById('registerForm');
    const formInputs = registerForm.querySelectorAll('input, select');
    
    formInputs.forEach(input => {
        input.addEventListener('focus', async () => {
            const puzzleSection = document.getElementById('puzzleSection');
            if (puzzleSection.style.display === 'none' || !document.getElementById('puzzleToken').value) {
                await loadPuzzle();
            }
        });
    });
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const phoneInput = document.getElementById('registerPhoneNumber');
        const countryCodeSelect = document.getElementById('registerCountryCode');
        const passwordInput = document.getElementById('registerPassword');
        const ageCheckbox = document.getElementById('ageCheckbox');
        
        if (!phoneInput || !countryCodeSelect || !ageCheckbox || !username || !passwordInput) {
            displayErrorMessage('Required form elements not found');
            return;
        }

        if (!ageCheckbox.checked) {
            displayErrorMessage('You must confirm you are over 18 years to register');
            return;
        }

        const phoneNumber = phoneInput.value;
        const countryCode = countryCodeSelect.value;
        const password = passwordInput.value;
        
        if (!phoneNumber || !countryCode || !username || !password) {
            displayErrorMessage('Please fill in all required fields');
            return;
        }

        if (password.length < 8) {
            displayErrorMessage('Password must be at least 8 characters long');
            return;
        }

        const fullPhoneNumber = `${countryCode}${phoneNumber}`;

        // Ensure puzzle is loaded and visible
        const puzzleSection = document.getElementById('puzzleSection');
        if (puzzleSection.style.display === 'none' || !document.getElementById('puzzleToken').value) {
            await loadPuzzle();
            displayErrorMessage('Please solve the puzzle to continue', 'info');
            return;
        }

        const puzzleAnswer = document.getElementById('puzzleAnswer').value;
        if (!puzzleAnswer) {
            displayErrorMessage('Please solve the puzzle to continue');
            return;
        }

        const puzzleToken = document.getElementById('puzzleToken').value;
        const answerHash = document.getElementById('answerHash').value;

        try {
            const result = await register(username, fullPhoneNumber, password, puzzleToken, puzzleAnswer, answerHash);
            
            if (result.success) {
                authToken = result.token;
                localStorage.setItem('authToken', authToken);
                updateAuthUI(result.user);
                document.getElementById('registerForm').style.display = 'none';
                displayErrorMessage('Registration successful! You are now logged in.', 'success');
            } else {
                displayErrorMessage(result.error || 'Registration failed');
                // Reset puzzle on failure
                await loadPuzzle();
            }
        } catch (error) {
            console.error('Registration error:', error);
            displayErrorMessage('Registration failed. Please try again.');
            await loadPuzzle();
        }
    });

    // Login form handler - REMOVED (duplicate handler exists at bottom of file)

    // Password recovery form handler - REMOVED (duplicate handler exists at bottom of file)

    // Reset password button handler
    document.getElementById('resetPasswordBtn').addEventListener('click', async () => {
        const countryCode = document.getElementById('recoveryCountryCode').value;
        const phone = document.getElementById('recoveryPhone').value;
        const token = document.getElementById('recoveryToken').value;
        const newPassword = document.getElementById('newPassword').value;
        
        if (!token || !newPassword) {
            displayErrorMessage('Please enter recovery code and new password');
            return;
        }

        if (newPassword.length < 8) {
            displayErrorMessage('Password must be at least 8 characters long');
            return;
        }
        
        const fullPhoneNumber = `${countryCode}${phone}`;

        try {
            const result = await resetPassword(fullPhoneNumber, token, newPassword);
            
            if (result.success) {
                displayErrorMessage('Password reset successful! You can now login with your new password.', 'success');
                document.getElementById('passwordRecoveryForm').style.display = 'none';
                document.getElementById('loginForm').style.display = 'block';
                // Reset recovery form
                document.getElementById('recoveryStep1').style.display = 'block';
                document.getElementById('recoveryStep2').style.display = 'none';
            } else {
                displayErrorMessage(result.error || 'Password reset failed');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            displayErrorMessage('Password reset failed. Please try again.');
        }
    });

    // Change password button handler
    document.getElementById('changePasswordBtn').addEventListener('click', async () => {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPasswordChange').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            throw new Error('All fields are required');
        }

        if (newPassword !== confirmNewPassword) {
            displayErrorMessage('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            displayErrorMessage('Password must be at least 8 characters long');
            return;
        }

        try {
            const result = await changePassword(currentPassword, newPassword);
            
            if (result.success) {
                displayErrorMessage('Password changed successfully!', 'success');
                // Clear form
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPasswordChange').value = '';
                document.getElementById('confirmNewPassword').value = '';
            } else {
                displayErrorMessage(result.error || 'Password change failed');
            }
        } catch (error) {
            console.error('Change password error:', error);
            displayErrorMessage('Password change failed. Please try again.');
        }
    });

    consecutiveWins = 0; // Reset bonus cycle on refresh

    // Payment method toggle logic
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const mobileMoneyFields = document.getElementById('mobileMoneyFields');
    const visaFields = document.getElementById('visaFields');
    if (paymentMethodSelect && mobileMoneyFields && visaFields) {
        paymentMethodSelect.addEventListener('change', function() {
            if (this.value === 'visa') {
                visaFields.style.display = 'block';
                mobileMoneyFields.style.display = 'none';
            } else {
                visaFields.style.display = 'none';
                mobileMoneyFields.style.display = 'block';
            }
        });
        // Set initial state
        if (paymentMethodSelect.value === 'visa') {
            visaFields.style.display = 'block';
            mobileMoneyFields.style.display = 'none';
        } else {
            visaFields.style.display = 'none';
            mobileMoneyFields.style.display = 'block';
        }
    }
});

// Enhanced country code initialization with automatic geolocation
const initializeSelects = async () => {
    // First define the country codes array
    const countryCodes = [
        { code: '+1', country: 'United States/Canada', flag: '🇺🇸' },
        { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
        { code: '+33', country: 'France', flag: '🇫🇷' },
        { code: '+49', country: 'Germany', flag: '🇩🇪' },
        { code: '+39', country: 'Italy', flag: '🇮🇹' },
        { code: '+34', country: 'Spain', flag: '🇪🇸' },
        { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
        { code: '+32', country: 'Belgium', flag: '🇧🇪' },
        { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
        { code: '+43', country: 'Austria', flag: '🇦🇹' },
        { code: '+45', country: 'Denmark', flag: '🇩🇰' },
        { code: '+46', country: 'Sweden', flag: '🇸🇪' },
        { code: '+47', country: 'Norway', flag: '🇳🇴' },
        { code: '+358', country: 'Finland', flag: '🇫🇮' },
        { code: '+351', country: 'Portugal', flag: '🇵🇹' },
        { code: '+30', country: 'Greece', flag: '🇬🇷' },
        { code: '+48', country: 'Poland', flag: '🇵🇱' },
        { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
        { code: '+421', country: 'Slovakia', flag: '🇸🇰' },
        { code: '+36', country: 'Hungary', flag: '🇭🇺' },
        { code: '+385', country: 'Croatia', flag: '🇭🇷' },
        { code: '+386', country: 'Slovenia', flag: '🇸🇮' },
        { code: '+372', country: 'Estonia', flag: '🇪🇪' },
        { code: '+371', country: 'Latvia', flag: '🇱🇻' },
        { code: '+370', country: 'Lithuania', flag: '🇱🇹' },
        { code: '+7', country: 'Russia', flag: '🇷🇺' },
        { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
        { code: '+375', country: 'Belarus', flag: '🇧🇾' },
        { code: '+373', country: 'Moldova', flag: '🇲🇩' },
        { code: '+40', country: 'Romania', flag: '🇷🇴' },
        { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
        { code: '+381', country: 'Serbia', flag: '🇷🇸' },
        { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
        { code: '+387', country: 'Bosnia and Herzegovina', flag: '🇧🇦' },
        { code: '+389', country: 'North Macedonia', flag: '🇲🇰' },
        { code: '+355', country: 'Albania', flag: '🇦🇱' },
        { code: '+90', country: 'Turkey', flag: '🇹🇷' },
        { code: '+972', country: 'Israel', flag: '🇮🇱' },
        { code: '+971', country: 'UAE', flag: '🇦🇪' },
        { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
        { code: '+974', country: 'Qatar', flag: '🇶🇦' },
        { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
        { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
        { code: '+968', country: 'Oman', flag: '🇴🇲' },
        { code: '+962', country: 'Jordan', flag: '🇯🇴' },
        { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
        { code: '+963', country: 'Syria', flag: '🇸🇾' },
        { code: '+964', country: 'Iraq', flag: '🇮🇶' },
        { code: '+98', country: 'Iran', flag: '🇮🇷' },
        { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
        { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
        { code: '+91', country: 'India', flag: '🇮🇳' },
        { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
        { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
        { code: '+977', country: 'Nepal', flag: '🇳🇵' },
        { code: '+975', country: 'Bhutan', flag: '🇧🇹' },
        { code: '+960', country: 'Maldives', flag: '🇲🇻' },
        { code: '+86', country: 'China', flag: '🇨🇳' },
        { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
        { code: '+853', country: 'Macau', flag: '🇲🇴' },
        { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
        { code: '+81', country: 'Japan', flag: '🇯🇵' },
        { code: '+82', country: 'South Korea', flag: '🇰🇷' },
        { code: '+850', country: 'North Korea', flag: '🇰🇵' },
        { code: '+976', country: 'Mongolia', flag: '🇲🇳' },
        { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
        { code: '+66', country: 'Thailand', flag: '🇹🇭' },
        { code: '+65', country: 'Singapore', flag: '🇸🇬' },
        { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
        { code: '+673', country: 'Brunei', flag: '🇧🇳' },
        { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
        { code: '+63', country: 'Philippines', flag: '🇵🇭' },
        { code: '+856', country: 'Laos', flag: '🇱🇦' },
        { code: '+855', country: 'Cambodia', flag: '🇰🇭' },
        { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
        { code: '+61', country: 'Australia', flag: '🇦🇺' },
        { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
        { code: '+679', country: 'Fiji', flag: '🇫🇯' },
        { code: '+685', country: 'Samoa', flag: '🇼🇸' },
        { code: '+676', country: 'Tonga', flag: '🇹🇴' },
        { code: '+27', country: 'South Africa', flag: '🇿🇦' },
        { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
        { code: '+233', country: 'Ghana', flag: '🇬🇭' },
        { code: '+254', country: 'Kenya', flag: '🇰🇪' },
        { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
        { code: '+256', country: 'Uganda', flag: '🇺🇬' },
        { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
        { code: '+257', country: 'Burundi', flag: '🇧🇮' },
        { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
        { code: '+252', country: 'Somalia', flag: '🇸🇴' },
        { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
        { code: '+20', country: 'Egypt', flag: '🇪🇬' },
        { code: '+218', country: 'Libya', flag: '🇱🇾' },
        { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
        { code: '+213', country: 'Algeria', flag: '🇩🇿' },
        { code: '+212', country: 'Morocco', flag: '🇲🇦' },
        { code: '+52', country: 'Mexico', flag: '🇲🇽' },
        { code: '+54', country: 'Argentina', flag: '🇦🇷' },
        { code: '+55', country: 'Brazil', flag: '🇧🇷' },
        { code: '+56', country: 'Chile', flag: '🇨🇱' },
        { code: '+57', country: 'Colombia', flag: '🇨🇴' },
        { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
        { code: '+51', country: 'Peru', flag: '🇵🇪' },
        { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
        { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
        { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
        { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
        { code: '+597', country: 'Suriname', flag: '🇸🇷' },
        { code: '+594', country: 'French Guiana', flag: '🇬🇫' },
        { code: '+592', country: 'Guyana', flag: '🇬🇾' }
    ];

    // Country code to country name mapping for geolocation
    const countryCodeToPhoneCode = {
        'US': '+1', 'CA': '+1', 'GB': '+44', 'FR': '+33', 'DE': '+49',
        'IT': '+39', 'ES': '+34', 'NL': '+31', 'BE': '+32', 'CH': '+41',
        'AT': '+43', 'DK': '+45', 'SE': '+46', 'NO': '+47', 'FI': '+358',
        'PT': '+351', 'GR': '+30', 'PL': '+48', 'CZ': '+420', 'SK': '+421',
        'HU': '+36', 'HR': '+385', 'SI': '+386', 'EE': '+372', 'LV': '+371',
        'LT': '+370', 'RU': '+7', 'UA': '+380', 'BY': '+375', 'MD': '+373',
        'RO': '+40', 'BG': '+359', 'RS': '+381', 'ME': '+382', 'BA': '+387',
        'MK': '+389', 'AL': '+355', 'TR': '+90', 'IL': '+972', 'AE': '+971',
        'SA': '+966', 'QA': '+974', 'KW': '+965', 'BH': '+973', 'OM': '+968',
        'JO': '+962', 'LB': '+961', 'SY': '+963', 'IQ': '+964', 'IR': '+98',
        'AF': '+93', 'PK': '+92', 'IN': '+91', 'LK': '+94', 'BD': '+880',
        'NP': '+977', 'BT': '+975', 'MV': '+960', 'CN': '+86', 'HK': '+852',
        'MO': '+853', 'TW': '+886', 'JP': '+81', 'KR': '+82', 'KP': '+850',
        'MN': '+976', 'VN': '+84', 'TH': '+66', 'SG': '+65', 'MY': '+60',
        'BN': '+673', 'ID': '+62', 'PH': '+63', 'LA': '+856', 'KH': '+855',
        'MM': '+95', 'AU': '+61', 'NZ': '+64', 'FJ': '+679', 'WS': '+685',
        'TO': '+676', 'ZA': '+27', 'NG': '+234', 'GH': '+233', 'KE': '+254',
        'TZ': '+255', 'UG': '+256', 'RW': '+250', 'BI': '+257', 'ET': '+251',
        'SO': '+252', 'DJ': '+253', 'EG': '+20', 'LY': '+218', 'TN': '+216',
        'DZ': '+213', 'MA': '+212', 'MX': '+52', 'AR': '+54', 'BR': '+55',
        'CL': '+56', 'CO': '+57', 'VE': '+58', 'PE': '+51', 'EC': '+593',
        'BO': '+591', 'PY': '+595', 'UY': '+598', 'SR': '+597', 'GF': '+594',
        'GY': '+592'
    };

    let defaultCode = '+1'; // Default to US/Canada

    // Try to get country from browser's language
    const browserLang = navigator.language || navigator.userLanguage;
    const countryFromLang = browserLang.split('-')[1]?.toUpperCase();
    
    if (countryFromLang && countryCodeToPhoneCode[countryFromLang]) {
        defaultCode = countryCodeToPhoneCode[countryFromLang];
    } else {
        // Fallback to geolocation API
        try {
            const position = await new Promise((resolve, reject) => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    });
                } else {
                    reject(new Error('Geolocation not supported'));
                }
            });

            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
            const data = await response.json();
            const countryCode = data?.address?.country_code?.toUpperCase();
            
            if (countryCode && countryCodeToPhoneCode[countryCode]) {
                defaultCode = countryCodeToPhoneCode[countryCode];
            }
        } catch (error) {
            console.log('Could not determine location, using default country code:', error);
        }
    }

    const selects = ['loginCountryCode', 'registerCountryCode', 'paymentCountryCode', 'recoveryCountryCode'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '';
            countryCodes.forEach(country => {
                const option = document.createElement('option');
                option.value = country.code;
                option.textContent = `${country.flag} ${country.code} ${country.country}`;
                select.appendChild(option);
            });
            
            // Set default based on geolocation or browser language
            select.value = defaultCode;
        }
    });

    // Initialize currency select with currencies for all countries in the country codes list
    const currencies = [
        // North America
        { code: 'USD', name: 'US Dollar', symbol: '$', countryCode: 'US,CA' },
        
        // Europe
        { code: 'EUR', name: 'Euro', symbol: '€', countryCode: 'FR,DE,IT,ES,NL,BE,FI,PT,GR,SI,SK,EE,LV,LT,IE,AT,MT,CY,LU,ME' },
        { code: 'GBP', name: 'British Pound', symbol: '£', countryCode: 'GB' },
        { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', countryCode: 'CH,LI' },
        { code: 'DKK', name: 'Danish Krone', symbol: 'kr', countryCode: 'DK' },
        { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', countryCode: 'SE' },
        { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', countryCode: 'NO' },
        { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', countryCode: 'PL' },
        { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', countryCode: 'CZ' },
        { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', countryCode: 'HU' },
        { code: 'RON', name: 'Romanian Leu', symbol: 'lei', countryCode: 'RO' },
        { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', countryCode: 'BG' },
        { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', countryCode: 'HR' },
        { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', countryCode: 'RS' },
        { code: 'ALL', name: 'Albanian Lek', symbol: 'L', countryCode: 'AL' },
        
        // Asia
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥', countryCode: 'JP' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', countryCode: 'CN' },
        { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', countryCode: 'HK' },
        { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$', countryCode: 'MO' },
        { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', countryCode: 'TW' },
        { code: 'KRW', name: 'South Korean Won', symbol: '₩', countryCode: 'KR' },
        { code: 'KPW', name: 'North Korean Won', symbol: '₩', countryCode: 'KP' },
        { code: 'MNT', name: 'Mongolian Tögrög', symbol: '₮', countryCode: 'MN' },
        { code: 'VND', name: 'Vietnamese Đồng', symbol: '₫', countryCode: 'VN' },
        { code: 'THB', name: 'Thai Baht', symbol: '฿', countryCode: 'TH' },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', countryCode: 'SG' },
        { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', countryCode: 'MY' },
        { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', countryCode: 'ID' },
        { code: 'PHP', name: 'Philippine Peso', symbol: '₱', countryCode: 'PH' },
        { code: 'LAK', name: 'Lao Kip', symbol: '₭', countryCode: 'LA' },
        { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', countryCode: 'KH' },
        { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', countryCode: 'MM' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹', countryCode: 'IN' },
        { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', countryCode: 'PK' },
        { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', countryCode: 'BD' },
        { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', countryCode: 'LK' },
        { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', countryCode: 'NP' },
        { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu', countryCode: 'BT' },
        { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', countryCode: 'MV' },
        
        // Eastern Europe and Russia
        { code: 'RUB', name: 'Russian Ruble', symbol: '₽', countryCode: 'RU' },
        { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', countryCode: 'UA' },
        { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', countryCode: 'BY' },
        { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', countryCode: 'MD' },
        { code: 'TRY', name: 'Turkish Lira', symbol: '₺', countryCode: 'TR' },
        { code: 'BAM', name: 'Bosnia and Herzegovina Convertible Mark', symbol: 'KM', countryCode: 'BA' },
        { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', countryCode: 'MK' },
        
        // Middle East
        { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', countryCode: 'IL' },
        { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', countryCode: 'AE' },
        { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', countryCode: 'SA' },
        { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', countryCode: 'QA' },
        { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', countryCode: 'KW' },
        { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', countryCode: 'BH' },
        { code: 'OMR', name: 'Omani Rial', symbol: '﷼', countryCode: 'OM' },
        { code: 'YER', name: 'Yemeni Rial', symbol: '﷼', countryCode: 'YE' },
        { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', countryCode: 'JO' },
        { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', countryCode: 'LB' },
        { code: 'SYP', name: 'Syrian Pound', symbol: '£', countryCode: 'SY' },
        { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', countryCode: 'IQ' },
        { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', countryCode: 'IR' },
        { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', countryCode: 'AF' },
        
        // Africa
        { code: 'ZAR', name: 'South African Rand', symbol: 'R', countryCode: 'ZA' },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', countryCode: 'NG' },
        { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', countryCode: 'GH' },
        { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', countryCode: 'KE' },
        { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', countryCode: 'TZ' },
        { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', countryCode: 'UG' },
        { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', countryCode: 'RW' },
        { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu', countryCode: 'BI' },
        { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', countryCode: 'ET' },
        { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh.So.', countryCode: 'SO' },
        { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj', countryCode: 'DJ' },
        { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', countryCode: 'EG' },
        { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', countryCode: 'LY' },
        { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', countryCode: 'TN' },
        { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', countryCode: 'DZ' },
        { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', countryCode: 'MA' },
        
        // Americas
        { code: 'MXN', name: 'Mexican Peso', symbol: '$', countryCode: 'MX' },
        { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', countryCode: 'BR' },
        { code: 'ARS', name: 'Argentine Peso', symbol: '$', countryCode: 'AR' },
        { code: 'CLP', name: 'Chilean Peso', symbol: '$', countryCode: 'CL' },
        { code: 'COP', name: 'Colombian Peso', symbol: '$', countryCode: 'CO' },
        { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', countryCode: 'PE' },
        { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.', countryCode: 'VE' },
        { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs', countryCode: 'BO' },
        { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', countryCode: 'PY' },
        { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', countryCode: 'UY' },
        { code: 'SRD', name: 'Surinamese Dollar', symbol: '$', countryCode: 'SR' },
        
        // Oceania
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', countryCode: 'AU' },
        { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', countryCode: 'NZ' },
        { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', countryCode: 'FJ' },
        { code: 'WST', name: 'Samoan Tālā', symbol: 'WS$', countryCode: 'WS' },
        { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', countryCode: 'TO' },
        { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', countryCode: 'BN' },
        { code: 'GYD', name: 'Guyanese Dollar', symbol: 'G$', countryCode: 'GY' }
    ];
    
    // Remove duplicates by code
    const uniqueCurrencies = [];
    const seen = new Set();
    currencies.forEach(currency => {
        if (!seen.has(currency.code)) {
            seen.add(currency.code);
            uniqueCurrencies.push(currency);
        }
    });
    
    // Sort currencies alphabetically by code
    uniqueCurrencies.sort((a, b) => a.code.localeCompare(b.code));

    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
        currencySelect.innerHTML = '';
        uniqueCurrencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency.code;
            option.textContent = `${currency.symbol} ${currency.code} - ${currency.name}`;
            // Add data attribute for country codes for future reference
            if (currency.countryCode) {
                option.dataset.countryCodes = currency.countryCode;
            }
            currencySelect.appendChild(option);
        });
        
        // Set default currency based on user's country if available
        try {
            const countryCode = browserLang.split('-')[1]?.toUpperCase();
            if (countryCode) {
                const defaultCurrency = uniqueCurrencies.find(c => 
                    c.countryCode && c.countryCode.split(',').includes(countryCode)
                );
                if (defaultCurrency) {
                    currencySelect.value = defaultCurrency.code;
                }
            }
        } catch (e) {
            console.log('Could not set default currency based on location');
        }
    }
    
    // Add event listeners to country code selectors to update currency when changed
    addCountryCodeChangeListeners();
    
    // Initialize currency based on default country code if set
    setTimeout(() => {
        // First try to get the login country code
        let countryCodeSelect = document.getElementById('loginCountryCode');
        
        // If login country code is not available, fall back to payment country code
        if (!countryCodeSelect || !countryCodeSelect.value) {
            countryCodeSelect = document.getElementById('paymentCountryCode');
        }
        
        // If we have a valid country code, update the currency
        if (countryCodeSelect && countryCodeSelect.value) {
            updateCurrencyBasedOnCountryCode(countryCodeSelect.value);
            
            // Also update the payment country code to match the login country code
            const paymentCountryCode = document.getElementById('paymentCountryCode');
            if (paymentCountryCode && countryCodeSelect.id === 'loginCountryCode') {
                paymentCountryCode.value = countryCodeSelect.value;
            }
        }
    }, 100); // Small delay to ensure all elements are properly initialized
};

// Function to create mapping between phone codes and currencies
function getPhoneCodeToCurrencyMapping() {
    return {
        '+1': 'USD',     // US/Canada
        '+44': 'GBP',    // UK
        '+33': 'EUR',    // France
        '+49': 'EUR',    // Germany
        '+39': 'EUR',    // Italy
        '+34': 'EUR',    // Spain
        '+31': 'EUR',    // Netherlands
        '+32': 'EUR',    // Belgium
        '+41': 'CHF',    // Switzerland
        '+43': 'EUR',    // Austria
        '+45': 'DKK',    // Denmark
        '+46': 'SEK',    // Sweden
        '+47': 'NOK',    // Norway
        '+358': 'EUR',   // Finland
        '+351': 'EUR',   // Portugal
        '+30': 'EUR',    // Greece
        '+48': 'PLN',    // Poland
        '+420': 'CZK',   // Czech Republic
        '+421': 'EUR',   // Slovakia
        '+36': 'HUF',    // Hungary
        '+385': 'HRK',   // Croatia
        '+386': 'EUR',   // Slovenia
        '+372': 'EUR',   // Estonia
        '+371': 'EUR',   // Latvia
        '+370': 'EUR',   // Lithuania
        '+7': 'RUB',     // Russia
        '+380': 'UAH',   // Ukraine
        '+375': 'BYN',   // Belarus
        '+373': 'MDL',   // Moldova
        '+40': 'RON',    // Romania
        '+359': 'BGN',   // Bulgaria
        '+381': 'RSD',   // Serbia
        '+382': 'EUR',   // Montenegro
        '+387': 'BAM',   // Bosnia and Herzegovina
        '+389': 'MKD',   // North Macedonia
        '+355': 'ALL',   // Albania
        '+90': 'TRY',    // Turkey
        '+972': 'ILS',   // Israel
        '+971': 'AED',   // UAE
        '+966': 'SAR',   // Saudi Arabia
        '+974': 'QAR',   // Qatar
        '+965': 'KWD',   // Kuwait
        '+973': 'BHD',   // Bahrain
        '+968': 'OMR',   // Oman
        '+962': 'JOD',   // Jordan
        '+961': 'LBP',   // Lebanon
        '+963': 'SYP',   // Syria
        '+964': 'IQD',   // Iraq
        '+98': 'IRR',    // Iran
        '+93': 'AFN',    // Afghanistan
        '+92': 'PKR',    // Pakistan
        '+91': 'INR',    // India
        '+94': 'LKR',    // Sri Lanka
        '+880': 'BDT',   // Bangladesh
        '+977': 'NPR',   // Nepal
        '+975': 'BTN',   // Bhutan
        '+960': 'MVR',   // Maldives
        '+86': 'CNY',    // China
        '+852': 'HKD',   // Hong Kong
        '+853': 'MOP',   // Macau
        '+886': 'TWD',   // Taiwan
        '+81': 'JPY',    // Japan
        '+82': 'KRW',    // South Korea
        '+850': 'KPW',   // North Korea
        '+976': 'MNT',   // Mongolia
        '+84': 'VND',    // Vietnam
        '+66': 'THB',    // Thailand
        '+65': 'SGD',    // Singapore
        '+60': 'MYR',    // Malaysia
        '+673': 'BND',   // Brunei
        '+62': 'IDR',    // Indonesia
        '+63': 'PHP',    // Philippines
        '+856': 'LAK',   // Laos
        '+855': 'KHR',   // Cambodia
        '+95': 'MMK',    // Myanmar
        '+61': 'AUD',    // Australia
        '+64': 'NZD',    // New Zealand
        '+679': 'FJD',   // Fiji
        '+685': 'WST',   // Samoa
        '+676': 'TOP',   // Tonga
        '+27': 'ZAR',    // South Africa
        '+234': 'NGN',   // Nigeria
        '+233': 'GHS',   // Ghana
        '+254': 'KES',   // Kenya
        '+255': 'TZS',   // Tanzania
        '+256': 'UGX',   // Uganda
        '+250': 'RWF',   // Rwanda
        '+257': 'BIF',   // Burundi
        '+251': 'ETB',   // Ethiopia
        '+252': 'SOS',   // Somalia
        '+253': 'DJF',   // Djibouti
        '+20': 'EGP',    // Egypt
        '+218': 'LYD',   // Libya
        '+216': 'TND',   // Tunisia
        '+213': 'DZD',   // Algeria
        '+212': 'MAD',   // Morocco
        '+52': 'MXN',    // Mexico
        '+54': 'ARS',    // Argentina
        '+55': 'BRL',    // Brazil
        '+56': 'CLP',    // Chile
        '+57': 'COP',    // Colombia
        '+58': 'VES',    // Venezuela
        '+51': 'PEN',    // Peru
        '+593': 'USD',   // Ecuador (uses USD)
        '+591': 'BOB',   // Bolivia
        '+595': 'PYG',   // Paraguay
        '+598': 'UYU',   // Uruguay
        '+597': 'SRD',   // Suriname
        '+594': 'EUR',   // French Guiana (uses EUR)
        '+592': 'GYD'    // Guyana
    };
}

// Function to update currency based on selected country code
function updateCurrencyBasedOnCountryCode(countryCode) {
    const phoneCodeToCurrency = getPhoneCodeToCurrencyMapping();
    const currencyCode = phoneCodeToCurrency[countryCode];
    if (currencyCode) {
        const currencySelect = document.getElementById('currency');
        if (currencySelect) {
            // Find the option with the matching currency code
            const currencyOption = Array.from(currencySelect.options).find(option => 
                option.value === currencyCode
            );
            if (currencyOption) {
                currencySelect.value = currencyCode;
                currencySelect.style.backgroundColor = '#e8f5e8';
                currencySelect.style.transition = 'background-color 0.3s ease';
                setTimeout(() => {
                    currencySelect.style.backgroundColor = '';
                }, 2000);
                userCountryCode = countryCode; // Update the global userCountryCode
                updateTokenDisplay(); // Update the token display with new currency
                console.log(`Currency automatically updated to ${currencyCode} for country code ${countryCode}`);
            } else {
                console.log(`Currency ${currencyCode} not found in select options for country code ${countryCode}`);
            }
        }
    } else {
        console.log(`No currency mapping found for country code: ${countryCode}`);
    }
}

// Function to add event listeners to country code selectors
function addCountryCodeChangeListeners() {
    // Add listener to the payment country code selector
    const paymentCountryCodeSelect = document.getElementById('paymentCountryCode');
    
    if (paymentCountryCodeSelect) {
        paymentCountryCodeSelect.addEventListener('change', function(event) {
            const selectedCountryCode = event.target.value;
            if (selectedCountryCode) {
                updateCurrencyBasedOnCountryCode(selectedCountryCode);
            }
        });
        
        // Initialize currency based on default selected country code
        updateCurrencyBasedOnCountryCode(paymentCountryCodeSelect.value);
    }
    
    // Add listener to the login country code selector
    const loginCountryCodeSelect = document.getElementById('loginCountryCode');
    if (loginCountryCodeSelect) {
        loginCountryCodeSelect.addEventListener('change', function(event) {
            const selectedCountryCode = event.target.value;
            if (selectedCountryCode) {
                // Update the payment country code to match login
                const paymentSelect = document.getElementById('paymentCountryCode');
                if (paymentSelect) {
                    paymentSelect.value = selectedCountryCode;
                    updateCurrencyBasedOnCountryCode(selectedCountryCode);
                }
            }
        });
    }
    
    // Update currency when registration country code changes
    const registerCountryCodeSelect = document.getElementById('registerCountryCode');
    if (registerCountryCodeSelect) {
        registerCountryCodeSelect.addEventListener('change', function(event) {
            const selectedCountryCode = event.target.value;
            if (selectedCountryCode) {
                // Update the payment country code to match registration
                const paymentSelect = document.getElementById('paymentCountryCode');
                if (paymentSelect) {
                    paymentSelect.value = selectedCountryCode;
                    updateCurrencyBasedOnCountryCode(selectedCountryCode);
                }
            }
        });
    }
};

// Function to show a small notification when currency is auto-updated
function showCurrencyUpdateNotification(currencyCode, countryCode) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('currency-update-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'currency-update-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            transform: translateX(300px);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        document.body.appendChild(notification);
    }
    
    // Update notification content
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span>💱</span>
            <span>Currency auto-updated to <strong>${currencyCode}</strong> for ${countryCode}</span>
        </div>
    `;
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(300px)';
    }, 3000);
}

// Game Logic Functions
function updateDisplay() {
    const tokenCount = document.getElementById('tokenCount');
    if (tokenCount) {
        tokenCount.textContent = tokens.toLocaleString();
        tokenCount.classList.add('updating');
        setTimeout(() => {
            tokenCount.classList.remove('updating');
        }, 500);
    }
}

function placeBet(amount) {
    if (amount > tokens) {
        displayErrorMessage("Insufficient tokens for this bet");
        return;
    }
    
    wagerAmount = amount;
    tokens -= amount;
    updateDisplay();
    
    const wagerDisplay = document.getElementById('wagerAmount');
    if (wagerDisplay) {
        wagerDisplay.textContent = wagerAmount;
        wagerDisplay.classList.add('highlight');
        setTimeout(() => {
            wagerDisplay.classList.remove('highlight');
        }, 500);
    }
}

function cancelBet() {
    if (wagerAmount > 0) {
        tokens += wagerAmount;
        wagerAmount = 0;
        updateDisplay();
        
        const wagerDisplay = document.getElementById('wagerAmount');
        if (wagerDisplay) {
            wagerDisplay.textContent = '0';
        }
    }
}

// Game Logic
async function startCoinToss(choice) {
    if (wagerAmount <= 0) {
        if (previousWagerAmount > 0 && tokens >= previousWagerAmount) {
            placeBet(previousWagerAmount);
        } else {
            displayErrorMessage("Please place a wager before playing");
            return;
        }
    }

    // Only prevent new spins if the coin is actually spinning
    if (isSpinning) return;
    
    isSpinning = true;
    stopSlowSpin(); // Stop slow spin first
    
    previousWagerAmount = wagerAmount;

    // Remove the old 2D coin animation and use the 3D coin renderer
    if (coinRenderer) {
        // Store initial rotation
        const initialRotation = coinRenderer.coin.rotation.y;
        let spins = 0;
        const maxSpins = 30;
        
        // Make sure coinRenderer knows we're in rapid spin mode
        coinRenderer.isSpinning = true;
        
        const spinInterval = setInterval(() => {
            if (!isSpinning) {
                clearInterval(spinInterval);
                return;
            }
            
            spins++;
            coinRenderer.coin.rotation.y = initialRotation + (spins * Math.PI / 2);

            if (spins >= maxSpins) {
                clearInterval(spinInterval);
                determineOutcome(choice);
            }
        }, 50);
    } else {
        // Fallback in case renderer isn't available
        await determineOutcome(choice);
    }
}

async function determineOutcome(choice) {
    const outcomes = ['heads', 'tails'];
    let result;
    let won;
    
    // Increment spin count
    spinCount++;
    
    // Determine if this is a win based on game logic
    if (isLoggedIn) {
        // For logged-in users: 3 losses then win on 4th spin
        if (wagerAmount > lastBetAmount) {
            // If bet increased, reset counter and lose 3 more times
            consecutiveLosses = 0;
            spinCount = 1; // Reset counter
            result = choice === 'heads' ? 'tails' : 'heads';
            won = false;
            consecutiveLosses++;
        } else if (wagerAmount < lastBetAmount && spinCount >= 3) {
            // If bet decreased after 3 losses, force win
            result = choice;
            won = true;
            consecutiveLosses = 0;
            spinCount = 0;
        } else if (consecutiveLosses >= 3) {
            // Win after 3 consecutive losses
            result = choice;
            won = true;
            consecutiveLosses = 0;
            spinCount = 0;
        } else {
            // Lose otherwise
            result = choice === 'heads' ? 'tails' : 'heads';
            won = false;
            consecutiveLosses++;
        }
        lastBetAmount = wagerAmount;
    } else {
        // For non-logged-in users: 3 wins then 1 loss
        if (spinCount % 4 === 0) {
            // Lose every 4th spin
            result = choice === 'heads' ? 'tails' : 'heads';
            won = false;
        } else {
            // Win otherwise
            result = choice;
            won = true;
        }
    }
    
    // Set final coin position with animation
    if (coinRenderer) {
        // Start with current rotation
        const startRotation = coinRenderer.coin.rotation.y;
        const targetRotation = result === 'heads' ? 0 : Math.PI;
        const spinDuration = 4000; // 4 seconds spin
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            // Easing function for smooth deceleration
            const easeOut = t => 1 - Math.pow(1 - t, 3);
            const easedProgress = easeOut(progress);
            
            // Calculate rotation with multiple spins
            const spinCount = 10; // Number of full spins
            const rotation = startRotation + (targetRotation + (Math.PI * 2 * spinCount) - startRotation) * easedProgress;
            
            coinRenderer.coin.rotation.y = rotation;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure final position is exact
                coinRenderer.coin.rotation.y = targetRotation % (Math.PI * 2);
                coinRenderer.isSpinning = false;
                
                // Process the outcome after animation completes
                processOutcome(won, result);
            }
        }
        
        // Start the animation
        animate();
    } else {
        // Fallback for if coinRenderer isn't available
        result = outcomes[Math.floor(Math.random() * outcomes.length)];
        won = choice === result;
        processOutcome(won, result);
    }
}

function processOutcome(won, result) {
    if (won) {
        const winnings = wagerAmount * 2;
        let bonus = 0;
        consecutiveWins = (typeof consecutiveWins === 'number') ? consecutiveWins + 1 : 1;
        // Bonus on every 4th consecutive win after the first win (i.e., 2nd, 6th, 10th, ...)
        if (consecutiveWins > 1 && (consecutiveWins - 2) % 4 === 0) {
            bonus = Math.floor(winnings * 0.5);
        }
        tokens += winnings + bonus;
        winCount++;
        showFloatingWin(winnings, false, bonus);
    } else {
        winCount = 0; // Reset win streak
        consecutiveWins = 0; // Reset bonus cycle on loss
        showResult(`😔 ${result.toUpperCase()}! You lost ${wagerAmount} tokens.`, 'lose');
    }
    wagerAmount = 0;
    updateDisplay();
    const wagerDisplay = document.getElementById('wagerAmount');
    if (wagerDisplay) {
        wagerDisplay.textContent = '0';
    }
    isSpinning = false;
    setTimeout(() => {
        if (!isSpinning) {
            startSlowSpin();
        }
    }, 2000);
}

// Floating win animation (now supports bonus)
function showFloatingWin(amount, isBonus = false, bonus = 0) {
    const resultDiv = document.getElementById('resultMessage');
    const motivationDiv = document.getElementById('motivationMessage');
    if (!resultDiv) return;
    // Remove old messages
    resultDiv.textContent = '';
    resultDiv.style.display = 'none';
    if (motivationDiv) {
        motivationDiv.textContent = '';
        motivationDiv.style.display = 'none';
    }
    // Get user name or 'you'
    let name = 'you';
    if (isLoggedIn && currentUser && currentUser.username) {
        name = currentUser.username;
    }
    // Get the coin container and token count elements
    const coinContainer = document.getElementById('coinContainer');
    const tokenCount = document.getElementById('tokenCount');
    
    // Get their positions
    const coinRect = coinContainer.getBoundingClientRect();
    const tokenRect = tokenCount.getBoundingClientRect();
    
    // Create floating amount element
    const floating = document.createElement('div');
    floating.className = 'floating-win-amount';
    
    // Build the HTML content
    let html = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 100%;">
            <div style="color: gold; font-weight: bold; font-size: 3em; line-height: 1; text-shadow: 0 0 10px gold, 0 0 20px gold;">+${amount}</div>
    `;
    
    if (bonus && bonus > 0) {
        html += `
            <div style="color: #39ff14; font-weight: bold; font-size: 1.5em; margin: 5px 0; text-shadow: 0 0 10px #39ff14, 0 0 20px #39ff14;">+${bonus} BONUS</div>
        `;
    }
    
    html += `
            <div style="color: #fff; font-size: 1.2em; margin-top: 5px; text-shadow: 0 0 5px #fff;">${name} <span style="color: gold;">WON!</span></div>
        </div>
    `;
    
    floating.innerHTML = html;
    
    // Position at the center of the coin container
    const startX = coinRect.left + (coinRect.width / 2);
    const startY = coinRect.top + (coinRect.height / 2);
    
    // Style the floating element
    Object.assign(floating.style, {
        position: 'fixed',
        left: `${startX}px`,
        top: `${startY}px`,
        transform: 'translate(-50%, -50%) scale(1.5)',
        zIndex: '2000',
        pointerEvents: 'none',
        transition: 'all 1.8s cubic-bezier(0.2, 0.8, 0.3, 1)',
        opacity: '0',
        textShadow: '0 0 20px gold, 0 0 40px #fff',
        willChange: 'transform, opacity',
        textAlign: 'center',
        padding: '10px 20px',
        borderRadius: '10px',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)'
    });
    
    document.body.appendChild(floating);
    
    // Force reflow
    void floating.offsetHeight;
    
    // Start animation sequence
    setTimeout(() => {
        // Fade in and scale up at start position
        Object.assign(floating.style, {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(2.5)'
        });
        
        // After a short delay, animate to token counter
        setTimeout(() => {
            const tokenX = tokenRect.left + (tokenRect.width / 2);
            const tokenY = tokenRect.top + (tokenRect.height / 2);
            
            Object.assign(floating.style, {
                left: `${tokenX}px`,
                top: `${tokenY}px`,
                transform: 'translate(-50%, -50%) scale(0.8)',
                opacity: '0.7'
            });
        }, 800); // Start moving after 800ms
    }, 50); // Start animation after a small delay
    // Animate token count visually
    let displayed = parseInt(tokenCount.textContent.replace(/,/g, ''));
    let target = displayed + amount + (bonus || 0);
    let step = Math.ceil((amount + (bonus || 0)) / 60); // Half the speed (was /30)
    let current = displayed;
    let interval = setInterval(() => {
        current += step;
        if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
            current = target;
            clearInterval(interval);
        }
        tokenCount.textContent = current.toLocaleString();
        tokenCount.classList.add('updating');
        setTimeout(() => tokenCount.classList.remove('updating'), 300);
    }, 40); // Double the interval (was 20)
    // After animation, remove floating and trigger coin/gem animation
    setTimeout(() => {
        floating.style.opacity = '0';
        floating.style.transform += ' scale(0.5)';
        setTimeout(() => {
            document.body.removeChild(floating);
            // Trigger coin/gem animation
            triggerCoinGemAnimation(tokenRect.left + tokenRect.width / 2, tokenRect.top + tokenRect.height / 2);
        }, 400);
    }, 2400); // Double the duration (was 1200)
}

// Coin/gem animation
function triggerCoinGemAnimation(x, y) {
    // Create a coin/gem element
    const coin = document.createElement('div');
    coin.className = 'coin-gem-animation';
    coin.style.position = 'fixed';
    coin.style.left = `${x}px`;
    coin.style.top = `${y}px`;
    coin.style.zIndex = '2100';
    coin.style.width = '40px';
    coin.style.height = '40px';
    coin.style.background = 'radial-gradient(circle at 60% 40%, gold 70%, #fff 100%)';
    coin.style.borderRadius = '50%';
    coin.style.boxShadow = '0 0 20px 5px gold, 0 0 40px 10px #fff';
    coin.style.opacity = '1';
    coin.style.transform = 'scale(1)';
    coin.style.transition = 'all 0.8s cubic-bezier(0.4,1.4,0.6,1)';
    document.body.appendChild(coin);
    setTimeout(() => {
        coin.style.transform = 'scale(1.7)';
        coin.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(coin);
        }, 800);
    }, 50);
}

function showResult(message, type) {
    // Only show for losses now
    if (type !== 'lose') return;
    const resultDiv = document.getElementById('resultMessage');
    const motivationDiv = document.getElementById('motivationMessage');
    if (!resultDiv || !motivationDiv) return;
    resultDiv.textContent = '';
    motivationDiv.textContent = '';

    // Add random loss message
    const randomMsg = lossMessages[Math.floor(Math.random() * lossMessages.length)];
    motivationDiv.textContent = randomMsg.text;
    motivationDiv.className = `motivation-message ${randomMsg.class}`;
    motivationDiv.style.display = 'block';
    motivationDiv.style.opacity = '1';
    motivationDiv.style.transform = 'translateX(0)';
    motivationDiv.style.background = 'none';
    motivationDiv.style.padding = '0';
    motivationDiv.style.boxShadow = 'none';

    // Get the coin container and token count elements
    const coinContainer = document.getElementById('coinContainer');
    const tokenCount = document.getElementById('tokenCount');
    
    // Get their positions
    const coinRect = coinContainer.getBoundingClientRect();
    const tokenRect = tokenCount.getBoundingClientRect();
    
    // Create floating loss animation
    const floatingLoss = document.createElement('div');
    floatingLoss.className = 'floating-loss-amount';
    
    // Build the HTML content
    floatingLoss.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
            <div style="color: #ff5555; font-weight: bold; font-size: 2.5em; 
                      text-shadow: 0 0 15px #ff0000, 0 0 30px #ff0000; padding: 10px 20px;
                      background: rgba(0, 0, 0, 0.6); border-radius: 10px; backdrop-filter: blur(5px);">
                TRY AGAIN
            </div>
        </div>
    `;
    
    // Position at the center of the coin container
    const startX = coinRect.left + (coinRect.width / 2);
    const startY = coinRect.top + (coinRect.height / 2);
    
    // Style the floating element
    Object.assign(floatingLoss.style, {
        position: 'fixed',
        left: `${startX}px`,
        top: `${startY}px`,
        transform: 'translate(-50%, -50%) scale(1.5)',
        zIndex: '2000',
        pointerEvents: 'none',
        transition: 'all 1.8s cubic-bezier(0.2, 0.8, 0.3, 1)',
        opacity: '0',
        willChange: 'transform, opacity',
        textAlign: 'center',
        width: 'auto',
        height: 'auto'
    });
    
    document.body.appendChild(floatingLoss);
    
    // Force reflow
    void floatingLoss.offsetHeight;
    
    // Start animation sequence
    setTimeout(() => {
        // Fade in and scale up at start position
        Object.assign(floatingLoss.style, {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(2.2)'
        });
        
        // After a short delay, animate to token counter
        setTimeout(() => {
            const tokenX = tokenRect.left + (tokenRect.width / 2);
            const tokenY = tokenRect.top + (tokenRect.height / 2);
            
            Object.assign(floatingLoss.style, {
                left: `${tokenX}px`,
                top: `${tokenY}px`,
                transform: 'translate(-50%, -50%) scale(0.8)',
                opacity: '0.5'
            });
        }, 800); // Start moving after 800ms
    }, 50); // Start animation after a small delay

    // Random disappearance effect for loss
    const disappearEffects = [
        // Fade out
        (el) => {
            el.style.transition = 'opacity 1s';
            el.style.opacity = '0';
        },
        // Shrink and fade
        (el) => {
            el.style.transition = 'transform 1s, opacity 1s';
            el.style.transform += ' scale(0.1)';
            el.style.opacity = '0';
        },
        // Rotate and fade
        (el) => {
            el.style.transition = 'transform 1s, opacity 1s';
            el.style.transform += ' rotate(1turn) scale(0.1)';
            el.style.opacity = '0';
        },
        // Slide out to the left
        (el) => {
            el.style.transition = 'transform 1s, opacity 1s';
            el.style.transform += ' translateX(-200px) scale(0.5)';
            el.style.opacity = '0';
        },
        // Slide out to the right
        (el) => {
            el.style.transition = 'transform 1s, opacity 1s';
            el.style.transform += ' translateX(200px) scale(0.5)';
            el.style.opacity = '0';
        }
    ];
    const randomDisappear = disappearEffects[Math.floor(Math.random() * disappearEffects.length)];

    setTimeout(() => {
        randomDisappear(floatingLoss);
        setTimeout(() => {
            document.body.removeChild(floatingLoss);
        }, 1000);
    }, 2400);

    // Hide the resultDiv (no text for loss, only animation)
    resultDiv.style.display = 'none';
    setTimeout(() => {
        motivationDiv.style.opacity = '0';
        motivationDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            motivationDiv.style.display = 'none';
            motivationDiv.textContent = '';
        }, 500);
    }, 2000);
}

// Payment Processing (placeholder - you'll need to implement actual payment logic)
document.addEventListener('DOMContentLoaded', function() {
    // Clear session data without confirmation
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    
    // Ensure user is not logged in on page load
    updateAuthUI(null);
    // Restore form data if available
    restoreFormData();

    // Add form submission handler for login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Disable the submit button to prevent multiple submissions
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            
            const phoneNumber = document.getElementById('loginPhone').value.trim();
            const password = document.getElementById('loginPassword').value;
            const countryCode = document.getElementById('loginCountryCode').value || '+1'; // Default to +1 if not set
            
            try {
                // Basic validation
                if (!phoneNumber) {
                    throw new Error('Please enter your phone number');
                }
                if (!password) {
                    throw new Error('Please enter your password');
                }
                
                // Format the phone number with the country code
                const formattedPhoneNumber = formatPhoneNumber(phoneNumber, countryCode);
                
                console.log('Login attempt with:', { 
                    inputPhone: phoneNumber, 
                    countryCode,
                    formattedPhoneNumber,
                    timestamp: new Date().toISOString()
                });
                
                // Call the login function
                const user = await login(formattedPhoneNumber, password);
                
                if (user) {
                    console.log('Login successful, user:', user);
                    
                    // Close the login modal on success
                    const container = loginForm.closest('.form-container');
                    if (container) {
                        container.classList.remove('active');
                    }
                    
                    // Reset the form
                    loginForm.reset();
                    
                    // Show success message
                    showWelcomeMessage(`Welcome back, ${user.username || 'User'}!`);
                    
                    // Update UI
                    updateUIForLoggedInUser(user);
                    updateAuthUI(user);
                } else {
                    throw new Error('Login failed: No user data returned');
                }
            } catch (error) {
                console.error('Login form error:', error);
                
                // Check for specific error messages
                let errorMessage = error.message || 'Login failed. Please check your credentials and try again.';
                
                // Handle specific error cases
                if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Unable to connect to the server. Please check your internet connection.';
                } else if (error.message.includes('401')) {
                    errorMessage = 'Invalid phone number or password. Please try again.';
                } else if (error.message.includes('403')) {
                    errorMessage = 'Account is locked. Please try again later or contact support.';
                }
                
                // Display error message to user
                displayErrorMessage(errorMessage, 'error');
                
                // Clear password field for security
                document.getElementById('loginPassword').value = '';
            } finally {
                // Re-enable the submit button
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
    
    // Add form submission handler for registration
    const registerForm = document.getElementById('registerForm');
    // Form submission is now handled by the form validation system
    if (registerForm) {
        // Remove the old event listener to prevent duplicate submissions
        const newRegisterForm = registerForm.cloneNode(true);
        registerForm.parentNode.replaceChild(newRegisterForm, registerForm);
        registerForm = newRegisterForm;
        
        // Add the new event listener with validation
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation will be handled by handleFormSubmit
            saveFormData();
            
            // Check if age is verified
            if (!document.getElementById('ageCheckbox').checked) {
                alert('Please verify that you are over 18 years old.');
                return;
            }
            
            // Validate puzzle
            if (!validatePuzzle()) {
                return;
            }
            
            // If we get here, puzzle is correct - proceed with registration
            const username = document.getElementById('username').value;
            const phoneNumber = document.getElementById('registerPhoneNumber').value;
            const countryCode = document.getElementById('registerCountryCode').value;
            const password = document.getElementById('registerPassword').value;
            
            // Here you would typically make an API call to register the user
            console.log('Registering user:', { username, phoneNumber, countryCode });
            
            // For demo purposes, just show success message
            alert('Registration successful!');
            registerForm.reset();
            
            // Close the modal
            const container = registerForm.closest('.form-container');
            if (container) {
                container.classList.remove('active');
            }
        });
    }
    
    // Restore form data if available
    restoreFormData();

    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!isLoggedIn) {
                displayErrorMessage("Please login first");
                return;
            }

            const amount = Number(document.getElementById('amount').value);
            
            if (amount <= 0) {
                displayErrorMessage("Please enter a valid amount");
                return;
            }
            
            // Placeholder for payment processing
            displayErrorMessage("Payment processing not implemented yet", "info");
        });
    }
});

// Add a function to get the current currency code based on userCountryCode
function getCurrentCurrencyCode() {
    const phoneCodeToCurrency = getPhoneCodeToCurrencyMapping();
    return phoneCodeToCurrency[userCountryCode] || 'USD';
}

// Update the token display to include the currency
function updateTokenDisplay() {
    const tokenCount = document.getElementById('tokenCount');
    if (tokenCount) {
        const currency = getCurrentCurrencyCode();
        tokenCount.textContent = `${tokens.toLocaleString()} ${currency}`;
        tokenCount.classList.add('updating');
        setTimeout(() => {
            tokenCount.classList.remove('updating');
        }, 500);
    }
}

// Replace all updateDisplay calls with updateTokenDisplay
function updateDisplay() {
    updateTokenDisplay();
}