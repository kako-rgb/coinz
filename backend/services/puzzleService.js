const crypto = require('crypto');

class PuzzleService {
    static generatePuzzle() {
        // Generate a simple math puzzle
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        let question = '';
        let answer;
        
        switch(operation) {
            case '+':
                question = `What is ${num1} + ${num2}?`;
                answer = num1 + num2;
                break;
            case '-':
                question = `What is ${num1} - ${num2}?`;
                answer = num1 - num2;
                break;
            case '*':
                question = `What is ${num1} * ${num2}?`;
                answer = num1 * num2;
                break;
        }
        
        // Create a unique token for this puzzle
        const token = crypto.randomBytes(16).toString('hex');
        
        // Store the answer in a way that can be verified later
        const hashedAnswer = crypto.createHash('sha256')
            .update(answer.toString())
            .digest('hex');
            
        return {
            question,
            token,
            answerHash: hashedAnswer
        };
    }
    
    static validatePuzzle(puzzleToken, userAnswer, answerHash) {
        try {
            const hashedAnswer = crypto.createHash('sha256')
                .update(userAnswer.toString())
                .digest('hex');
                
            return hashedAnswer === answerHash;
        } catch (error) {
            return false;
        }
    }
    
    static generateCaptcha() {
        // Generate a simple text captcha
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars[Math.floor(Math.random() * chars.length)];
        }
        return captcha;
    }
}

module.exports = PuzzleService;
