# FunHub Live

## Current State
- App has: Spin Wheel (working), Daily Rewards, VIP Club, Live Chat
- Home tab shows 5 game cards (Slots, Card Games, Dice Roll, Tournaments, Precision Games) but they are purely decorative -- clicking them does nothing
- Backend has: registerUser, spinWheel, claimDailyReward, purchaseVIP, sendMessage, getMessages, getProfile

## Requested Changes (Diff)

### Add
- Slot Machine mini-game: 3-reel slots with 5 symbols, spin costs 10 coins, win multipliers, result animation
- Dice Roll game: player picks a number (1-6), roll the dice, win 5x if correct
- Card Flip game (Precision Games): flip cards to find matching pairs, earn coins per match
- Blackjack (Card Games): simple hit/stand blackjack vs dealer, bet coins
- Tournament leaderboard tab (Tournaments section): shows top coin earners
- Backend: `playSlots`, `playDice`, `playBlackjack` functions to record coin changes
- Each game navigates to a dedicated full-screen game view when clicked

### Modify
- Home tab game cards: make them clickable, navigate to respective game views
- Tab system: add game sub-views accessible from home cards

### Remove
- Nothing removed

## Implementation Plan
1. Add backend functions: `playSlots(bet, result)`, `playDice(bet, won)`, `playBlackjack(bet, won)` -- all just update coin balance
2. Frontend: create game components -- SlotMachine, DiceRoll, BlackjackGame, CardFlip
3. Add game routing state so clicking home cards opens full game view
4. Wire backend calls for coin deduction/addition in each game
5. Add back button to return to home from any game
