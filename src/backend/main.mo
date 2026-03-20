import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";

actor {
  type Profile = {
    username : Text;
    coins : Nat;
    isVIP : Bool;
    lastDailyReward : Int;
  };

  module Profile {
    public func compare(profile1 : Profile, profile2 : Profile) : Order.Order {
      Text.compare(profile1.username, profile2.username);
    };
  };

  type Message = {
    sender : Text;
    text : Text;
  };

  module Message {
    public func compare(message1 : Message, message2 : Message) : Order.Order {
      Text.compare(message1.sender, message2.sender);
    };
  };

  let profiles = Map.empty<Principal, Profile>();
  let messages = List.empty<Message>();
  // Default empty profile for unregistered users
  let defaultProfile : Profile = {
    username = "";
    coins = 0;
    isVIP = false;
    lastDailyReward = 0;
  };

  // Register or set username (handles both new users and auto-created profiles)
  public shared ({ caller }) func registerUser(username : Text) : async () {
    switch (profiles.get(caller)) {
      case (null) {
        // Brand new user
        let profile : Profile = {
          username;
          coins = 100;
          isVIP = false;
          lastDailyReward = 0;
        };
        profiles.add(caller, profile);
      };
      case (?profile) {
        if (profile.username != "") {
          Runtime.trap("User already registered");
        };
        // Auto-created profile (from spinning before registering) — just set username
        let updatedProfile : Profile = {
          profile with
          username;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func claimDailyReward(reward : Nat) : async () {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let now = Time.now();
        if (now - profile.lastDailyReward < 24 * 3600 * 1_000_000_000) {
          Runtime.trap("Daily reward already claimed");
        };

        let updatedProfile : Profile = {
          profile with
          coins = profile.coins + reward;
          lastDailyReward = now;
        };

        profiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func spinWheel(reward : Nat) : async () {
    switch (profiles.get(caller)) {
      case (null) {
        // Auto-create profile with empty username if not registered yet
        let newProfile : Profile = {
          username = "";
          coins = reward;
          isVIP = false;
          lastDailyReward = 0;
        };
        profiles.add(caller, newProfile);
      };
      case (?profile) {
        let updatedProfile : Profile = {
          profile with
          coins = profile.coins + reward;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func purchaseVIP() : async () {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        if (profile.isVIP) {
          Runtime.trap("Already a VIP member");
        };
        if (profile.coins < 1000) {
          Runtime.trap("Not enough coins for VIP");
        };

        let updatedProfile : Profile = {
          profile with
          coins = profile.coins - 1000;
          isVIP = true;
        };

        profiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func sendMessage(text : Text) : async () {
    let message : Message = {
      sender = caller.toText();
      text;
    };

    messages.add(message);

    while (messages.size() > 50) {
      let messagesArray = messages.toArray();
      messages.clear();
      if (messagesArray.size() > 1) {
        messages.addAll(messagesArray.sliceToArray(1, messagesArray.size()).values());
      };
    };
  };

  public query ({ caller }) func getMessages() : async [Message] {
    messages.values().toArray().sort();
  };

  // Returns default empty-username profile for new/unregistered users
  // Frontend checks username === "" to show registration modal
  public query ({ caller }) func getProfile() : async Profile {
    switch (profiles.get(caller)) {
      case (null) { defaultProfile };
      case (?profile) { profile };
    };
  };

  // New game functions
  public shared ({ caller }) func playSlots(bet : Nat, won : Nat) : async () {
    if (bet < 1) {
      Runtime.trap("Bet amount must be positive");
    };

    let profile = switch (profiles.get(caller)) {
      case (null) {
        // Create new empty profile if not found
        {
          username = "";
          coins = 0;
          isVIP = false;
          lastDailyReward = 0;
        };
      };
      case (?existing) { existing };
    };

    if (bet > profile.coins) {
      Runtime.trap("Not enough coins to play — please claim daily reward or become VIP for more coins");
    };

    let updatedProfile : Profile = {
      profile with
      coins = if (won > 0) { profile.coins - bet + won } else { profile.coins - bet };
    };

    profiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func playDice(bet : Nat, won : Bool) : async () {
    if (bet < 1) {
      Runtime.trap("Bet amount must be positive");
    };

    let profile = switch (profiles.get(caller)) {
      case (null) {
        // Create new empty profile if not found
        {
          username = "";
          coins = 0;
          isVIP = false;
          lastDailyReward = 0;
        };
      };
      case (?existing) { existing };
    };

    if (bet > profile.coins) {
      Runtime.trap("Not enough coins to play — please claim daily reward or become VIP for more coins");
    };

    let updatedProfile : Profile = {
      profile with
      coins = if (won) { profile.coins - bet + bet * 5 } else { profile.coins - bet };
    };

    profiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func playBlackjack(bet : Nat, won : Bool) : async () {
    if (bet < 1) {
      Runtime.trap("Bet amount must be positive");
    };

    let profile = switch (profiles.get(caller)) {
      case (null) {
        // Create new empty profile if not found
        {
          username = "";
          coins = 0;
          isVIP = false;
          lastDailyReward = 0;
        };
      };
      case (?existing) { existing };
    };

    if (bet > profile.coins) {
      Runtime.trap("Not enough coins to play — please claim daily reward or become VIP for more coins");
    };

    let updatedProfile : Profile = {
      profile with
      coins = if (won) { profile.coins - bet + bet * 2 } else { profile.coins - bet };
    };

    profiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func playCardFlip(reward : Nat) : async () {
    let profile = switch (profiles.get(caller)) {
      case (null) {
        {
          username = "";
          coins = reward;
          isVIP = false;
          lastDailyReward = 0;
        };
      };
      case (?existing) {
        {
          existing with
          coins = existing.coins + reward;
        };
      };
    };

    profiles.add(caller, profile);
  };
};
