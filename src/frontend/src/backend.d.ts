import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    text: string;
    sender: string;
}
export interface Profile {
    username: string;
    coins: bigint;
    lastDailyReward: bigint;
    isVIP: boolean;
}
export interface backendInterface {
    claimDailyReward(reward: bigint): Promise<void>;
    getMessages(): Promise<Array<Message>>;
    getProfile(): Promise<Profile>;
    playBlackjack(bet: bigint, won: boolean): Promise<void>;
    playCardFlip(reward: bigint): Promise<void>;
    playDice(bet: bigint, won: boolean): Promise<void>;
    playSlots(bet: bigint, won: bigint): Promise<void>;
    purchaseVIP(): Promise<void>;
    registerUser(username: string): Promise<void>;
    sendMessage(text: string): Promise<void>;
    spinWheel(reward: bigint): Promise<void>;
}
