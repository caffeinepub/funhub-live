# FunHub Live

## Current State
App has coin system, daily rewards, spin wheel, VIP tiers, live chat, 5 games, leaderboard, and admin panel. Profile has username, phone, coins, VIP status, and admin status. No profile picture or bio fields exist. No image upload capability.

## Requested Changes (Diff)

### Add
- `bio` text field to user profile (max 150 chars)
- `avatarUrl` field to user profile storing blob-storage URL
- `updateProfile(bio: Text, avatarUrl: Text)` backend function
- Profile page/tab in the app showing avatar, username, bio, coins, VIP badge
- Profile picture upload UI using blob-storage camera/file picker
- Bio editing UI with character counter
- In chat, show sender's avatar image next to messages
- Image sharing in chat: users can send an image message (blob URL) in chat room

### Modify
- `Profile` type: add `bio: Text` and `avatarUrl: Text` fields
- `ProfileView` return type: include `bio` and `avatarUrl`
- `getProfile` returns bio and avatarUrl
- Registration flow: keep existing, bio/avatar set later in profile tab
- Chat messages: add optional `imageUrl` field for image messages
- `sendMessage` accept optional image URL for image sharing in chat

### Remove
- Nothing removed

## Implementation Plan
1. Update Motoko backend: add bio and avatarUrl to Profile type, add updateProfile function, update getProfile return, update chat Message type to support imageUrl
2. Use blob-storage for image uploads (profile pic + chat images)
3. Frontend: add Profile tab with avatar upload (using BlobStorage hooks), bio editing
4. Frontend: update chat UI to show avatars next to messages and support image messages in chat
5. Frontend: update Profile type interface to include bio and avatarUrl
