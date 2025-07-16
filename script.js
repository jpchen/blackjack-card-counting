
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♥', '♦', '♣', '♠'];

// mapping for suits to class names
const suitClassMap = { '♥': 'hearts', '♦': 'diams', '♣': 'clubs', '♠': 'spades' };
const rankClassMap = { 'A': 'a', 'J': 'j', 'Q': 'q', 'K': 'k', '10': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };

let numDecks = 6;
let deck = [];
let playerHands = [];
let currentHandIndex = 0;
let dealerHand = [];
let runningCount = 0;
let bank = 500;
let currentBet = 0;
let gameState = 'betting'; // betting, playing, dealerTurn, ended

const dealButton = document.getElementById('deal');
const hitButton = document.getElementById('hit');
const standButton = document.getElementById('stand');
const doubleButton = document.getElementById('double');
const splitButton = document.getElementById('split');
const messageEl = document.getElementById('message');
const bankEl = document.getElementById('bank');
const runningCountEl = document.getElementById('running-count');
const trueCountEl = document.getElementById('true-count');
const currentBetEl = document.getElementById('current-bet');
const setBankButton = document.getElementById('set-bank');
const recommendedBetEl = document.getElementById('recommended-bet');
const restartButton = document.getElementById('restart');
const setDecksButton = document.getElementById('set-decks');

restartButton.addEventListener('click', () => {
    bank = 500;
    deck = buildDeck();
    shuffle(deck);
    runningCount = 0;
    playerHands = [];
    dealerHand = [];
    currentBet = 0;
    currentHandIndex = 0;
    gameState = 'betting';
    messageEl.innerText = '';
    updateUI();
});

setBankButton.addEventListener('click', () => {
    const newBank = parseInt(document.getElementById('bank-amount').value);
    if (!isNaN(newBank) && newBank >= 100) {
        bank = newBank;
        updateUI();
    } else {
        messageEl.innerText = 'Invalid bank amount!';
    }
});

setDecksButton.addEventListener('click', () => {
    const newDeckCount = parseInt(document.getElementById('deck-count').value);
    if (!isNaN(newDeckCount) && newDeckCount>=1 && newDeckCount<=8){
        numDecks = newDeckCount;
        deck = buildDeck();
        shuffle(deck);
        runningCount = 0;
        messageEl.innerText = `Decks set to ${numDecks}. Shoe reshuffled.`;
        updateUI();
    } else {
        messageEl.innerText = 'Invalid deck count!';
    }
});

dealButton.addEventListener('click', deal);
hitButton.addEventListener('click', hit);
standButton.addEventListener('click', stand);
doubleButton.addEventListener('click', doubleDown);
splitButton.addEventListener('click', split);

function buildDeck() {
    let newDeck = [];
    for (let d = 0; d < numDecks; d++) {
        for (let suit of suits) {
            for (let rank of ranks) {
                newDeck.push({ rank, suit });
            }
        }
    }
    return newDeck;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getCardValue(card) {
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 11;
    return parseInt(card.rank);
}

function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    for (let card of hand) {
        let cardVal = getCardValue(card);
        value += cardVal;
        if (cardVal === 11) aces++;
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    return value;
}

function getCountValue(card) {
    const rankVal = ['J', 'Q', 'K'].includes(card.rank) ? 10 : parseInt(card.rank) || (card.rank === 'A' ? 10 : 0);
    if (rankVal >= 10) return -1;
    if (rankVal >= 2 && rankVal <= 6) return 1;
    return 0;
}

function updateCount(card) {
    runningCount += getCountValue(card);
    runningCountEl.innerText = runningCount;
    const decksRemaining = Math.max(1, Math.ceil(deck.length / 52));
    const trueCount = (runningCount / decksRemaining).toFixed(2);
    trueCountEl.innerText = trueCount;
}

function drawCard(hand, visible = true) {
    if (deck.length === 0) {
        deck = buildDeck();
        shuffle(deck);
        runningCount = 0;
        updateCount({ rank: '0', suit: '' }); // Reset display
        messageEl.innerText = 'Deck shuffled!';
    }
    const card = deck.pop();
    hand.push(card);
    if (visible) updateCount(card);
    return card;
}

function createCardElement(card, animated = false) {
    const div = document.createElement('div');
    div.className = `card rank-${rankClassMap[card.rank]} ${suitClassMap[card.suit]}`;
    div.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">&${suitClassMap[card.suit]};</span>`;
    
    if (animated) {
        div.classList.add('dealing');
    }
    
    return div;
}

function createHiddenCard() {
    const div = document.createElement('div');
    div.className = 'card back';
    div.innerHTML = '*';
    return div;
}

async function dealCardWithAnimation(hand, targetElement, isDealer = false, visible = true) {
    const card = drawCard(hand, false);
    
    // Get positions
    const deckElement = document.getElementById('deck-position');
    const gameElement = document.getElementById('game');
    const deckRect = deckElement.getBoundingClientRect();
    const gameRect = gameElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Create card at deck position
    const cardEl = visible ? createCardElement(card) : createHiddenCard();
    cardEl.style.position = 'absolute';
    cardEl.style.left = `${deckRect.left - gameRect.left}px`;
    cardEl.style.top = `${deckRect.top - gameRect.top}px`;
    cardEl.style.zIndex = '1000';
    cardEl.style.transform = 'scale(0.8)';
    
    gameElement.appendChild(cardEl);
    
    // Calculate final position relative to target
    const finalLeft = targetRect.left - gameRect.left + (targetElement.children.length * 10);
    const finalTop = targetRect.top - gameRect.top;
    
    // Animate to final position
    setTimeout(() => {
        cardEl.style.transition = 'all 0.8s ease-out';
        cardEl.style.left = `${finalLeft}px`;
        cardEl.style.top = `${finalTop}px`;
        cardEl.style.transform = 'scale(1)';
    }, 50);
    
    // Wait for animation to complete, then move to target element
    await new Promise(resolve => setTimeout(resolve, 850));
    
    // Remove from game element and add to target
    gameElement.removeChild(cardEl);
    cardEl.style.position = 'static';
    cardEl.style.left = 'auto';
    cardEl.style.top = 'auto';
    cardEl.style.zIndex = 'auto';
    cardEl.style.transition = 'none';
    cardEl.style.transform = 'none';
    targetElement.appendChild(cardEl);
    
    // Update count after animation
    if (visible) updateCount(card);
    
    return card;
}

async function flipCard(cardElement, newCard) {
    return new Promise(resolve => {
        cardElement.classList.add('flipping');
        
        setTimeout(() => {
            // Change card content at the middle of flip
            cardElement.className = `card rank-${rankClassMap[newCard.rank]} ${suitClassMap[newCard.suit]}`;
            cardElement.innerHTML = `<span class="rank">${newCard.rank}</span><span class="suit">&${suitClassMap[newCard.suit]};</span>`;
        }, 300);
        
        setTimeout(() => {
            cardElement.classList.remove('flipping');
            resolve();
        }, 600);
    });
}

function renderHands() {
    const dealerCardsEl = document.getElementById('dealer-cards');
    dealerCardsEl.innerHTML = '';
    dealerHand.forEach((card, index) => {
        if (index === 1 && gameState === 'playing') {
            const hiddenCard = document.createElement('div');
            hiddenCard.className = 'card back';
            hiddenCard.innerHTML = '*';
            dealerCardsEl.appendChild(hiddenCard);
        } else {
            dealerCardsEl.appendChild(createCardElement(card));
        }
    });

    const playerCardsEl = document.getElementById('player-cards');
    playerCardsEl.innerHTML = '';
    if (playerHands.length > 0) {
        playerHands[currentHandIndex].hand.forEach(card => {
            playerCardsEl.appendChild(createCardElement(card));
        });
    }
}

function updateUI() {
    renderHands();
    bankEl.innerText = bank;
    currentBetEl.innerText = currentBet;

    dealButton.disabled = gameState !== 'betting';
    hitButton.disabled = gameState !== 'playing';
    standButton.disabled = gameState !== 'playing';
    doubleButton.disabled = gameState !== 'playing' || playerHands[currentHandIndex].hand.length !== 2 || bank < playerHands[currentHandIndex].bet;
    splitButton.disabled = gameState !== 'playing' || playerHands[currentHandIndex].hand.length !== 2 || playerHands[currentHandIndex].hand[0].rank !== playerHands[currentHandIndex].hand[1].rank || bank < playerHands[currentHandIndex].bet;

    if (gameState === 'betting') {
        const tc = parseFloat(trueCountEl.innerText);
        const advantage = Math.max(0, (tc - 1) * 0.005);
        const recommendedAmount = getRecommendedBet();
        
        if (advantage > 0) {
            const kellyPercent = ((advantage / 1.35) * 100).toFixed(2);
            const betPercent = ((recommendedAmount / bank) * 100).toFixed(1);
            recommendedBetEl.innerHTML = `Recommended Bet: $${recommendedAmount}<br><small>Edge: ${(advantage * 100).toFixed(2)}% | Kelly: ${kellyPercent}% | Betting: ${betPercent}%</small>`;
        } else {
            recommendedBetEl.innerHTML = `Recommended Bet: $${recommendedAmount}<br><small>No advantage - minimum bet</small>`;
        }
    } else {
        recommendedBetEl.innerText = '';
    }
}

function getRecommendedBet() {
    const tc = parseFloat(trueCountEl.innerText);
    
    // Player advantage calculation: roughly 0.5% per true count above 1
    const advantage = Math.max(0, (tc - 1) * 0.005);
    
    // If no advantage, bet minimum
    if (advantage <= 0) {
        return Math.max(1, Math.floor(bank * 0.01)); // 1% of bankroll when no advantage
    }
    
    // Blackjack specific Kelly Criterion
    // For blackjack: Kelly = (advantage) / (variance)
    // Variance for blackjack is approximately 1.35
    const variance = 1.35;
    const kellyFraction = advantage / variance;
    
    // Apply Kelly but cap at reasonable percentages
    const maxBetPercent = 0.25; // Never bet more than 25% of bankroll
    const cappedKelly = Math.min(kellyFraction, maxBetPercent);
    
    let recommended = Math.floor(bank * cappedKelly);
    
    // Ensure reasonable betting range
    const minBet = Math.max(1, Math.floor(bank * 0.01)); // At least 1% of bankroll
    const maxBet = Math.floor(bank * 0.25); // At most 25% of bankroll
    
    recommended = Math.max(minBet, recommended);
    recommended = Math.min(maxBet, recommended);
    
    // Never bet more than we have
    if (recommended > bank) recommended = bank;
    
    return recommended;
}

async function deal() {
    messageEl.innerText = '';
    currentBet = parseInt(document.getElementById('bet-amount').value);
    if (isNaN(currentBet) || currentBet <= 0 || currentBet > bank) {
        messageEl.innerText = 'Invalid bet!';
        return;
    }
    bank -= currentBet;
    playerHands = [{ hand: [], bet: currentBet, done: false }];
    dealerHand = [];
    currentHandIndex = 0;

    const playerCardsEl = document.getElementById('player-cards');
    const dealerCardsEl = document.getElementById('dealer-cards');
    playerCardsEl.innerHTML = '';
    dealerCardsEl.innerHTML = '';

    // Deal cards with animation
    await dealCardWithAnimation(playerHands[0].hand, playerCardsEl, false, true);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await dealCardWithAnimation(dealerHand, dealerCardsEl, true, true);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await dealCardWithAnimation(playerHands[0].hand, playerCardsEl, false, true);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await dealCardWithAnimation(dealerHand, dealerCardsEl, true, false); // hole card
    
    gameState = 'playing';

    const playerValue = calculateHandValue(playerHands[0].hand);
    if (playerValue === 21) {
        setTimeout(() => stand(), 500);
        return;
    }

    updateUI();
}

async function hit() {
    const hand = playerHands[currentHandIndex].hand;
    const playerCardsEl = document.getElementById('player-cards');
    
    await dealCardWithAnimation(hand, playerCardsEl, false, true);
    
    const value = calculateHandValue(hand);
    updateUI();
    if (value > 21) {
        playerHands[currentHandIndex].done = true;
        await nextHand();
    }
}

function stand() {
    playerHands[currentHandIndex].done = true;
    nextHand();
}

async function doubleDown() {
    const hand = playerHands[currentHandIndex];
    if (bank < hand.bet) return;
    bank -= hand.bet;
    hand.bet *= 2;
    
    const playerCardsEl = document.getElementById('player-cards');
    await dealCardWithAnimation(hand.hand, playerCardsEl, false, true);
    
    const value = calculateHandValue(hand.hand);
    updateUI();
    hand.done = true;
    await nextHand();
}

function split() {
    const hand = playerHands[currentHandIndex];
    if (bank < hand.bet) return;
    bank -= hand.bet;
    const newHand = { hand: [hand.hand.pop()], bet: hand.bet, done: false };
    playerHands.splice(currentHandIndex + 1, 0, newHand);
    drawCard(hand.hand);
    drawCard(newHand.hand);
    updateUI();
}

async function nextHand() {
    while (currentHandIndex < playerHands.length - 1 && playerHands[currentHandIndex].done) {
        currentHandIndex++;
    }
    if (currentHandIndex < playerHands.length && !playerHands[currentHandIndex].done) {
        updateUI();
        return;
    }

    // Dealer turn
    gameState = 'dealerTurn';
    const dealerCardsEl = document.getElementById('dealer-cards');
    
    // Flip hole card with animation
    const hiddenCardEl = dealerCardsEl.children[1];
    const holeCard = dealerHand[1];
    
    await flipCard(hiddenCardEl, holeCard);
    updateCount(holeCard);
    updateUI();
    
    await new Promise(resolve => setTimeout(resolve, 500));

    let dealerValue = calculateHandValue(dealerHand);
    while (dealerValue < 17) {
        await dealCardWithAnimation(dealerHand, dealerCardsEl, true, true);
        await new Promise(resolve => setTimeout(resolve, 300));
        dealerValue = calculateHandValue(dealerHand);
        updateUI();
    }

    // Evaluate results
    gameState = 'ended';
    const finalDealerValue = dealerValue;
    let results = [];
    playerHands.forEach((h, index) => {
        const playerValue = calculateHandValue(h.hand);
        if (playerValue > 21) {
            results.push(`Hand ${index + 1}: Bust! Lost $${h.bet}`);
        } else if (finalDealerValue > 21 || playerValue > finalDealerValue) {
            const isBlackjack = playerValue === 21 && h.hand.length === 2;
            const payout = isBlackjack ? h.bet * 1.5 : h.bet;
            bank += h.bet + payout;
            results.push(`Hand ${index + 1}: ${isBlackjack ? 'Blackjack! ' : ''}Won $${payout}`);
        } else if (playerValue === finalDealerValue) {
            bank += h.bet;
            results.push(`Hand ${index + 1}: Push`);
        } else {
            results.push(`Hand ${index + 1}: Lost $${h.bet}`);
        }
    });
    messageEl.innerText = results.join('\n');
    gameState = 'betting';
    updateUI();
}

// Initialize deck
deck = buildDeck();
shuffle(deck);
updateUI(); 