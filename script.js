document.getElementById('login-tab').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('paymentForm').style.display = 'none';
    document.getElementById('passwordRecoveryForm').style.display = 'none';
});

document.getElementById('deposit-tab').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('paymentForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('passwordRecoveryForm').style.display = 'none';
});

document.getElementById('register-tab').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('paymentForm').style.display = 'none';
    document.getElementById('passwordRecoveryForm').style.display = 'none';
});

document.getElementById('forgot-password-link').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('passwordRecoveryForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
});

document.getElementById('back-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('passwordRecoveryForm').style.display = 'none';
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailOrPhone = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password })
    });
    const data = await response.json();
    alert(data.message);
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('registerPassword').value;
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phone, password })
    });
    const data = await response.json();
    alert(data.message);
});

document.getElementById('passwordRecoveryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const recoveryEmailOrPhone = document.getElementById('recoveryEmail').value;
    const response = await fetch('/api/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryEmailOrPhone })
    });
    const data = await response.json();
    alert(data.message);
});

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('amount').value;
    const currency = document.getElementById('currency').value;
    const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency })
    });
    const data = await response.json();
    alert(data.message);
});

document.getElementById('withdrawButton').addEventListener('click', async () => {
    const amount = prompt("Enter the amount you wish to withdraw:");
    if (amount) {
        const response = await fetch('/api/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();
        alert(data.message);
    }
});
let tokens = 10000;
let wagerAmount = 0;
let isSpinning = false;
let attemptCount = 0;
let baseWagerAmount = 0;
let slowSpinInterval = null;
let previousWagerAmount = 0; // Add this variable at the top with other global variables

function updateDisplay() {
    document.getElementById("tokenCount").textContent = tokens;
    document.getElementById("wagerAmount").textContent = wagerAmount;
}

function addParticleBackground() {
    const particleContainer = document.createElement('div');
    particleContainer.id = 'particle-background';
    document.body.insertBefore(particleContainer, document.body.firstChild);

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.setProperty('--delay', `${Math.random() * 5}s`);
        particle.style.setProperty('--size', `${Math.random() * 10 + 5}px`);
        particleContainer.appendChild(particle);
    }
}
function addParticleBackground() {
    const particleContainer = document.createElement('div');
    particleContainer.id = 'particle-background';
    document.body.insertBefore(particleContainer, document.body.firstChild);

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.setProperty('--delay', `${Math.random() * 5}s`);
        particle.style.setProperty('--size', `${Math.random() * 10 + 5}px`);
        particleContainer.appendChild(particle);
    }
}

// First, add this to your window.addEventListener('load', ...) function
window.addEventListener('load', () => {
    addWinAnimationStyles();
    startSlowSpin();
    addHighlightStyles(); // Add this new line
    addParticleBackground();
    addHoverEffects();
});

// Add this new function
function addHighlightStyles() {
    const style = document.createElement('style');
    style.textContent = `
    addParticleBackground();
    addHoverEffects();
        @keyframes highlightWager {
            0% { 
                color: green;
                transform: scale(1);
            }
            50% { 
                color: #FFD700;
                text-shadow: 0 0 10px #FFD700;
                transform: scale(1.2);
            }
            100% { 
                color: green;
                transform: scale(1);
            }
        }

        .highlight-wager {
            animation: highlightWager 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}

function placeBet(amount) {
    if (tokens >= amount) {
        wagerAmount += amount;
        tokens -= amount;
        previousWagerAmount = wagerAmount; // Store the wager amount
        updateDisplay();
        
        // Add glow effect to wager amount
        const wagerElement = document.getElementById("wagerAmount");
        wagerElement.classList.remove('wager-glow');
        // Force reflow
        void wagerElement.offsetWidth;
        wagerElement.classList.add('wager-glow');
    } else {
        displayErrorMessage("Insufficient tokens.");
    }
}

function startSlowSpin() {
    if (slowSpinInterval) return;
    const coin = document.getElementById("coin");
    let spinDegree = 0;
    
    // Use a consistent interval for smooth animation
    slowSpinInterval = setInterval(() => {
        // Reverse the direction (negative degree for right to left)
        spinDegree = (spinDegree - 1) % 360;
        
        // Update coin face based on rotation
        coin.src = Math.abs(spinDegree % 360) < 180 ? "./images/heads.png" : "./images/tails.png";
        
        // Apply the rotation
        coin.style.transform = `rotateY(${spinDegree}deg)`;
    }, 30); // Keep the 30ms refresh rate for smoothness
}

function stopSlowSpin() {
    clearInterval(slowSpinInterval);
    slowSpinInterval = null;
}

function cancelBet() {
    tokens += wagerAmount;
    wagerAmount = 0;
    previousWagerAmount = 0; // Reset previous wager when canceling
    updateDisplay();
}

function updateDisplay() {
    document.getElementById("tokenCount").textContent = tokens;
    document.getElementById("wagerAmount").textContent = wagerAmount;
}

function displayErrorMessage(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerText = message;
    errorMessage.style.display = "block";
    setTimeout(() => {
        errorMessage.style.display = "none";
    }, 3000);
}

function startCoinToss(choice) {
    if (wagerAmount <= 0) {
        // Check if there was a previous wager and if user has enough tokens
        if (previousWagerAmount > 0 && tokens >= previousWagerAmount) {
            // Place the previous bet amount
            placeBet(previousWagerAmount);
        } else {
            displayErrorMessage("Please place a wager before playing.");
            return;
        }
    }

    if (isSpinning) return;
    isSpinning = true;
    stopSlowSpin();

    // Store the current wager as previous wager before the game starts
    previousWagerAmount = wagerAmount;

    const coin = document.getElementById("coin");
    let spins = 0;
    const maxSpins = 30;
    const fastSpinInterval = setInterval(() => {
        coin.src = spins % 2 === 0 ? "./images/heads.png" : "./images/tails.png";
        coin.style.transform = `rotateY(${spins * 180}deg)`;
        spins++;

        if (spins >= maxSpins) {
            clearInterval(fastSpinInterval);
            determineOutcome(choice);
        }
    }, 50);
}

function determineOutcome(choice) {
    // Check if wager has increased compared to previous wager
    if (wagerAmount > baseWagerAmount) {
        attemptCount = 0; // Reset the cycle when wager increases
    }
    
    // Determine if this should be a win (4th attempt) or loss (1st, 2nd, 3rd attempts)
    // Pattern: lose, lose, lose, win (0,1,2 = lose, 3 = win)
    const shouldWin = attemptCount % 4 === 3;
    
    // Set outcome based on win/loss determination
    const outcome = shouldWin 
        ? choice // User's choice for a win
        : (choice === "heads" ? "tails" : "heads"); // Opposite of user's choice for a loss
    
    // Update base wager amount for next comparison
    baseWagerAmount = wagerAmount;
    
    // Increment attempt counter for next round
    attemptCount++;

    const resultMessage = document.getElementById("resultMessage");
    const coin = document.getElementById("coin");

    setTimeout(() => {
        coin.src = outcome === "heads" ? "./images/heads.png" : "./images/tails.png";
        coin.style.transform = `rotateY(${outcome === "heads" ? 0 : 180}deg)`;
        
        // Update result message styling
        resultMessage.textContent = outcome === choice ? "YOU WON!" : "Try again!";
        resultMessage.style.display = "block";
        resultMessage.style.color = "#FFD700"; // Yellow color
        resultMessage.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
        resultMessage.style.fontWeight = "bold";
        resultMessage.style.fontSize = "24px";

        // Handle win/loss logic
        if (outcome === choice) {
            const winAmount = wagerAmount * 2;
            showWinningAnimation(winAmount);
            applyTokenGlow();
            setTimeout(() => {
                tokens += winAmount;
                updateDisplay();
            }, 500);
        } else {
            showTryAgainMessage();
            wagerAmount = 0;
            updateDisplay();
        }

        setTimeout(() => {
            resultMessage.style.display = "none";
            isSpinning = false;
            startSlowSpin();
        }, 3000);
    }, 200);
}

// Function to show winning animation
function showWinningAnimation(winAmount) {
    const win3DContainer = document.createElement('div');
    win3DContainer.className = 'win-3d-container';
    
    const winCounter = document.createElement('div');
    winCounter.className = 'win-counter-3d';
    
    // Create 3D particles with slower animation
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'win-particle-3d';
        particle.style.setProperty('--random-z', `${Math.random() * 500 - 250}px`);
        particle.style.setProperty('--random-rotate', `${Math.random() * 360}deg`);
        win3DContainer.appendChild(particle);
    }
    
    win3DContainer.appendChild(winCounter);
    document.body.appendChild(win3DContainer);
    
    const coinElement = document.getElementById('coin');
    const tokenCountElement = document.getElementById('tokenCount');
    
    const coinRect = coinElement.getBoundingClientRect();
    const tokenRect = tokenCountElement.getBoundingClientRect();
    
    win3DContainer.style.left = `${coinRect.left + coinRect.width/2}px`;
    win3DContainer.style.top = `${coinRect.top + coinRect.height/2}px`;
    
    let currentDisplayValue = 0;
    // Increase duration by 70% (from 2000ms to 3400ms)
    const duration = 3400; 
    const startTime = Date.now();
    
    const startX = coinRect.left + coinRect.width/2;
    const startY = coinRect.top + coinRect.height/2;
    const endX = tokenRect.left + tokenRect.width/2;
    const endY = tokenRect.top + tokenRect.height/2;
    
    // Create slower rotating 3D coins
    for (let i = 0; i < 8; i++) {
        const coin3D = document.createElement('div');
        coin3D.className = 'coin-3d';
        coin3D.style.setProperty('--random-angle', `${(i * 45) + Math.random() * 30}deg`);
        win3DContainer.appendChild(coin3D);
        
        const coinFront = document.createElement('div');
        coinFront.className = 'coin-face front';
        const coinBack = document.createElement('div');
        coinBack.className = 'coin-face back';
        
        coin3D.appendChild(coinFront);
        coin3D.appendChild(coinBack);
    }
    
    const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutBack = (x) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        };
        
        const easeProgress = easeOutBack(progress);
        
        const currentX = startX + (endX - startX) * easeProgress;
        const currentY = startY + (endY - startY) * easeProgress - Math.sin(progress * Math.PI) * 100;
        const currentZ = Math.sin(progress * Math.PI) * 100;
        
        currentDisplayValue = Math.min(Math.floor(winAmount * progress), winAmount);
        winCounter.textContent = `+${currentDisplayValue}`;
        
        win3DContainer.style.transform = `
            translate3d(${currentX - startX}px, ${currentY - startY}px, ${currentZ}px)
            rotate3d(1, 1, 0, ${progress * 720}deg)
        `;
        
        const scale = 1 + easeProgress * 0.5;
        const opacity = 1 - (easeProgress * 0.7);
        
        winCounter.style.transform = `scale3d(${scale}, ${scale}, ${scale})`;
        winCounter.style.opacity = opacity.toString();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            win3DContainer.classList.add('win-burst-3d');
            // Increase final burst duration
            setTimeout(() => {
                document.body.removeChild(win3DContainer);
            }, 510); // Increased from 300ms to 510ms
        }
    };
    
    requestAnimationFrame(animate);
    wagerAmount = 0;
}

// Function to apply glowing effect to token counter
function applyTokenGlow() {
    const tokenCounter = document.getElementById('tokenCount');
    // Remove any existing glow to ensure animation restarts
    tokenCounter.classList.remove('token-glow');
    // Force reflow
    void tokenCounter.offsetWidth;
    // Add glow class
    tokenCounter.classList.add('token-glow');
    
    // Remove glow after 3 seconds
    setTimeout(() => {
        tokenCounter.classList.remove('token-glow');
    }, 3000);
}

// Function to add styles for win animations
function addWinAnimationStyles() {
    const animationStyles = document.createElement('style');
    animationStyles.textContent = `
        .win-3d-container {
            position: fixed;
            transform-style: preserve-3d;
            perspective: 1000px;
            pointer-events: none;
            z-index: 1000;
        }
        
        .win-counter-3d {
            font-size: 28px;
            font-weight: bold;
            color: #FFD700;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8),
                         0 0 20px rgba(255, 215, 0, 0.4);
            transform-style: preserve-3d;
            backface-visibility: hidden;
        }
        
        .win-particle-3d {
            position: absolute;
            width: 10px;
            height: 10px;
            background: #FFD700;
            border-radius: 50%;
            transform-style: preserve-3d;
            animation: particle3D 1.7s ease-out forwards; /* Increased from 1s to 1.7s */
            transform: translateZ(var(--random-z)) rotate(var(--random-rotate));
        }
        
        .coin-3d {
            position: absolute;
            width: 30px;
            height: 30px;
            transform-style: preserve-3d;
            animation: coinSpin3D 1.7s ease-out forwards; /* Increased from 1s to 1.7s */
            transform: rotate(var(--random-angle)) translateX(0px);
        }
        
        .coin-face {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            backface-visibility: hidden;
        }
        
        .coin-face.front {
            background: radial-gradient(#FFD700, #FFA500);
            transform: translateZ(2px);
        }
        
        .coin-face.back {
            background: radial-gradient(#DAA520, #B8860B);
            transform: rotateY(180deg) translateZ(2px);
        }
        
        @keyframes particle3D {
            0% {
                transform: translateZ(var(--random-z)) rotate(var(--random-rotate)) scale(0);
                opacity: 1;
            }
            100% {
                transform: translateZ(var(--random-z)) rotate(var(--random-rotate)) scale(2);
                opacity: 0;
            }
        }
        
        @keyframes coinSpin3D {
            0% {
                transform: rotate(var(--random-angle)) translateX(0px);
                opacity: 1;
            }
            100% {
                transform: rotate(var(--random-angle)) translateX(100px) rotateY(720deg) rotateX(720deg);
                opacity: 0;
            }
        }
        
        .win-burst-3d {
            animation: burst3D 0.51s forwards; /* Increased from 0.3s to 0.51s */
        }
        
        @keyframes burst3D {
            0% {
                transform: scale3d(1, 1, 1) rotate3d(1, 1, 0, 0deg);
                opacity: 1;
            }
            100% {
                transform: scale3d(2, 2, 2) rotate3d(1, 1, 0, 180deg);
                opacity: 0;
            }
        }
        
        .token-glow {
            color: #FFD700 !important;
            text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700;
            animation: glowPulse 3s ease-in-out;
        }
        
        @keyframes glowPulse {
            0% { text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700; }
            25% { text-shadow: 0 0 15px #FFD700, 0 0 25px #FFD700, 0 0 35px #FFD700; color: white; }
            50% { text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700; color: #FFD700; }
            75% { text-shadow: 0 0 15px #FFD700, 0 0 25px #FFD700, 0 0 35px #FFD700; color: white; }
            100% { text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700; color: inherit; }
        }

        /* Try Again animations */
        .try-again-fade, .try-again-bounce, .try-again-slide, .try-again-shake {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1;
            pointer-events: none;
            color: #FFD700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            font-weight: bold;
            font-size: 24px;
        }

        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
            15% { opacity: 1; transform: translateX(-50%) scale(1.1); }
            85% { opacity: 1; transform: translateX(-50%) scale(1); }
            100% { opacity: 0; transform: translateX(-50%) scale(0.8); }
        }

        @keyframes bounce {
            0% { transform: translateX(-50%) translateY(0); opacity: 0; }
            15% { transform: translateX(-50%) translateY(-20px); opacity: 1; }
            30% { transform: translateX(-50%) translateY(0); }
            45% { transform: translateX(-50%) translateY(-10px); }
            60% { transform: translateX(-50%) translateY(0); }
            85% { opacity: 1; }
            100% { transform: translateX(-50%) translateY(20px); opacity: 0; }
        }

        @keyframes slide {
            0% { transform: translateX(-200%); opacity: 0; }
            15% { transform: translateX(-50%); opacity: 1; }
            85% { transform: translateX(-50%); opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
        }

        @keyframes shake {
            0% { transform: translateX(-50%) rotate(0); opacity: 0; }
            15% { opacity: 1; }
            20%, 40%, 60%, 80% { transform: translateX(-50%) rotate(5deg); }
            30%, 50%, 70% { transform: translateX(-50%) rotate(-5deg); }
            85% { opacity: 1; }
            100% { transform: translateX(-50%) rotate(0); opacity: 0; }
        }

        @keyframes try-again-fade {
            0% { opacity: 0; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes try-again-bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-20px); }
            60% { transform: translateY(-10px); }
        }
        
        @keyframes try-again-slide {
            0% { transform: translateX(-100px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes try-again-shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes spark {
            0% { transform: translate(0, 0) scale(0); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 0; }
        }
        
        .lose-spark {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #FF4444;
            border-radius: 50%;
            pointer-events: none;
            animation: spark 0.5s ease-out forwards;
        }
    `;
    document.head.appendChild(animationStyles);
}

const style = document.createElement('style');
style.textContent = `
    .coin-container {
        perspective: 1000px;
        margin: 20px auto;
    }
    
    #coin {
        width: 150px;
        height: 150px;
        position: relative;
        transform-style: preserve-3d;
    }

    /* Main coin face styling */
    #coin img {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 50%;
        filter: brightness(1.1) contrast(1.1);
        box-shadow: 
            inset 0 0 10px rgba(255,255,255,0.5),
            0 0 15px rgba(255,215,0,0.5);
    }

    /* Coin edge - front rim */
    #coin::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(45deg, #b4a002, #e6ce67, #b4a002);
        transform: translateZ(8px); /* Increased from 2px to 8px */
        box-shadow: 
            inset 0 0 10px rgba(0,0,0,0.5),
            0 5px 20px rgba(0,0,0,0.3);
        z-index: -1;
    }

    /* Coin edge - back rim */
    #coin::after {
        content: '';
        position: absolute;
        width: 96%;
        height: 96%;
        left: 2%;
        top: 2%;
        border-radius: 50%;
        background: #b4a002;
        transform: translateZ(-8px); /* Increased from -2px to -8px */
        box-shadow: 
            0 0 5px rgba(0,0,0,0.5),
            inset 0 0 10px rgba(0,0,0,0.5);
    }

    /* Continuous edge ring */
    #coin .edge {
        position: absolute;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        border-radius: 50%;
    }

    #coin .edge::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 16px; /* Increased from 4px to 16px */
        background: linear-gradient(to right,
            #b4a002 0%,
            #e6ce67 15%,
            #b4a002 20%,
            #e6ce67 35%,
            #b4a002 40%,
            #e6ce67 55%,
            #b4a002 60%,
            #e6ce67 75%,
            #b4a002 80%,
            #e6ce67 95%,
            #b4a002 100%
        );
        transform-origin: center center;
        transform: rotateX(90deg) translateZ(-8px); /* Adjusted to match new thickness */
        top: 50%;
        margin-top: -8px; /* Adjusted to half of height */
        box-shadow: 
            0 0 5px rgba(0,0,0,0.3),
            inset 0 0 2px rgba(0,0,0,0.5);
    }

    /* Shine effect overlay */
    .shine {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(45deg, 
            transparent 40%,
            rgba(255,255,255,0.3) 45%,
            rgba(255,255,255,0.5) 50%,
            rgba(255,255,255,0.3) 55%,
            transparent 60%
        );
        pointer-events: none;
        z-index: 2;
    }
`;
style.textContent += `
    .result-message {
        font-size: 3em;
        color: #FFD700;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        margin-top: 20px;
        display: none;
        position: absolute;
        top: 30%;
        width: 25%;
        font-weight: bold;
    }
`;
document.head.appendChild(style);

function showTryAgainMessage() {
    const resultMessage = document.getElementById('resultMessage');
    resultMessage.textContent = "Try again!";
    
    // Random selection of messages and animations
    const messages = [
        "Try again!",
        "Not this time!",
        "Almost there!",
        "Give it another shot!",
        "Next time's the charm!"
    ];
    
    const animations = [
        'try-again-fade',
        'try-again-bounce',
        'try-again-slide',
        'try-again-shake'
    ];
    
    // Remove any existing animation classes
    animations.forEach(anim => resultMessage.classList.remove(anim));
    
    // Select random message and animation
    resultMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
    resultMessage.classList.add(animations[Math.floor(Math.random() * animations.length)]);
    
    // Show the message
    resultMessage.style.display = 'block';
    
    // Add visual effects
    resultMessage.style.color = '#FF4444';
    resultMessage.style.textShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
    
    // Create spark effect
    createLoseSparkEffect();
    
    // Remove the animation class after it completes
    setTimeout(() => {
        resultMessage.style.display = 'none';
        animations.forEach(anim => resultMessage.classList.remove(anim));
    }, 3000);
}

function createLoseSparkEffect() {
    const coin = document.getElementById('coin');
    const rect = coin.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create multiple sparks
    for (let i = 0; i < 20; i++) {
        const spark = document.createElement('div');
        spark.className = 'lose-spark';
        
        // Random angle and distance
        const angle = (Math.random() * Math.PI * 2);
        const distance = Math.random() * 100 + 50;
        
        // Calculate end position
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        // Set position and animation variables
        spark.style.left = `${centerX}px`;
        spark.style.top = `${centerY}px`;
        spark.style.setProperty('--tx', `${tx}px`);
        spark.style.setProperty('--ty', `${ty}px`);
        
        document.body.appendChild(spark);
        
        // Remove spark after animation
        setTimeout(() => spark.remove(), 500);
    }
}
