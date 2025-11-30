const idioms = [
    { phrase: "break the ice", clue: "To start a conversation in a social setting" },
    { phrase: "bite the bullet", clue: "To decide to do something difficult or unpleasant" },
    { phrase: "piece of cake", clue: "Something very easy to do" },
    { phrase: "hit the sack", clue: "To go to bed" },
    { phrase: "miss the boat", clue: "To be too late to take advantage of an opportunity" },
    { phrase: "under the weather", clue: "Feeling slightly sick or unwell" },
    { phrase: "spill the beans", clue: "To reveal a secret" },
    { phrase: "break a leg", clue: "Good luck (often said to actors)" },
    { phrase: "sat on the fence", clue: "Undecided about something" },
    { phrase: "through thick and thin", clue: "Under all circumstances, no matter how difficult" }
];

let currentIdiom = null;
let score = 0;
let streak = 0;

const clueElement = document.getElementById('idiom-clue');
const slotsContainer = document.getElementById('word-slots');
const guessInput = document.getElementById('guess-input');
const submitBtn = document.getElementById('submit-btn');
const hintBtn = document.getElementById('hint-btn');
const messageArea = document.getElementById('message-area');
const scoreElement = document.getElementById('score');
const streakElement = document.getElementById('streak');

function initGame() {
    loadNewIdiom();
    setupEventListeners();
}

function loadNewIdiom() {
    // Reset UI
    messageArea.classList.add('hidden');
    messageArea.className = 'message hidden';
    guessInput.value = '';
    
    // Pick random idiom
    const randomIndex = Math.floor(Math.random() * idioms.length);
    currentIdiom = idioms[randomIndex];
    
    // Display clue
    clueElement.textContent = currentIdiom.clue;
    
    // Create slots
    renderSlots(currentIdiom.phrase);
}

function renderSlots(phrase) {
    slotsContainer.innerHTML = '';
    const words = phrase.split(' ');
    
    words.forEach(word => {
        const wordDiv = document.createElement('div');
        wordDiv.style.display = 'flex';
        wordDiv.style.gap = '5px';
        wordDiv.style.margin = '0 10px';
        
        for (let char of word) {
            const slot = document.createElement('div');
            slot.className = 'letter-slot';
            // Store the actual character for checking/hints later if needed
            slot.dataset.char = char; 
            wordDiv.appendChild(slot);
        }
        slotsContainer.appendChild(wordDiv);
    });
}

function checkGuess() {
    const userGuess = guessInput.value.trim().toLowerCase();
    const correctPhrase = currentIdiom.phrase.toLowerCase();
    
    if (userGuess === correctPhrase) {
        handleWin();
    } else {
        handleLoss();
    }
}

function handleWin() {
    showMessage("Correct! You're a genius! 🎉", 'success');
    score += 10 + (streak * 2);
    streak++;
    updateScoreBoard();
    revealSlots();
    
    setTimeout(() => {
        loadNewIdiom();
    }, 2000);
}

function handleLoss() {
    showMessage("Not quite! Try again.", 'error');
    streak = 0;
    updateScoreBoard();
    
    // Shake animation on input
    guessInput.classList.add('shake');
    setTimeout(() => guessInput.classList.remove('shake'), 500);
}

function revealSlots() {
    const slots = document.querySelectorAll('.letter-slot');
    let charIndex = 0;
    const phraseChars = currentIdiom.phrase.replace(/ /g, '').split(''); // Flatten phrase to chars ignoring spaces logic for simple iteration if needed, but here we just iterate slots
    
    // Actually, let's just iterate the slots directly
    let flatIndex = 0;
    const cleanPhrase = currentIdiom.phrase.replace(/ /g, ''); // Just for length check safety
    
    // We need to map slots back to the phrase structure.
    // Simpler: iterate all slots and fill them.
    let currentWordIndex = 0;
    let currentCharInWordIndex = 0;
    const words = currentIdiom.phrase.split(' ');
    
    // Re-render or just fill? Filling is cooler.
    const allSlots = document.querySelectorAll('.letter-slot');
    let globalCharIndex = 0;
    
    // Flatten phrase to iterate chars
    const flatPhrase = currentIdiom.phrase.split('').filter(c => c !== ' ');
    
    allSlots.forEach((slot, index) => {
        slot.textContent = flatPhrase[index];
        slot.classList.add('filled');
    });
}

function showMessage(text, type) {
    messageArea.textContent = text;
    messageArea.className = `message ${type}`;
    messageArea.classList.remove('hidden');
}

function updateScoreBoard() {
    scoreElement.textContent = score;
    streakElement.textContent = streak;
}

function setupEventListeners() {
    submitBtn.addEventListener('click', checkGuess);
    
    guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkGuess();
        }
    });
    
    hintBtn.addEventListener('click', () => {
        // Simple hint: reveal first letter
        const firstSlot = document.querySelector('.letter-slot');
        if (firstSlot && !firstSlot.textContent) {
             const flatPhrase = currentIdiom.phrase.split('').filter(c => c !== ' ');
             firstSlot.textContent = flatPhrase[0];
             firstSlot.classList.add('filled');
             score = Math.max(0, score - 2); // Penalty for hint
             updateScoreBoard();
        }
    });
}

// Start the game
initGame();
