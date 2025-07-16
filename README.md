
# Blackjack Card Counting Trainer & Strategy App

A comprehensive web-based Blackjack simulator designed for learning card counting, practicing basic strategy, and optimal bankroll management. Features count tracking, Kelly betting recommendations, and visual basic strategy guidance.

## 🎯 Key Features

### 🃏 **Realistic Blackjack Gameplay**
- **Professional card animations**: Cards deal from a visual shoe with smooth animations
- **Custom card designs**: Beautiful David Blaine-inspired card backs with intricate patterns
- **Multiple deck support**: Configurable 1-8 deck shoe (default: 6 decks)
- **Standard blackjack rules**: Hit, Stand, Double Down, Split (when applicable)
- **Dealer follows standard rules**: Hits soft 17, reveals hole card
- **Automatic hand evaluation**: Blackjack pays 3:2, pushes handled correctly

### 📊 **Card Counting System (Hi-Lo)**
- **Running Count**: Real-time count of cards seen (+1 for 2-6, 0 for 7-9, -1 for 10-A)
- **True Count**: Automatically calculates running count ÷ decks remaining
- **Automatic deck tracking**: Estimates remaining cards and reshuffles when needed
- **Visual feedback**: Count displayed prominently during play

### 💰 **Kelly Criterion Betting Strategy**
See this [blog](https://blog.jonathanpchen.com/2019-07-04/kelly/) for more details.
- **Mathematical bet sizing**: Uses true count to calculate optimal bet sizes
- **Edge calculation**: Estimates player advantage based on true count (0.5% per count above +1)
- **Risk management**: Caps bets at 25% of bankroll for safety
- **Detailed breakdown**: Shows edge percentage, Kelly percentage, and actual bet percentage
- **Dynamic recommendations**: Updates in real-time as count changes

### ✅ **Basic Strategy Guidance**
- **Visual indicators**: Recommended actions highlighted in green with ✓ symbol
- **Mobile-friendly**: No hover required - recommendations always visible
- **Complete strategy coverage**: 
  - Hard hands (5-21)
  - Soft hands (A-2 through A-9)
  - Pair splitting (all pairs)
  - Doubling situations (hard and soft doubles)
- **Warning system**: Non-optimal plays marked with ⚠️ symbol in orange

### 📱 **Mobile-Responsive Design**
- **Touch-optimized**: Works perfectly on phones and tablets
- **Adaptive layout**: Automatically adjusts for different screen sizes
- **No hover dependencies**: All features work without mouse hover
- **Portrait-friendly**: Optimized for 9:16 mobile aspect ratios

## 🎮 How to Play

### **Basic Gameplay**
1. **Set your bankroll**: Use "Set Bank" to establish your starting funds
2. **Configure the shoe**: Choose 1-8 decks using the "Decks" setting
3. **Place your bet**: Enter amount or use the Kelly Criterion recommendation
4. **Deal cards**: Cards animate from the shoe to dealer and player
5. **Make decisions**: Follow green-highlighted basic strategy recommendations
6. **Track the count**: Monitor running and true count for betting guidance

### **Understanding the Interface**

#### **Count Display (Top Left)**
- **Running Count**: Raw count of cards seen
- **True Count**: Count adjusted for remaining decks
- *Higher positive counts favor the player*

#### **Action Buttons (Right Side)**
- **✅ Green with ✓**: Basic strategy recommends this action
- **⚠️ Orange with warning**: Not recommended by basic strategy
- **Gray**: Action not available (e.g., can't double after 3+ cards)

#### **Betting Recommendations (Bottom)**
- **Recommended Bet**: Kelly Criterion optimal bet size
- **Edge %**: Your statistical advantage based on count
- **Kelly %**: Percentage of bankroll Kelly suggests
- **Betting %**: Actual percentage you're wagering

## 🧠 Strategy Guide

### **Card Counting Basics (Hi-Lo System)**
- **Low cards (2-6)**: +1 each (favors dealer, count goes up)
- **Neutral cards (7-9)**: 0 each (no effect on count)
- **High cards (10-A)**: -1 each (favors player, count goes down)

**Why it works**: High cards benefit the player (more blackjacks, better doubling), low cards benefit the dealer (less busting on stiff hands).

### **True Count Conversion**
- **Formula**: Running Count ÷ Decks Remaining
- **Example**: Running count +6 with 3 decks left = True count +2
- **Betting guidance**: 
  - True count +1 or less: Minimum bet
  - True count +2: Small advantage, modest bet increase
  - True count +3 or higher: Significant advantage, larger bets

### **Kelly Criterion Betting**
The app calculates optimal bet sizes using the Kelly Criterion:
- **Edge calculation**: (True Count - 1) × 0.5%
- **Kelly percentage**: Edge ÷ Blackjack Variance (1.35)
- **Safety caps**: Never bet more than 25% of bankroll
- **Minimum bets**: Always bet at least 1% of bankroll

### **Basic Strategy Highlights**
- **Always split**: Aces and 8s
- **Never split**: 5s and 10s
- **Double on 11**: Against any dealer card except Ace
- **Double on 10**: Against dealer 2-9
- **Stand on 17+**: Always stand on hard 17 or higher
- **Hit 16 vs 7+**: Hit 16 against dealer 7, 8, 9, 10, A

## ⚙️ Technical Details

### **Game Rules**
- **Dealer hits soft 17**
- **Blackjack pays 3:2**
- **Double after split allowed**
- **Split up to 4 hands** (in pairs)
- **Insurance not implemented** (negative EV for counters)
- **Surrender not implemented** (advanced rule)

---

