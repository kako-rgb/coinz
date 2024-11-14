let tokens = 10000;
let wagerAmount = 0;
let isSpinning = false;

document.getElementById("tokenCount").textContent = tokens;

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

    if (isSpinning) return; // Prevent multiple spins
    isSpinning = true;

    const coin = document.getElementById("coin");
    let spins = 0;
    const maxSpins = 10;
    const interval = setInterval(() => {
        coin.src = spins % 2 === 0 ? "heads.png" : "tails.png";
        coin.style.transform = `rotateY(${spins * 180}deg)`;
        spins++;

        if (spins >= maxSpins) {
            clearInterval(interval);
            determineOutcome(choice);
        }
    }, 200);
}

function determineOutcome(choice) {
    const outcome = Math.random() < 0.5 ? "heads" : "tails";
    const resultMessage = document.getElementById("resultMessage");
    const coin = document.getElementById("coin");

    setTimeout(() => {
        coin.src = outcome === "heads" ? "heads.png" : "tails.png";
        resultMessage.textContent = outcome === choice ? "You won!" : "Try again!";
        resultMessage.style.display = "block";

        if (outcome === choice) tokens += wagerAmount * 2;
        wagerAmount = 0;
        updateDisplay();

        setTimeout(() => {
            resultMessage.style.display = "none";
            isSpinning = false;
        }, 3000);
    }, 200);
}

function login() {
    alert("Login functionality coming soon!");
}

function signUp() {
    alert("Sign Up functionality coming soon!");
}
