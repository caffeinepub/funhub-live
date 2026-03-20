# FunHub Live

## Current State
- Backend has UserProfile with isVIP bool, no isAdmin field
- purchaseVIP() deducts 1000 coins - causing failures when user has < 1000 coins
- No admin system exists
- Frontend has QR payment modal but still calls purchaseVIP() which requires 1000 coins

## Requested Changes (Diff)

### Add
- `isAdmin: Bool` field to Profile
- `claimAdmin()` backend function - first caller becomes admin (one-time setup)
- `grantVIP()` backend function - admin can grant VIP to themselves (no coin cost)
- `addCoins(amount: Nat)` backend function - admin can add coins to own account
- Admin Panel tab in frontend (only visible to admin users)
- Admin panel shows: current profile info, buttons to Grant VIP, Add Coins (with amount input)
- After QR payment, VIP activates without coin deduction (free activation path)

### Modify
- `purchaseVIP()` - make it work without coin deduction (QR payment path, just sets isVIP=true)
- Profile type to include isAdmin field

### Remove
- Nothing removed

## Implementation Plan
1. Update Motoko backend: add isAdmin to Profile, add claimAdmin(), grantVIP(), addCoins() functions
2. Update frontend: add Admin tab (visible only if isAdmin), admin panel with grant VIP + add coins buttons
3. Fix VIP activation: remove coin deduction from purchaseVIP so QR payment path works
