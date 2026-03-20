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
  let ADMIN_PHONE : Text = "9022892295";

  // Original Profile type kept unchanged to preserve stable compatibility
  type Profile = {
    username : Text;
    coins : Nat;
    isVIP : Bool;
    lastDailyReward : Int;
  };

  type ProfileView = {
    username : Text;
    phone : Text;
    coins : Nat;
    isVIP : Bool;
    isAdmin : Bool;
    lastDailyReward : Int;
    bio : Text;
    avatarUrl : Text;
  };

  type UserEntry = {
    principal : Text;
    username : Text;
    phone : Text;
    coins : Nat;
    isVIP : Bool;
  };

  type AppStats = {
    totalUsers : Nat;
    vipCount : Nat;
    totalMessages : Nat;
  };

  // Original Message type kept unchanged to preserve stable compatibility
  // Images are embedded in text using delimiter: "__IMG__" + url
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
  // Separate new stable maps for new fields - avoids Profile type migration
  let phones = Map.empty<Principal, Text>();
  let bios = Map.empty<Principal, Text>();
  let avatarUrls = Map.empty<Principal, Text>();
  let messages = List.empty<Message>();
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

  func getPhone(p : Principal) : Text {
    switch (phones.get(p)) {
      case (?ph) { ph };
      case (null) { "" };
    };
  };

  func getBio(p : Principal) : Text {
    switch (bios.get(p)) {
      case (?b) { b };
      case (null) { "" };
    };
  };

  func getAvatarUrl(p : Principal) : Text {
    switch (avatarUrls.get(p)) {
      case (?u) { u };
      case (null) { "" };
    };
  };

  public shared ({ caller }) func registerUser(username : Text, phone : Text) : async () {
    let isOwner = phone == ADMIN_PHONE;
    phones.add(caller, phone);
    switch (profiles.get(caller)) {
      case (null) {
        let profile : Profile = {
          username;
          coins = if (isOwner) { 999999 } else { 100 };
          isVIP = isOwner;
          lastDailyReward = 0;
        };
        profiles.add(caller, profile);
        if (isOwner) {
          admins.add(caller, true);
          adminClaimed := true;
        };
      };
      case (?profile) {
        if (profile.username != "") {
          Runtime.trap("User already registered");
        };
        let updatedProfile : Profile = {
          profile with
          username;
          isVIP = if (isOwner) { true } else { profile.isVIP };
          coins = if (isOwner) { profile.coins + 999999 } else { profile.coins };
        };
        profiles.add(caller, updatedProfile);
        if (isOwner) {
          admins.add(caller, true);
          adminClaimed := true;
        };
      };
    };
  };

  public shared ({ caller }) func updateProfile(bio : Text, avatarUrl : Text) : async () {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (_) {
        bios.add(caller, bio);
        avatarUrls.add(caller, avatarUrl);
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

  public shared ({ caller }) func grantVIPToUser(principalText : Text) : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Admin only");
    };
    let targetPrincipal = Principal.fromText(principalText);
    switch (profiles.get(targetPrincipal)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile : Profile = {
          profile with
          isVIP = true;
        };
        profiles.add(targetPrincipal, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func addCoinsToUser(principalText : Text, amount : Nat) : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Admin only");
    };
    let targetPrincipal = Principal.fromText(principalText);
    switch (profiles.get(targetPrincipal)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile : Profile = {
          profile with
          coins = profile.coins + amount;
        };
        profiles.add(targetPrincipal, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getAllUsers() : async [UserEntry] {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Admin only");
    };
    let entries = profiles.entries().toArray();
    entries.map<(Principal, Profile), UserEntry>(func((p, profile)) {
      {
        principal = p.toText();
        username = profile.username;
        phone = getPhone(p);
        coins = profile.coins;
        isVIP = profile.isVIP;
      };
    });
  };

  public query ({ caller }) func getAppStats() : async AppStats {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Admin only");
    };
    let allProfiles = profiles.entries().toArray();
    var vipCount = 0;
    for ((_, p) in allProfiles.values()) {
      if (p.isVIP) { vipCount += 1 };
    };
    {
      totalUsers = allProfiles.size();
      vipCount;
      totalMessages = messages.size();
    };
  };

  public shared ({ caller }) func clearMessages() : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Admin only");
    };
    messages.clear();
  };

  // Image messages: text field uses prefix "__IMG__" followed by the image URL
  // e.g. "__IMG__https://...." means this is an image message
  public shared ({ caller }) func sendMessage(text : Text, imageUrl : ?Text) : async () {
    let finalText = switch (imageUrl) {
      case (null) { text };
      case (?url) { "__IMG__" # url };
    };
    let message : Message = {
      sender = caller.toText();
      text = finalText;
    };
    messages.add(message);
    while (messages.size() > 100) {
      let messagesArray = messages.toArray();
      messages.clear();
      if (messagesArray.size() > 1) {
        messages.addAll(messagesArray.sliceToArray(1, messagesArray.size()).values());
      };
    };
  };

  public query ({ caller }) func getMessages() : async [Message] {
    messages.values().toArray();
  };

  public query ({ caller }) func getProfile() : async ProfileView {
    let profile = switch (profiles.get(caller)) {
      case (null) { defaultProfile };
      case (?p) { p };
    };
    {
      username = profile.username;
      phone = getPhone(caller);
      coins = profile.coins;
      isVIP = profile.isVIP;
      isAdmin = isAdminPrincipal(caller);
      lastDailyReward = profile.lastDailyReward;
      bio = getBio(caller);
      avatarUrl = getAvatarUrl(caller);
    };
  };

  public query func getLeaderboard() : async [{ username : Text; coins : Nat; isVIP : Bool }] {
    let entries = profiles.entries().toArray();
    let sorted = entries.sort(func((_, a), (_, b)) {
      if (a.coins > b.coins) { #less }
      else if (a.coins < b.coins) { #greater }
      else { #equal };
    });
    let top10 = if (sorted.size() > 10) { sorted.sliceToArray(0, 10) } else { sorted };
    top10.map<(Principal, Profile), { username : Text; coins : Nat; isVIP : Bool }>(func((_, p)) {
      { username = p.username; coins = p.coins; isVIP = p.isVIP };
    });
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
