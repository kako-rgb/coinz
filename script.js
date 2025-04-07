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
let winCount = 0; // Track total wins for bonus cycles
let coinRenderer;

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
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const form = button.closest('.form');
            if (form) {
                form.style.display = 'none';
                // Reset any form fields
                form.reset();
                // Hide any error messages
                const errorMessage = document.getElementById('errorMessage');
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
                // Reset recaptcha if it exists
                if (form.id === 'registerForm') {
                    resetRecaptcha();
                }
                // Hide OTP section if visible
                const otpSection = document.getElementById('otpSection');
                if (otpSection) {
                    otpSection.style.display = 'none';
                }
                // Show register button if hidden
                const registerButton = document.getElementById('registerbt');
                if (registerButton) {
                    registerButton.style.display = 'block';
                }
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

document.addEventListener('DOMContentLoaded', () => {
    // Initialize coin renderer
    coinRenderer = new CoinRenderer();

    initializeSelects();
    startSlowSpin(); // This will now work
    addWinAnimationStyles();
    addHighlightStyles();
    addParticleBackground();
    addHoverEffects();
    setupCloseButtons();
    addTryAgainAnimationStyles();

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

    // Update login success handler
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            // ...existing login logic...
            
            if (loginSuccess) { // Add this condition based on your authentication
                document.getElementById('loginForm').style.display = 'none';
                // Update UI for logged-in state
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    });

    // Update registration form handler
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            document.getElementById('registerForm').style.display = 'none';
            showRecaptcha();
            // ...existing registration logic...
        } catch (error) {
            console.error('Registration error:', error);
            document.getElementById('registerForm').style.display = 'block';
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
        showRecaptcha();
        
        // Create a new RecaptchaVerifier
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = window.initializeRecaptcha('recaptcha-container');
            await window.recaptchaVerifier.render();
        }

        // Request SMS verification
        const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
        window.confirmationResult = confirmationResult;
        
        // Hide recaptcha after successful verification
        hideRecaptcha();
        
        // Show OTP input field
        document.getElementById('otpSection').style.display = 'block';
        document.getElementById('registerbt').style.display = 'none';
        
    } catch (error) {
        console.error('Registration error:', error);
        displayErrorMessage(error.message);
        hideRecaptcha();
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
    if (wagerAmount > baseWagerAmount) {
        attemptCount = 0;
    }
    
    const shouldWin = attemptCount % 4 === 3;
    const outcome = shouldWin ? choice : (choice === "heads" ? "tails" : "heads");
    
    baseWagerAmount = wagerAmount;
    attemptCount++;

    const coin = document.getElementById("coin");

    setTimeout(async () => {
        coinRenderer.spinToSide(outcome);
        
        if (outcome === choice) {
            const winAmount = wagerAmount * 2;
            winCount++; // Increment win counter
            
            // Check if this is a bonus cycle win (2nd, 4th, 8th, 16th...)
            const isBonusWin = winCount > 0 && (winCount & (winCount - 1)) === 0;
            const bonusAmount = isBonusWin ? Math.floor(winAmount * 0.5) : 0;
            
            showWinningAnimation(winAmount, bonusAmount);
            setTimeout(async () => {
                tokens += winAmount + bonusAmount;
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

        // Reset spinning states after animation completes
        setTimeout(() => {
            isSpinning = false;
            if (coinRenderer) {
                coinRenderer.isSpinning = false;
            }
            startSlowSpin();
        }, 1000);
    }, 200);
}

// Include your existing animation and UI helper functions here
// (showWinningAnimation, applyTokenGlow, addWinAnimationStyles, etc.)

// Update the showTryAgainMessage function
function showTryAgainMessage() {
    const animations = ['fade', 'smoke', 'water', 'glitch'];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    const coinContainer = document.getElementById("coinContainer");
    const coinRect = coinContainer.getBoundingClientRect();
    
    const resultMessage = document.getElementById("resultMessage");
    resultMessage.textContent = "Try again!";
    resultMessage.className = `try-again-base try-again-${randomAnimation}`;
    
    // Position above coin container
    resultMessage.style.cssText = `
        position: absolute;
        left: 50%;
        top: ${coinRect.top - 50}px;
        transform: translate(-50%, 0);
        font-size: 36px;
        font-weight: bold;
        z-index: 1001;
        pointer-events: none;
    `;

    // Create particles for water animation
    if (randomAnimation === 'water') {
        createWaterParticles(resultMessage, coinRect);
    }

    // Clean up after animation
    setTimeout(() => {
        resultMessage.style.display = 'none';
        resultMessage.className = '';
    }, 3000);
}

// Add water particle effect
function createWaterParticles(messageElement, coinRect) {
    const particleCount = 20;
    const centerX = coinRect.left + (coinRect.width / 2);
    const centerY = coinRect.top + (coinRect.height / 2);

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY - 100}px;
            width: 4px;
            height: 4px;
            background: linear-gradient(180deg, #00f, #0ff);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
        `;

        document.body.appendChild(particle);

        const angle = (Math.random() * Math.PI * 2);
        const velocity = 2 + Math.random() * 2;
        let frame = 0;

        const animate = () => {
            frame++;
            const progress = frame / 60;
            const moveX = Math.cos(angle) * velocity * frame;
            const moveY = Math.sin(angle) * velocity * frame + (progress * progress * 50);
            
            particle.style.transform = `translate(${moveX}px, ${moveY}px)`;
            particle.style.opacity = 1 - progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };

        requestAnimationFrame(animate);
    }
}

// Update the showWinningAnimation function
function showWinningAnimation(amount, bonusAmount = 0) {
    const resultMessage = document.getElementById("resultMessage");
    const tokenDisplay = document.getElementById("tokenCount");
    const coin = document.getElementById("coin");
    const coinContainer = document.getElementById("coinContainer");
    const coinRect = coinContainer.getBoundingClientRect();
    const tokenRect = tokenDisplay.getBoundingClientRect();

    // Create floating numbers
    const floatingNumber = document.createElement('div');
    floatingNumber.textContent = `+${amount}`;
    floatingNumber.style.cssText = `
        position: fixed;
        left: ${coinRect.left + coinRect.width/2}px;
        top: ${coinRect.top + coinRect.height/2}px;
        font-size: 48px;
        font-weight: bold;
        color: gold;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.7);
        z-index: 1000;
        pointer-events: none;
        transition: all 2s ease-out;
        transform: translate(-50%, -50%) scale(1.2);
    `;
    document.body.appendChild(floatingNumber);

    // Create bonus floating number if applicable
    if (bonusAmount > 0) {
        const floatingBonus = document.createElement('div');
        floatingBonus.textContent = `BONUS +${bonusAmount}`;
        floatingBonus.style.cssText = `
            position: fixed;
            left: ${coinRect.left + coinRect.width/2}px;
            top: ${coinRect.top + coinRect.height/2 + 60}px;
            font-size: 36px;
            font-weight: bold;
            color: #00ff00;
            text-shadow: 0 0 20px rgba(0, 255, 0, 0.7);
            z-index: 1000;
            pointer-events: none;
            transition: all 2s ease-out;
            transform: translate(-50%, -50%) scale(1.2);
        `;
        document.body.appendChild(floatingBonus);

        // Animate bonus floating up
        setTimeout(() => {
            floatingBonus.style.left = `${tokenRect.left + tokenRect.width/2}px`;
            floatingBonus.style.top = `${tokenRect.top + tokenRect.height/2 + 30}px`;
            floatingBonus.style.opacity = '0';
            floatingBonus.style.transform = 'scale(1.5)';
        }, 200);

        // Clean up bonus after animation
        setTimeout(() => {
            floatingBonus.remove();
        }, 5000);
    }

    // Center congratulations message above coin container
    resultMessage.textContent = `CONGRATULATIONS!`;
    resultMessage.classList.add('win-animation');
    resultMessage.style.cssText = `
        display: block;
        font-size: 36px;
        position: absolute;
        left: 50%;
        top: ${coinRect.top - 50}px;
        width: 100%;
        transform: translateX(-50%);
        text-align: center;
        z-index: 1001;
        pointer-events: none;
        color: gold;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
        font-weight: bold;
        margin: 0;
        padding: 0;
    `;

    // Create more particles with larger size
    for (let i = 0; i < 30; i++) { // Increased from 20
        createWinParticle(coinRect.left + coinRect.width/2, coinRect.top + coinRect.height/2);
    }

    // Animate number floating up with longer duration
    setTimeout(() => {
        floatingNumber.style.left = `${tokenRect.left + tokenRect.width/2}px`;
        floatingNumber.style.top = `${tokenRect.top + tokenRect.height/2}px`;
        floatingNumber.style.opacity = '0';
        floatingNumber.style.transform = 'scale(1.5)'; // Larger end scale

        // Start counting up the tokens
        const startTokens = tokens;
        const endTokens = tokens + amount + (bonusAmount || 0);
        const duration = 2000; // Increased from 1000
        const fps = 60;
        const frames = duration / (1000 / fps);
        const increment = (endTokens - startTokens) / frames;
        let currentFrame = 0;

        const countUpInterval = setInterval(() => {
            currentFrame++;
            const currentAmount = Math.floor(startTokens + (increment * currentFrame));
            tokenDisplay.textContent = currentAmount;
            tokenDisplay.classList.add('updating');

            if (currentFrame >= frames) {
                clearInterval(countUpInterval);
                tokenDisplay.textContent = endTokens;
                tokenDisplay.classList.remove('updating');
            }
        }, 1000 / fps);
    }, 200);

    // Clean up after 5 seconds
    setTimeout(() => {
        floatingNumber.remove();
        resultMessage.style.display = 'none';
        resultMessage.classList.remove('win-animation');
    }, 5000); // Increased from 2000
}

// Update the particle animation to be larger and last longer
function createWinParticle(x, y) {
    const particle = document.createElement('div');
    const angle = Math.random() * Math.PI * 2;
    const velocity = 3 + Math.random() * 3; // Increased velocity
    const size = Math.random() * 20 + 10; // Increased size
    
    particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, gold 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 999;
        filter: blur(1px);
    `;
    
    document.body.appendChild(particle);
    
    let frame = 0;
    const animate = () => {
        frame++;
        const progress = frame / 120; // Increased from 60 for longer animation
        const moveX = Math.cos(angle) * velocity * frame;
        const moveY = Math.sin(angle) * velocity * frame + (progress * progress * 150); // Increased height
        const scale = 1.5 - progress; // Start larger
        const opacity = 1 - progress;
        
        particle.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
        particle.style.opacity = opacity;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            particle.remove();
        }
    };
    
    requestAnimationFrame(animate);
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

// Add the initializeRecaptcha function
window.initializeRecaptcha = (containerId) => {
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'normal',
        'callback': (response) => {
            console.log('reCAPTCHA solved');
            // Hide both the container and backdrop
            hideRecaptcha();
        },
        'expired-callback': () => {
            console.log('reCAPTCHA expired');
        }
    });
    return recaptchaVerifier;
};

// Add recaptcha visibility functions
function hideRecaptcha() {
    const container = document.getElementById('recaptcha-container');
    const backdrop = document.getElementById('recaptcha-backdrop');
    if (container) container.style.display = 'none';
    if (backdrop) backdrop.style.display = 'block';
}

function showRecaptcha() {
    const container = document.getElementById('recaptcha-container');
    const backdrop = document.getElementById('recaptcha-backdrop');
    if (container) container.style.display = 'flex';
    if (backdrop) backdrop.style.display = 'block';
}

function resetRecaptcha() {
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
    }
    hideRecaptcha();
}

// Add the placeBet function
function placeBet(amount) {
    if (isSpinning) {
        displayErrorMessage("Please wait for current spin to complete");
        return;
    }

    // Convert amount to number if it's a string
    amount = Number(amount);

    if (isNaN(amount) || amount <= 0) {
        displayErrorMessage("Please enter a valid bet amount");
        return;
    }

    if (amount > tokens) {
        displayErrorMessage("Insufficient tokens");
        return;
    }

    wagerAmount = amount;
    tokens -= amount;
    
    // Update displays
    updateDisplay();
    
    // Add highlight effect to wager amount
    const wagerElement = document.getElementById('wagerAmount');
    wagerElement.classList.remove('highlight');
    void wagerElement.offsetWidth; // Trigger reflow
    wagerElement.classList.add('highlight');
}

// Add the cancelBet function
function cancelBet() {
    // Reset wager amount
    wagerAmount = 0;
    
    // Update display
    const wagerElement = document.getElementById('wagerAmount');
    if (wagerElement) {
        wagerElement.textContent = '0';
        wagerElement.classList.remove('highlight');
    }
}

// Add the openModal function
function openModal(tabId) {
    // Hide all forms first
    const forms = document.querySelectorAll('.form');
    forms.forEach(form => form.style.display = 'none');
    
    // Show the selected form
    let formId;
    switch(tabId) {
        case 'login-tab':
            formId = 'loginForm';
            break;
        case 'register-tab':
            formId = 'registerForm';
            break;
        case 'deposit-tab':
            formId = 'paymentForm';
            break;
        default:
            return;
    }
    
    const selectedForm = document.getElementById(formId);
    if (selectedForm) {
        selectedForm.style.display = 'block';
        
        // Add animation class if needed
        selectedForm.classList.add('active');
        
        // Show overlay
        const overlay = document.querySelector('.overlay');
        if (overlay) {
            overlay.style.display = 'block';
        }
    }
}
