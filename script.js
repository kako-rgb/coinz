// Global variables
let currentUser = null;
let isLoggedIn = false;
let tokens = 10000;
let wagerAmount = 0;
let isSpinning = false;
let attemptCount = 0;
let baseWagerAmount = 0;
let slowSpinInterval = null;
let previousWagerAmount = 0;

// Add after your global variables

function setupCloseButtons() {
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const form = e.target.closest('.form');
            if (form) {
                form.style.display = 'none';
            }
        });
    });
}

function addWinAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .win-animation {
            animation: glow 0.5s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from {
                text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #0ff;
            }
            to {
                text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #0ff;
            }
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
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

// Add after your other animation style functions

function addParticleBackground() {
    const style = document.createElement('style');
    style.textContent = `
        .particle {
            position: fixed;
            pointer-events: none;
            opacity: 0;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%);
            animation: particle-animation 1s ease-out forwards;
        }

        @keyframes particle-animation {
            0% {
                transform: translate(0, 0) scale(0);
                opacity: 1;
            }
            100% {
                transform: translate(var(--tx), var(--ty)) scale(1);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.setProperty('--tx', (Math.random() * 100 - 50) + 'px');
        particle.style.setProperty('--ty', (Math.random() * 100 - 50) + 'px');
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }

    // Add click event listener to create particles
    document.addEventListener('click', (e) => {
        for (let i = 0; i < 5; i++) {
            createParticle(e.clientX, e.clientY);
        }
    });
}

// Also add this function since it's mentioned in your code but not defined
function addHoverEffects() {
    const style = document.createElement('style');
    style.textContent = `
        .mbtn:hover, button:hover {
            transform: scale(1.05);
            transition: transform 0.2s ease;
        }
        
        .coin:hover {
            filter: brightness(1.2);
            transition: filter 0.2s ease;
        }
    `;
    document.head.appendChild(style);
}

// Coin Animation Functions
function startSlowSpin() {
    if (slowSpinInterval) return;
    
    const coin = document.getElementById("coin");
    let slowSpins = 0;
    
    slowSpinInterval = setInterval(() => {
        coin.src = slowSpins % 2 === 0 ? "./images/heads.png" : "./images/tails.png";
        coin.style.transform = `rotateY(${slowSpins * 180}deg)`;
        slowSpins++;
    }, 2000); // Slow rotation every 2 seconds
}

function stopSlowSpin() {
    if (slowSpinInterval) {
        clearInterval(slowSpinInterval);
        slowSpinInterval = null;
    }
}

// Modal Functions
function openModal(modalType) {
    if (!currentUser && modalType === 'deposit-tab') {
        displayErrorMessage("Please login first");
        return;
    }

    // Hide all forms first
    const forms = ['loginForm', 'registerForm', 'paymentForm', 'passwordRecoveryForm'];
    forms.forEach(form => document.getElementById(form).style.display = 'none');

    // Show the appropriate form
    switch (modalType) {
        case 'login-tab':
            document.getElementById('loginForm').style.display = 'block';
            break;
        case 'register-tab':
            document.getElementById('registerForm').style.display = 'block';
            break;
        case 'deposit-tab':
            document.getElementById('paymentForm').style.display = 'block';
            break;
    }
}

function hidePopup(formId) {
    document.getElementById(formId).style.display = 'none';
}

// Initialize Firebase Auth observer
document.addEventListener('DOMContentLoaded', () => {
    initializeSelects();
    startSlowSpin();
    addWinAnimationStyles();
    addHighlightStyles();
    addParticleBackground();
    addHoverEffects();
    setupCloseButtons();

    // Update the token display text
    const tokenDisplay = document.querySelector('nav span');
    const tokenCount = document.getElementById('tokenCount');

    // Auth state observer
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            isLoggedIn = true;
            document.getElementById('deposit-tab').style.display = 'block';
            document.getElementById('signout-tab').style.display = 'block';
            document.getElementById('login-tab').style.display = 'none';
            document.getElementById('register-tab').style.display = 'none';
            
            // Change to "Balance" and load user's balance
            tokenDisplay.firstChild.textContent = 'Balance: ';
            loadUserData(user.uid);
        } else {
            currentUser = null;
            isLoggedIn = false;
            document.getElementById('deposit-tab').style.display = 'none';
            document.getElementById('signout-tab').style.display = 'none';
            document.getElementById('login-tab').style.display = 'block';
            document.getElementById('register-tab').style.display = 'block';
            
            // Reset to demo tokens
            tokenDisplay.firstChild.textContent = 'Demo Tokens: ';
            tokens = 10000;
            updateDisplay();
        }
    });
});

// Modify the initializeSelects function

const initializeSelects = async () => {
    try {
        // Get country data with a fallback
        const response = await fetch('https://restcountries.com/v3.1/all')
            .catch(() => fetch('https://api.jsonbin.io/v3/b/YOUR_BACKUP_BIN_ID')); // Create a backup of country data
        
        if (!response.ok) {
            throw new Error('Failed to load country data');
        }
        
        const countries = await response.json();
        
        // Sort countries by name
        const sortedCountries = countries.sort((a, b) => 
            a.name.common.localeCompare(b.name.common)
        );

        // Get all select elements that need country codes
        const selects = [
            document.getElementById('loginCountryCode'),
            document.getElementById('registerCountryCode'),
            document.getElementById('paymentCountryCode')
        ];

        // Populate each select element if it exists
        selects.forEach(select => {
            if (select) {
                // Clear existing options
                select.innerHTML = '';
                
                sortedCountries.forEach(country => {
                    if (country.idd && country.idd.root) {
                        const option = document.createElement('option');
                        const code = `${country.idd.root}${country.idd.suffixes ? country.idd.suffixes[0] : ''}`;
                        option.value = code;
                        option.textContent = `${country.name.common} (${code})`;
                        select.appendChild(option);
                    }
                });
            }
        });

    } catch (error) {
        console.error('Error loading country data:', error);
        // Add fallback country codes
        const fallbackCodes = [
            { code: '+1', name: 'United States' },
            { code: '+44', name: 'United Kingdom' },
            { code: '+254', name: 'Kenya' },
            // Add more common country codes as needed
        ];

        const selects = [
            document.getElementById('loginCountryCode'),
            document.getElementById('registerCountryCode'),
            document.getElementById('paymentCountryCode')
        ];

        selects.forEach(select => {
            if (select) {
                select.innerHTML = fallbackCodes.map(country => 
                    `<option value="${country.code}">${country.name} (${country.code})</option>`
                ).join('');
            }
        });
    }
};

// Add these helper functions for geolocation

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function getUserCountry(position) {
    try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const data = await response.json();
        return data.countryCode;
    } catch (error) {
        console.error('Error getting user country:', error);
        return 'US'; // Default to US if geolocation fails
    }
}

// Firebase Data Management
async function loadUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            tokens = userData.tokens || 10000;
            updateDisplay();
        }
    } catch (error) {
        displayErrorMessage("Error loading user data: " + error.message);
    }
}

async function updateUserData() {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).set({
            tokens: tokens,
            lastUpdated: new Date()
        }, { merge: true });
    } catch (error) {
        displayErrorMessage("Error updating user data: " + error.message);
    }
}

// Replace the phone authentication code
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const phoneInput = document.getElementById('registerPhoneNumber');
    const countryCodeSelect = document.getElementById('registerCountryCode');
    
    if (!phoneInput || !countryCodeSelect) {
        console.error('Required form elements not found');
        return;
    }

    const phoneNumber = phoneInput.value;
    const countryCode = countryCodeSelect.value;
    
    if (!phoneNumber || !countryCode) {
        displayErrorMessage('Please enter both country code and phone number');
        return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    try {
        // Show recaptcha
        document.getElementById('recaptcha-container').style.display = 'flex';
        
        // Create a new RecaptchaVerifier
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = window.initializeRecaptcha('recaptcha-container');
            await window.recaptchaVerifier.render();
        }

        // Request SMS verification
        const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
        window.confirmationResult = confirmationResult;
        
        // Show OTP input field
        document.getElementById('otpSection').style.display = 'block';
        document.getElementById('registerbt').style.display = 'none';
        
    } catch (error) {
        console.error('Registration error:', error);
        displayErrorMessage(error.message);
        resetRecaptcha();
    }
});

// Add OTP verification handler
document.getElementById('verifyOTP').addEventListener('click', async function() {
    const code = document.getElementById('otpInput').value;
    try {
        const result = await window.confirmationResult.confirm(code);
        // User signed in successfully
        const user = result.user;
        alert('Phone number verified successfully!');
        // Continue with your post-verification logic
    } catch (error) {
        console.error('OTP verification error:', error);
        alert('Invalid verification code. Please try again.');
    }
});

// Update the login handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const countryCode = document.getElementById('loginCountryCode').value;
    const phone = document.getElementById('loginPhone').value;
    const fullPhoneNumber = `${countryCode}${phone}`;

    try {
        const confirmationResult = await window.signInWithPhoneNumber(window.auth, fullPhoneNumber, window.recaptchaVerifier);
        window.confirmationResult = confirmationResult;
        
        const code = prompt("Enter the verification code sent to your phone:");
        
        if (code) {
            await confirmationResult.confirm(code);
            hidePopup('loginForm');
            displayErrorMessage("Login successful!", "success");
        }
    } catch (error) {
        console.error('Login error:', error);
        displayErrorMessage(error.message);
    }
});

function signOut() {
    auth.signOut().then(() => {
        displayErrorMessage("Signed out successfully!", "success");
    }).catch((error) => {
        displayErrorMessage("Error signing out: " + error.message);
    });
}

// Payment Processing
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        displayErrorMessage("Please login first");
        return;
    }

    const amount = Number(document.getElementById('amount').value);
    
    try {
        await db.collection('transactions').add({
            userId: currentUser.uid,
            type: 'deposit',
            amount: amount,
            status: 'pending',
            createdAt: new Date()
        });

        tokens += amount;
        await updateUserData();
        updateDisplay();
        hidePopup('paymentForm');
        displayErrorMessage("Deposit successful!", "success");
    } catch (error) {
        displayErrorMessage("Payment failed: " + error.message);
    }
});

// Game Logic
function placeBet(amount) {
    if (tokens >= amount) {
        wagerAmount += amount;
        tokens -= amount;
        previousWagerAmount = wagerAmount;
        updateDisplay();
        
        const wagerElement = document.getElementById("wagerAmount");
        wagerElement.classList.remove('wager-glow');
        void wagerElement.offsetWidth;
        wagerElement.classList.add('wager-glow');
    } else {
        if (currentUser) {
            displayErrorMessage("Insufficient balance. Please deposit to continue playing.");
        } else {
            displayErrorMessage("Insufficient demo tokens. Login to play with real money.");
        }
    }
}

function cancelBet() {
    tokens += wagerAmount;
    wagerAmount = 0;
    previousWagerAmount = 0;
    updateDisplay();
}

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
    stopSlowSpin();

    previousWagerAmount = wagerAmount;

    const coin = document.getElementById("coin");
    let spins = 0;
    const maxSpins = 30;
    const fastSpinInterval = setInterval(async () => {
        coin.src = spins % 2 === 0 ? "./images/heads.png" : "./images/tails.png";
        coin.style.transform = `rotateY(${spins * 180}deg)`;
        spins++;

        if (spins >= maxSpins) {
            clearInterval(fastSpinInterval);
            await determineOutcome(choice);
        }
    }, 50);
}

async function determineOutcome(choice) {
    if (wagerAmount > baseWagerAmount) {
        attemptCount = 0;
    }
    
    const shouldWin = attemptCount % 4 === 3;
    const outcome = shouldWin ? choice : (choice === "heads" ? "tails" : "heads");
    
    baseWagerAmount = wagerAmount;
    attemptCount++;

    const coin = document.getElementById("coin");

    setTimeout(async () => {
        coin.src = outcome === "heads" ? "./images/heads.png" : "./images/tails.png";
        coin.style.transform = `rotateY(${outcome === "heads" ? 0 : 180}deg)`;
        
        if (outcome === choice) {
            const winAmount = wagerAmount * 2;
            showWinningAnimation(winAmount);
            setTimeout(async () => {
                tokens += winAmount;
                if (currentUser) {
                    await updateUserData();
                }
                updateDisplay();
            }, 500);
        } else {
            showTryAgainMessage();
            wagerAmount = 0;
            if (currentUser) {
                await updateUserData();
            }
            updateDisplay();
        }

        // Remove the isSpinning flag immediately after outcome
        isSpinning = false;
        startSlowSpin();
    }, 200);
}

// Include your existing animation and UI helper functions here
// (showWinningAnimation, applyTokenGlow, addWinAnimationStyles, etc.)

// Add this helper function for try again message
function showTryAgainMessage() {
    const resultMessage = document.getElementById("resultMessage");
    resultMessage.textContent = "Try again!";
    resultMessage.style.cssText = `
        display: block;
        font-size: 25px;
        position: absolute;
        left: 50%;
        top: calc(50% + 100px); /* Position below the coin */
        transform: translate(-50%, -50%);
        z-index: 1;
        pointer-events: none;
    `;
    setTimeout(() => {
        resultMessage.style.display = 'none';
    }, 2000);
}

// Add this helper function for win message
function showWinningAnimation(amount) {
    const resultMessage = document.getElementById("resultMessage");
    resultMessage.textContent = `CONGRATULATIONS YOU WON ${amount} TOKENS!`;
    resultMessage.classList.add('win-animation');
    resultMessage.style.cssText = `
        display: block;
        font-size: 25px;
        position: absolute;
        left: 50%;
        top: calc(50% + 100px); /* Position below the coin */
        transform: translate(-50%, -50%);
        z-index: 1;
        pointer-events: none;
    `;
    
    setTimeout(() => {
        resultMessage.style.display = 'none';
        resultMessage.classList.remove('win-animation');
    }, 2000);
}

// Helper Functions
function updateDisplay() {
    document.getElementById('tokenCount').textContent = tokens;
    document.getElementById('wagerAmount').textContent = wagerAmount;
}

function displayErrorMessage(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    }
}