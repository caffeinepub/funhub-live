import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
// Messages use plain text; image messages have text starting with "__IMG__" prefix
export interface Message {
    text: string;
    sender: string;
}
export interface ProfileView {
    username: string;
    phone: string;
    coins: bigint;
    isVIP: boolean;
    isAdmin: boolean;
    lastDailyReward: bigint;
    bio: string;
    avatarUrl: string;
}
export interface UserEntry {
    principal: string;
    username: string;
    phone: string;
    coins: bigint;
    isVIP: boolean;
}
export interface AppStats {
    totalUsers: bigint;
    vipCount: bigint;
    totalMessages: bigint;
}
export interface LeaderboardEntry {
    username: string;
    coins: bigint;
    isVIP: boolean;
}
export interface backendInterface {
    registerUser(username: string, phone: string): Promise<void>;
    updateProfile(bio: string, avatarUrl: string): Promise<void>;
    claimDailyReward(reward: bigint): Promise<void>;
    spinWheel(reward: bigint): Promise<void>;
    purchaseVIP(): Promise<void>;
    claimAdmin(): Promise<void>;
    addCoins(amount: bigint): Promise<void>;
    grantVIP(): Promise<void>;
    grantVIPToUser(principalText: string): Promise<void>;
    addCoinsToUser(principalText: string, amount: bigint): Promise<void>;
    getAllUsers(): Promise<Array<UserEntry>>;
    getAppStats(): Promise<AppStats>;
    clearMessages(): Promise<void>;
    sendMessage(text: string, imageUrl: string | null): Promise<void>;
    getMessages(): Promise<Array<Message>>;
    getProfile(): Promise<ProfileView>;
    getLeaderboard(): Promise<Array<LeaderboardEntry>>;
    playSlots(bet: bigint, won: bigint): Promise<void>;
    playDice(bet: bigint, won: boolean): Promise<void>;
    playBlackjack(bet: bigint, won: boolean): Promise<void>;
    playCardFlip(reward: bigint): Promise<void>;
}
