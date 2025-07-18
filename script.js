
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
let bank = 10000; // Updated default
let currentBet = 0;
let gameState = 'betting'; // betting, playing, dealerTurn, ended
let roundNumber = 0;

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
const recommendedBetEl = document.getElementById('recommended-bet');
const restartButton = document.getElementById('restart');

// Welcome overlay elements
const welcomeOverlay = document.getElementById('welcome-overlay');
const startGameButton = document.getElementById('start-game');
const welcomeBankInput = document.getElementById('welcome-bank');
const welcomeDecksInput = document.getElementById('welcome-decks');

// Welcome overlay event handlers
startGameButton.addEventListener('click', startNewGame);

function startNewGame() {
    // Get settings from welcome screen
    const newBank = parseInt(welcomeBankInput.value);
    const newDecks = parseInt(welcomeDecksInput.value);
    
    if (isNaN(newBank) || newBank < 100) {
        alert('Please enter a valid bank amount (minimum $100)');
        return;
    }
    
    if (isNaN(newDecks) || newDecks < 1 || newDecks > 8) {
        alert('Please enter a valid number of decks (1-8)');
        return;
    }
    
    // Apply settings
    bank = newBank;
    numDecks = newDecks;
    
    // Reset game state
    deck = buildDeck();
    shuffle(deck);
    runningCount = 0;
    roundNumber = 0;
    playerHands = [];
    dealerHand = [];
    currentBet = 0;
    currentHandIndex = 0;
    gameState = 'betting';
    messageEl.innerText = '';
    
    // Hide overlay and start game
    welcomeOverlay.classList.add('hidden');
    updateUI();
    
    // Re-setup histogram listeners after game start
    setupHistogramListeners();
}

function showWelcomeScreen() {
    // Reset welcome screen values
    welcomeBankInput.value = 10000;
    welcomeDecksInput.value = 6;
    
    // Show overlay
    welcomeOverlay.classList.remove('hidden');
}

function checkGameOver() {
    if (bank <= 0) {
        messageEl.innerText = 'Game Over! You ran out of money. Starting new game...';
        setTimeout(() => {
            showWelcomeScreen();
        }, 2000);
        return true;
    }
    return false;
}

restartButton.addEventListener('click', () => {
    showWelcomeScreen();
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
    
    // Create card starting as back (face down)
    const cardEl = createHiddenCard(); // Always start as back
    cardEl.style.position = 'absolute';
    cardEl.style.left = `${deckRect.left - gameRect.left}px`;
    cardEl.style.top = `${deckRect.top - gameRect.top}px`;
    cardEl.style.zIndex = '1000';
    cardEl.style.transform = 'scale(0.8)';
    cardEl.style.transition = 'all 0.4s ease-out';
    
    gameElement.appendChild(cardEl);
    
    // Calculate final position relative to target
    const finalLeft = targetRect.left - gameRect.left + (targetElement.children.length * 10);
    const finalTop = targetRect.top - gameRect.top;
    
    // Animate to final position
    setTimeout(() => {
        cardEl.style.left = `${finalLeft}px`;
        cardEl.style.top = `${finalTop}px`;
        cardEl.style.transform = 'scale(1)';
    }, 50);
    
    // Wait for movement animation to complete
    await new Promise(resolve => setTimeout(resolve, 450));
    
    // Remove from game element and add to target
    gameElement.removeChild(cardEl);
    
    // Create final card (visible or hidden based on visible parameter)
    const finalCardEl = visible ? createCardElement(card) : createHiddenCard();
    finalCardEl.style.position = 'static';
    finalCardEl.style.left = 'auto';
    finalCardEl.style.top = 'auto';
    finalCardEl.style.zIndex = 'auto';
    finalCardEl.style.transition = 'none';
    finalCardEl.style.transform = 'none';
    
    // Add flip animation if revealing the card
    if (visible) {
        finalCardEl.style.opacity = '0';
        targetElement.appendChild(finalCardEl);
        setTimeout(() => {
            finalCardEl.style.transition = 'opacity 0.2s ease-in';
            finalCardEl.style.opacity = '1';
        }, 50);
    } else {
        targetElement.appendChild(finalCardEl);
    }
    
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

    const playerHandsContainer = document.getElementById('player-hands-container');
    
    if (playerHands.length <= 1) {
        // Single hand - use original layout
        playerHandsContainer.innerHTML = '<div id="player-cards" class="playingCards"></div>';
        const playerCardsEl = document.getElementById('player-cards');
        if (playerHands.length > 0) {
            playerHands[0].hand.forEach(card => {
                playerCardsEl.appendChild(createCardElement(card));
            });
        }
    } else {
        // Multiple hands - show all split hands
        playerHandsContainer.innerHTML = '';
        playerHands.forEach((hand, index) => {
            const handContainer = document.createElement('div');
            handContainer.className = 'player-hand';
            
            const handLabel = document.createElement('div');
            handLabel.className = 'player-hand-label';
            if (index === currentHandIndex && gameState === 'playing') {
                handLabel.classList.add('active');
            }
            handLabel.textContent = `Hand ${index + 1}`;
            
            const handCards = document.createElement('div');
            handCards.className = 'player-hand-cards playingCards';
            hand.hand.forEach(card => {
                handCards.appendChild(createCardElement(card));
            });
            
            handContainer.appendChild(handLabel);
            handContainer.appendChild(handCards);
            playerHandsContainer.appendChild(handContainer);
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
        
        // Check for game over
        if (checkGameOver()) {
            return;
        }
    } else {
        recommendedBetEl.innerText = '';
    }
    
    // Update basic strategy tooltips
    updateBasicStrategyTooltips();
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

function getBasicStrategyAction(playerHand, dealerUpCard) {
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = getCardValue(dealerUpCard);
    const isPlayerSoft = playerHand.some(card => card.rank === 'A') && playerValue <= 21 && playerHand.reduce((sum, card) => sum + (card.rank === 'A' ? 1 : getCardValue(card)), 0) + 10 === playerValue;
    const isPair = playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank;
    
    // Pair splitting strategy
    if (isPair && playerHand.length === 2) {
        const pairRank = playerHand[0].rank;
        switch (pairRank) {
            case 'A':
            case '8':
                return 'SPLIT';
            case '2':
            case '3':
            case '7':
                return (dealerValue >= 2 && dealerValue <= 7) ? 'SPLIT' : 'HIT';
            case '4':
                return (dealerValue === 5 || dealerValue === 6) ? 'SPLIT' : 'HIT';
            case '5':
                return (dealerValue >= 2 && dealerValue <= 9) ? 'DOUBLE' : 'HIT';
            case '6':
                return (dealerValue >= 2 && dealerValue <= 6) ? 'SPLIT' : 'HIT';
            case '9':
                return (dealerValue >= 2 && dealerValue <= 9 && dealerValue !== 7) ? 'SPLIT' : 'STAND';
            case '10':
            case 'J':
            case 'Q':
            case 'K':
                return 'STAND';
        }
    }
    
    // Soft hands (Ace counted as 11)
    if (isPlayerSoft) {
        if (playerValue >= 19) return 'STAND';
        if (playerValue === 18) {
            if (dealerValue >= 2 && dealerValue <= 6) return playerHand.length === 2 ? 'DOUBLE' : 'STAND';
            if (dealerValue === 7 || dealerValue === 8) return 'STAND';
            return 'HIT';
        }
        if (playerValue === 17) {
            return (dealerValue >= 3 && dealerValue <= 6 && playerHand.length === 2) ? 'DOUBLE' : 'HIT';
        }
        if (playerValue >= 15 && playerValue <= 16) {
            return (dealerValue >= 4 && dealerValue <= 6 && playerHand.length === 2) ? 'DOUBLE' : 'HIT';
        }
        if (playerValue >= 13 && playerValue <= 14) {
            return (dealerValue >= 5 && dealerValue <= 6 && playerHand.length === 2) ? 'DOUBLE' : 'HIT';
        }
        return 'HIT';
    }
    
    // Hard hands
    if (playerValue >= 17) return 'STAND';
    if (playerValue >= 13 && playerValue <= 16) {
        return (dealerValue >= 2 && dealerValue <= 6) ? 'STAND' : 'HIT';
    }
    if (playerValue === 12) {
        return (dealerValue >= 4 && dealerValue <= 6) ? 'STAND' : 'HIT';
    }
    if (playerValue === 11) {
        return playerHand.length === 2 ? 'DOUBLE' : 'HIT';
    }
    if (playerValue === 10) {
        return (dealerValue >= 2 && dealerValue <= 9 && playerHand.length === 2) ? 'DOUBLE' : 'HIT';
    }
    if (playerValue === 9) {
        return (dealerValue >= 3 && dealerValue <= 6 && playerHand.length === 2) ? 'DOUBLE' : 'HIT';
    }
    
    return 'HIT';
}

function updateBasicStrategyTooltips() {
    if (gameState !== 'playing' || playerHands.length === 0 || dealerHand.length === 0) {
        // Clear strategy classes
        hitButton.className = hitButton.className.replace(/strategy-\w+/g, '').trim();
        standButton.className = standButton.className.replace(/strategy-\w+/g, '').trim();
        doubleButton.className = doubleButton.className.replace(/strategy-\w+/g, '').trim();
        splitButton.className = splitButton.className.replace(/strategy-\w+/g, '').trim();
        return;
    }
    
    const currentHand = playerHands[currentHandIndex].hand;
    const dealerUpCard = dealerHand[0];
    const recommendedAction = getBasicStrategyAction(currentHand, dealerUpCard);
    
    // Clear all strategy classes first
    [hitButton, standButton, doubleButton, splitButton].forEach(button => {
        button.className = button.className.replace(/strategy-\w+/g, '').trim();
    });
    
    // Add strategy classes based on recommendation
    const buttons = {
        'HIT': hitButton,
        'STAND': standButton,
        'DOUBLE': doubleButton,
        'SPLIT': splitButton
    };
    
    Object.keys(buttons).forEach(action => {
        const button = buttons[action];
        if (action === recommendedAction) {
            button.classList.add('strategy-recommended');
        } else if (!button.disabled) {
            button.classList.add('strategy-not-recommended');
        } else {
            button.classList.add('strategy-neutral');
        }
    });
}

async function deal() {
    messageEl.innerText = '';
    roundNumber++;
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

    // Check for dealer blackjack first
    const dealerValue = calculateHandValue(dealerHand);
    if (dealerValue === 21) {
        // Dealer has blackjack, resolve immediately
        setTimeout(async () => {
            await resolveDealerBlackjack();
        }, 500);
        return;
    }

    const playerValue = calculateHandValue(playerHands[0].hand);
    if (playerValue === 21) {
        setTimeout(() => stand(), 500);
        return;
    }

    updateUI();
}

async function resolveDealerBlackjack() {
    // Flip hole card to reveal dealer blackjack
    gameState = 'dealerTurn';
    const dealerCardsEl = document.getElementById('dealer-cards');
    const hiddenCardEl = dealerCardsEl.children[1];
    const holeCard = dealerHand[1];
    
    await flipCard(hiddenCardEl, holeCard);
    updateCount(holeCard);
    updateUI();
    
    // Evaluate results
    gameState = 'ended';
    let results = [];
    playerHands.forEach((h, index) => {
        const playerValue = calculateHandValue(h.hand);
        const handLabel = playerHands.length > 1 ? `Round ${roundNumber} Hand ${index + 1}` : `Round ${roundNumber}`;
        
        if (playerValue === 21 && h.hand.length === 2) {
            // Player also has blackjack - push
            bank += h.bet;
            results.push(`${handLabel}: Push (Both Blackjack)`);
        } else {
            // Dealer wins with blackjack
            results.push(`${handLabel}: Dealer Blackjack! Lost $${h.bet}`);
        }
    });
    messageEl.innerText = results.join('\n');
    gameState = 'betting';
    updateUI();
}

async function hit() {
    const hand = playerHands[currentHandIndex].hand;
    let targetElement;
    
    if (playerHands.length <= 1) {
        targetElement = document.getElementById('player-cards');
    } else {
        // For split hands, find the correct hand container
        const handContainers = document.querySelectorAll('.player-hand-cards');
        targetElement = handContainers[currentHandIndex];
    }
    
    await dealCardWithAnimation(hand, targetElement, false, true);
    
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
    
    let targetElement;
    if (playerHands.length <= 1) {
        targetElement = document.getElementById('player-cards');
    } else {
        // For split hands, find the correct hand container
        const handContainers = document.querySelectorAll('.player-hand-cards');
        targetElement = handContainers[currentHandIndex];
    }
    
    await dealCardWithAnimation(hand.hand, targetElement, false, true);
    
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

    // Check if all player hands are busted
    const allPlayerHandsBusted = playerHands.every(hand => calculateHandValue(hand.hand) > 21);

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
    
    // Only draw more cards if not all player hands are busted
    if (!allPlayerHandsBusted) {
        while (dealerValue < 17) {
            await dealCardWithAnimation(dealerHand, dealerCardsEl, true, true);
            await new Promise(resolve => setTimeout(resolve, 300));
            dealerValue = calculateHandValue(dealerHand);
            updateUI();
        }
    }

    // Evaluate results
    gameState = 'ended';
    const finalDealerValue = dealerValue;
    let results = [];
    playerHands.forEach((h, index) => {
        const playerValue = calculateHandValue(h.hand);
        const handLabel = playerHands.length > 1 ? `Round ${roundNumber} Hand ${index + 1}` : `Round ${roundNumber}`;
        
        if (playerValue > 21) {
            results.push(`${handLabel}: Bust! Lost $${h.bet}`);
        } else if (finalDealerValue > 21 || playerValue > finalDealerValue) {
            const isBlackjack = playerValue === 21 && h.hand.length === 2;
            const payout = isBlackjack ? h.bet * 1.5 : h.bet;
            bank += h.bet + payout;
            results.push(`${handLabel}: ${isBlackjack ? 'Blackjack! ' : ''}Won $${payout}`);
        } else if (playerValue === finalDealerValue) {
            bank += h.bet;
            results.push(`${handLabel}: Push`);
        } else {
            results.push(`${handLabel}: Lost $${h.bet}`);
        }
    });
    messageEl.innerText = results.join('\n');
    gameState = 'betting';
    updateUI();
}

// Card Histogram Functionality
function calculateRemainingCards() {
    const remaining = {};
    
    // Initialize counts for all ranks
    ranks.forEach(rank => {
        remaining[rank] = numDecks * 4; // 4 suits per deck
    });
    
    // Create full deck to compare against
    const fullDeck = buildDeck();
    
    // Subtract dealt cards
    const dealtCards = fullDeck.length - deck.length;
    
    // Count cards in current hands
    const currentCards = [];
    if (dealerHand && Array.isArray(dealerHand)) {
        currentCards.push(...dealerHand);
    }
    if (playerHands && Array.isArray(playerHands)) {
        playerHands.forEach(hand => {
            if (hand && Array.isArray(hand)) {
                currentCards.push(...hand);
            }
        });
    }
    
    // Subtract cards currently in play
    currentCards.forEach(card => {
        if (remaining[card.rank] > 0) {
            remaining[card.rank]--;
        }
    });
    
    // Subtract cards already dealt from deck
    const originalDeck = buildDeck();
    const remainingCards = [...deck];
    
    // Calculate what's been dealt by comparing original deck size to current
    const totalDealt = originalDeck.length - deck.length;
    
    // Count actual remaining cards in deck
    const deckCounts = {};
    ranks.forEach(rank => deckCounts[rank] = 0);
    
    deck.forEach(card => {
        deckCounts[card.rank]++;
    });
    
    return {
        counts: deckCounts,
        totalRemaining: deck.length,
        totalDealt: originalDeck.length - deck.length
    };
}

function showHistogram() {
    console.log('showHistogram called');
    const modal = document.getElementById('histogram-modal');
    const container = document.getElementById('histogram-container');
    const totalRemainingEl = document.getElementById('total-remaining');
    const cardsDealtEl = document.getElementById('cards-dealt');
    
    try {
        const data = calculateRemainingCards();
        console.log('Card data calculated:', data);
    } catch (error) {
        console.error('Error calculating remaining cards:', error);
        return;
    }
    
    const data = calculateRemainingCards();
    
    // Clear previous histogram
    container.innerHTML = '';
    
    // Update stats
    totalRemainingEl.textContent = data.totalRemaining;
    cardsDealtEl.textContent = data.totalDealt;
    
    // Find max count for scaling
    const maxCount = Math.max(...Object.values(data.counts));
    
    // Create histogram bars
    ranks.forEach(rank => {
        const count = data.counts[rank];
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        const bar = document.createElement('div');
        bar.className = 'histogram-bar';
        
        const label = document.createElement('div');
        label.className = 'histogram-label';
        label.textContent = rank;
        
        const visual = document.createElement('div');
        visual.className = 'histogram-visual';
        visual.style.height = `${Math.max(20, percentage * 1.5)}px`;
        
        const countEl = document.createElement('div');
        countEl.className = 'histogram-count';
        countEl.textContent = count;
        
        visual.appendChild(countEl);
        bar.appendChild(label);
        bar.appendChild(visual);
        container.appendChild(bar);
    });
    
    // Show modal
    modal.classList.remove('hidden');
}

function hideHistogram() {
    const modal = document.getElementById('histogram-modal');
    modal.classList.add('hidden');
}

// Setup histogram event listeners
function setupHistogramListeners() {
    const deckPosition = document.getElementById('deck-position');
    const modal = document.getElementById('histogram-modal');
    const closeBtn = modal.querySelector('.close-btn');
    
    if (!deckPosition || !modal || !closeBtn) {
        console.error('Could not find histogram elements');
        return;
    }
    
    // Remove any existing listeners to prevent duplicates
    deckPosition.removeEventListener('click', showHistogram);
    closeBtn.removeEventListener('click', hideHistogram);
    
    // Show histogram when deck is clicked
    deckPosition.addEventListener('click', showHistogram);
    console.log('Histogram listeners set up successfully');
    
    // Hide histogram when close button is clicked
    closeBtn.addEventListener('click', hideHistogram);
    
    // Hide histogram when clicking outside modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideHistogram();
        }
    });
}

// Initialize game with welcome screen
document.addEventListener('DOMContentLoaded', () => {
    // Show welcome screen on page load
    showWelcomeScreen();
    
    // Initialize deck but don't update UI until game starts
    deck = buildDeck();
    shuffle(deck);
    
    // Setup histogram listeners
    setupHistogramListeners();
    
    // Hide histogram on Escape key (global listener)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !document.getElementById('histogram-modal').classList.contains('hidden')) {
            hideHistogram();
        }
    });
}); 