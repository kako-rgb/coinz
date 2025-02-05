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
    startSlowSpin();
});

function startSlowSpin() {
    if (slowSpinInterval) return;
    const coin = document.getElementById("coin");
    let spinDegree = 0;
    slowSpinInterval = setInterval(() => {
        coin.src = spinDegree % 360 < 180 ? "./images/heads.png" : "./images/tails.png";
        coin.style.transform = `rotateY(${spinDegree}deg)`;
        spinDegree = (spinDegree + 2) % 360;
    }, 50);
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
    // Enhanced cycle logic with wager validation
    if (attemptCount === 0 || wagerAmount > baseWagerAmount) {
        baseWagerAmount = wagerAmount;
        if (wagerAmount > baseWagerAmount) attemptCount = 0;
    }

    const cyclePattern = ["loss", "loss", "loss", "win"];
    const outcome = cyclePattern[attemptCount % 4] === "win" 
        ? choice 
        : choice === "heads" ? "tails" : "heads";

    attemptCount++;

    const resultMessage = document.getElementById("resultMessage");
    const coin = document.getElementById("coin");

    setTimeout(() => {
        coin.src = outcome === "heads" ? "./images/heads.png" : "./images/tails.png";
        coin.style.transform = `rotateY(${outcome === "heads" ? 0 : 180}deg)`;
        resultMessage.textContent = outcome === choice ? "YOU WON!" : "Try again!";
        resultMessage.style.display = "block";

        if (outcome === choice) tokens += wagerAmount * 2;
        wagerAmount = 0;
        updateDisplay();

        setTimeout(() => {
            resultMessage.style.display = "none";
            isSpinning = false;
            startSlowSpin();
        }, 3000);
    }, 200);
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