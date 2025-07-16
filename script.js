
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♥', '♦', '♣', '♠'];

const numDecks = 6;
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
const playerScoreEl = document.getElementById('player-score');
const dealerScoreEl = document.getElementById('dealer-score');
const currentBetEl = document.getElementById('current-bet');

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

function createCardElement(card) {
    const div = document.createElement('div');
    div.className = `card ${(['♥', '♦'].includes(card.suit) ? 'red' : '')}`;
    div.dataset.rank = card.rank;
    div.dataset.suit = card.suit;
    return div;
}

function renderHands() {
    const dealerCardsEl = document.getElementById('dealer-cards');
    dealerCardsEl.innerHTML = '';
    dealerHand.forEach((card, index) => {
        if (index === 1 && gameState === 'playing') {
            const hiddenCard = document.createElement('div');
            hiddenCard.className = 'card';
            hiddenCard.innerText = '';
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

    if (playerHands.length > 0) {
        playerScoreEl.innerText = calculateHandValue(playerHands[currentHandIndex].hand);
    } else {
        playerScoreEl.innerText = '';
    }

    if (gameState === 'playing') {
        dealerScoreEl.innerText = getCardValue(dealerHand[0]);
    } else {
        dealerScoreEl.innerText = calculateHandValue(dealerHand);
    }
}

function deal() {
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

    drawCard(playerHands[0].hand);
    drawCard(dealerHand);
    drawCard(playerHands[0].hand);
    drawCard(dealerHand, false); // hole card, not visible yet

    gameState = 'playing';

    const playerValue = calculateHandValue(playerHands[0].hand);
    if (playerValue === 21) {
        stand();
        return;
    }

    updateUI();
}

function hit() {
    drawCard(playerHands[currentHandIndex].hand);
    const value = calculateHandValue(playerHands[currentHandIndex].hand);
    updateUI();
    if (value > 21) {
        playerHands[currentHandIndex].done = true;
        nextHand();
    }
}

function stand() {
    playerHands[currentHandIndex].done = true;
    nextHand();
}

function doubleDown() {
    const hand = playerHands[currentHandIndex];
    if (bank < hand.bet) return;
    bank -= hand.bet;
    hand.bet *= 2;
    drawCard(hand.hand);
    const value = calculateHandValue(hand.hand);
    updateUI();
    hand.done = true;
    if (value <= 21) {
        nextHand();
    } else {
        nextHand();
    }
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

function nextHand() {
    while (currentHandIndex < playerHands.length - 1 && playerHands[currentHandIndex].done) {
        currentHandIndex++;
    }
    if (currentHandIndex < playerHands.length && !playerHands[currentHandIndex].done) {
        updateUI();
        return;
    }

    // Dealer turn
    gameState = 'dealerTurn';
    updateCount(dealerHand[1]); // Reveal hole card
    let dealerValue = calculateHandValue(dealerHand);
    while (dealerValue < 17) {
        drawCard(dealerHand);
        dealerValue = calculateHandValue(dealerHand);
    }
    updateUI();

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