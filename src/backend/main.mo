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
  // Keep original Profile type unchanged for stable compatibility
  type Profile = {
    username : Text;
    coins : Nat;
    isVIP : Bool;
    lastDailyReward : Int;
  };

  // Extended profile returned to frontend (includes isAdmin)
  type ProfileView = {
    username : Text;
    coins : Nat;
    isVIP : Bool;
    isAdmin : Bool;
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
  // Separate stable map for admin status - avoids Profile type migration
  let admins = Map.empty<Principal, Bool>();
  var adminClaimed : Bool = false;

  let defaultProfile : Profile = {
    username = "";
    coins = 0;
    isVIP = false;
    lastDailyReward = 0;
  };

  func isAdminPrincipal(p : Principal) : Bool {
    switch (admins.get(p)) {
      case (?true) { true };
      case (_) { false };
    };
  };

  public shared ({ caller }) func registerUser(username : Text) : async () {
    switch (profiles.get(caller)) {
      case (null) {
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

  // VIP purchase - no coin deduction (QR payment done externally)
  public shared ({ caller }) func purchaseVIP() : async () {
    switch (profiles.get(caller)) {
      case (null) {
        let newProfile : Profile = {
          username = "";
          coins = 0;
          isVIP = true;
          lastDailyReward = 0;
        };
        profiles.add(caller, newProfile);
      };
      case (?profile) {
        let updatedProfile : Profile = {
          profile with
          isVIP = true;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  // First caller becomes admin (one-time setup)
  public shared ({ caller }) func claimAdmin() : async () {
    if (adminClaimed) {
      Runtime.trap("Admin already claimed");
    };
    adminClaimed := true;
    admins.add(caller, true);
    switch (profiles.get(caller)) {
      case (null) {
        let newProfile : Profile = {
          username = "";
          coins = 999999;
          isVIP = true;
          lastDailyReward = 0;
        };
        profiles.add(caller, newProfile);
      };
      case (?profile) {
        let updatedProfile : Profile = {
          profile with
          isVIP = true;
          coins = profile.coins + 999999;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  // Admin only: add coins to own account
  public shared ({ caller }) func addCoins(amount : Nat) : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Admin only");
    };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile : Profile = {
          profile with
          coins = profile.coins + amount;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  // Admin only: grant VIP to self
  public shared ({ caller }) func grantVIP() : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Admin only");
    };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile : Profile = {
          profile with
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

  // Returns ProfileView which includes computed isAdmin field
  public query ({ caller }) func getProfile() : async ProfileView {
    let profile = switch (profiles.get(caller)) {
      case (null) { defaultProfile };
      case (?p) { p };
    };
    {
      username = profile.username;
      coins = profile.coins;
      isVIP = profile.isVIP;
      isAdmin = isAdminPrincipal(caller);
      lastDailyReward = profile.lastDailyReward;
    };
  };

  public shared ({ caller }) func playSlots(bet : Nat, won : Nat) : async () {
    if (bet < 1) { Runtime.trap("Bet amount must be positive") };
    let profile = switch (profiles.get(caller)) {
      case (null) {{ username = ""; coins = 0; isVIP = false; lastDailyReward = 0 }};
      case (?existing) { existing };
    };
    if (bet > profile.coins) {
      Runtime.trap("Not enough coins");
    };
    let updatedProfile : Profile = {
      profile with
      coins = if (won > 0) { profile.coins - bet + won } else { profile.coins - bet };
    };
    profiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func playDice(bet : Nat, won : Bool) : async () {
    if (bet < 1) { Runtime.trap("Bet amount must be positive") };
    let profile = switch (profiles.get(caller)) {
      case (null) {{ username = ""; coins = 0; isVIP = false; lastDailyReward = 0 }};
      case (?existing) { existing };
    };
    if (bet > profile.coins) {
      Runtime.trap("Not enough coins");
    };
    let updatedProfile : Profile = {
      profile with
      coins = if (won) { profile.coins - bet + bet * 5 } else { profile.coins - bet };
    };
    profiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func playBlackjack(bet : Nat, won : Bool) : async () {
    if (bet < 1) { Runtime.trap("Bet amount must be positive") };
    let profile = switch (profiles.get(caller)) {
      case (null) {{ username = ""; coins = 0; isVIP = false; lastDailyReward = 0 }};
      case (?existing) { existing };
    };
    if (bet > profile.coins) {
      Runtime.trap("Not enough coins");
    };
    let updatedProfile : Profile = {
      profile with
      coins = if (won) { profile.coins - bet + bet * 2 } else { profile.coins - bet };
    };
    profiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func playCardFlip(reward : Nat) : async () {
    let profile = switch (profiles.get(caller)) {
      case (null) {{
        username = "";
        coins = reward;
        isVIP = false;
        lastDailyReward = 0;
      }};
      case (?existing) {{
        existing with
        coins = existing.coins + reward;
      }};
    };
    profiles.add(caller, profile);
  };
};
