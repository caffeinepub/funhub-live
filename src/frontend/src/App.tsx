import Blackjack from "@/components/games/Blackjack";
import CardFlip from "@/components/games/CardFlip";
import DiceRoll from "@/components/games/DiceRoll";
import SlotMachine from "@/components/games/SlotMachine";
import Tournament from "@/components/games/Tournament";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { useBlobStorage } from "@/hooks/useBlobStorage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Clock,
  Coins,
  Crown,
  Gamepad2,
  Gift,
  ImageIcon,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Shield,
  Star,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppProfile {
  username: string;
  phone: string;
  coins: bigint;
  isVIP: boolean;
  isAdmin: boolean;
  lastDailyReward: bigint;
  bio: string;
  avatarUrl: string;
}

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEGMENTS = [
  { label: "50", value: 50, bg: "#22c55e" },
  { label: "100", value: 100, bg: "#3b82f6" },
  { label: "25", value: 25, bg: "#f59e0b" },
  { label: "500", value: 500, bg: "#ef4444" },
  { label: "75", value: 75, bg: "#8b5cf6" },
  { label: "200", value: 200, bg: "#ec4899" },
  { label: "150", value: 150, bg: "#06b6d4" },
  { label: "10", value: 10, bg: "#84cc16" },
] as const;

const VIP_TIERS = [
  {
    name: "Bronze",
    emoji: "🥉",
    color: "#cd7f32",
    req: "New Members",
    perk: "+10% bonus coins",
  },
  {
    name: "Silver",
    emoji: "🥈",
    color: "#c0c0c0",
    req: "100K coins",
    perk: "+25% bonus coins",
  },
  {
    name: "Gold",
    emoji: "🥇",
    color: "#ffd700",
    req: "500K coins",
    perk: "+50% bonus coins",
  },
  {
    name: "Platinum",
    emoji: "💎",
    color: "#e5e4e2",
    req: "1M+ coins",
    perk: "2× all rewards",
  },
] as const;

const SEED_MESSAGES: ChatMessage[] = [
  {
    sender: "FunHub Bot",
    text: "🎉 Welcome to FunHub Live! Spin the wheel and share your wins!",
    time: "Just now",
  },
  {
    sender: "Lucky_Alex77",
    text: "Just hit 500 coins on the wheel! LFG! 🔥🔥",
    time: "2m ago",
  },
  {
    sender: "CoinMaster_99",
    text: "Daily bonus stacking up nicely today 💰",
    time: "4m ago",
  },
  {
    sender: "SpinQueen",
    text: "Anyone else keep landing on 10? 😂",
    time: "5m ago",
  },
  {
    sender: "VIPKing2024",
    text: "VIP membership is worth every coin, trust me 👑",
    time: "7m ago",
  },
];

// ---------------------------------------------------------------------------
// Helper: build SVG pie path
// ---------------------------------------------------------------------------

function segmentPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

// ---------------------------------------------------------------------------
// SpinWheel component
// ---------------------------------------------------------------------------

interface SpinWheelProps {
  onSpinComplete: (value: number) => void;
  disabled?: boolean;
}

function SpinWheel({ onSpinComplete, disabled }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const N = SEGMENTS.length;
  const SEG_DEG = 360 / N; // 45
  const CX = 150;
  const CY = 150;
  const R = 128;
  const INNER = 28;

  const handleSpin = useCallback(() => {
    if (isSpinning || disabled) return;

    const idx = Math.floor(Math.random() * N);
    // Rotate so the pointer (top = -90°) lands on the center of segment idx.
    // Segment idx centre in wheel coords = idx * SEG_DEG + SEG_DEG/2 (measured from east, 0°).
    // Since SVG starts at -90° (top), offset is already built in via startDeg = i*SEG_DEG - 90.
    // We need: (rotation + segCentre) mod 360 = 0  (centre lands at top pointer).
    // segCentre (wheel-local, east=0) = idx * SEG_DEG + SEG_DEG / 2
    // So extra rotation needed = 360 - segCentre (mod 360)
    const segCentre = idx * SEG_DEG + SEG_DEG / 2;
    const extra = (((360 - segCentre) % 360) + 360) % 360;
    const base = Math.ceil(rotation / 360) * 360;
    const next = base + 5 * 360 + extra;

    setIsSpinning(true);
    setRotation(next);

    setTimeout(() => {
      setIsSpinning(false);
      onSpinComplete(SEGMENTS[idx].value);
    }, 3800);
  }, [isSpinning, disabled, rotation, N, SEG_DEG, onSpinComplete]);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Pointer */}
      <div className="relative">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
          style={{ marginTop: "-10px" }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "11px solid transparent",
              borderRight: "11px solid transparent",
              borderTop: "22px solid white",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
            }}
          />
        </div>

        {/* Wheel SVG */}
        <svg
          role="img"
          aria-label="Spin wheel with prize segments"
          width={300}
          height={300}
          viewBox="0 0 300 300"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? "transform 3.8s cubic-bezier(0.17,0.67,0.08,0.99)"
              : "none",
          }}
        >
          {/* Outer glow ring */}
          <circle
            cx={CX}
            cy={CY}
            r={R + 10}
            fill="none"
            stroke="rgba(34,197,94,0.35)"
            strokeWidth="3"
          />
          <circle
            cx={CX}
            cy={CY}
            r={R + 6}
            fill="none"
            stroke="rgba(34,197,94,0.15)"
            strokeWidth="6"
          />

          {/* Segments */}
          {SEGMENTS.map((seg, i) => {
            const start = i * SEG_DEG - 90;
            const end = (i + 1) * SEG_DEG - 90;
            const midRad = ((start + end) / 2) * (Math.PI / 180);
            const lx = CX + R * 0.62 * Math.cos(midRad);
            const ly = CY + R * 0.62 * Math.sin(midRad);
            return (
              <g key={seg.label}>
                <path
                  d={segmentPath(CX, CY, R, start, end)}
                  fill={seg.bg}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                {/* Subtle white highlight */}
                <path
                  d={segmentPath(CX, CY, R, start, end)}
                  fill="white"
                  opacity="0.06"
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight="800"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                >
                  {seg.label}
                </text>
              </g>
            );
          })}

          {/* Spoke lines */}
          {SEGMENTS.map((_, i) => {
            const a = (i * SEG_DEG - 90) * (Math.PI / 180);
            return (
              <line
                key={i * SEG_DEG}
                x1={CX + INNER * Math.cos(a)}
                y1={CY + INNER * Math.sin(a)}
                x2={CX + R * Math.cos(a)}
                y2={CY + R * Math.sin(a)}
                stroke="#0f172a"
                strokeWidth="2"
              />
            );
          })}

          {/* Centre hub */}
          <circle cx={CX} cy={CY} r={INNER + 2} fill="#0f172a" />
          <circle
            cx={CX}
            cy={CY}
            r={INNER}
            fill="#1e293b"
            stroke="#22c55e"
            strokeWidth="2.5"
          />
          <circle cx={CX} cy={CY} r={10} fill="#22c55e" />
        </svg>

        {/* Spinning glow overlay */}
        {isSpinning && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none animate-pulse-glow"
            style={{
              background:
                "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)",
            }}
          />
        )}
      </div>

      <Button
        onClick={handleSpin}
        disabled={isSpinning || disabled}
        className="w-full max-w-[280px] py-6 text-base rounded-xl"
        style={{
          background: isSpinning
            ? "rgba(34,197,94,0.4)"
            : "linear-gradient(135deg, #22c55e, #16a34a)",
          boxShadow: isSpinning ? "none" : "0 0 24px rgba(34,197,94,0.45)",
          color: "#0f172a",
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          border: "none",
        }}
        data-ocid="spin.primary_button"
      >
        {isSpinning ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> SPINNING...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-5 w-5" /> SPIN THE WHEEL!
          </>
        )}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatRoom component
// ---------------------------------------------------------------------------

interface ChatRoomProps {
  actor: ReturnType<typeof useActor>["actor"];
  username: string;
  userAvatarUrl?: string;
}

function ChatRoom({ actor, username, userAvatarUrl }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, getUrl } = useBlobStorage();

  // Poll backend every 3 s
  useEffect(() => {
    if (!actor) return;
    const poll = async () => {
      try {
        const raw = await actor.getMessages();
        if (!raw.length) return;
        const now = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setMessages((prev) => {
          const existingKeys = new Set(
            prev.map((m) => `${m.sender}||${m.text}`),
          );
          const fresh = (raw as any[])
            .filter(
              (m: { sender: string; text: string }) =>
                !existingKeys.has(`${m.sender}||${m.text}`),
            )
            .map((m: { sender: string; text: string }) => ({
              sender: m.sender,
              text: m.text,
              time: now,
            }));
          return fresh.length ? [...prev, ...fresh] : prev;
        });
      } catch {
        // silent
      }
    };
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [actor]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (imageUrl?: string) => {
    const isImg = !!imageUrl;
    const text = isImg ? input.trim() || "📷 Image" : input.trim();
    if (!text || !actor || sending) return;
    setInput("");
    setSending(true);
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    // Optimistic: store __IMG__ prefix for image messages
    const storedText = isImg ? `__IMG__${imageUrl}` : text;
    setMessages((prev) => [
      ...prev,
      { sender: username || "You", text: storedText, time: now },
    ]);
    try {
      if (isImg) {
        await (actor as any).sendMessage("", imageUrl);
      } else {
        await (actor as any).sendMessage(text, null);
      }
    } catch {
      toast.error("Message failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !actor) return;
    setUploadingImg(true);
    try {
      const blobId = await uploadFile(file);
      const url = getUrl(blobId);
      await handleSend(url);
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploadingImg(false);
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none"
        style={{ minHeight: 0, maxHeight: 360 }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const hue = (msg.sender.charCodeAt(0) * 53) % 360;
            const isCurrentUser = msg.sender === username;
            return (
              <motion.div
                key={`${msg.sender}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2.5"
                data-ocid={`chat.item.${i + 1}`}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  {isCurrentUser && userAvatarUrl ? (
                    <AvatarImage src={userAvatarUrl} alt={msg.sender} />
                  ) : null}
                  <AvatarFallback
                    className="text-xs font-bold"
                    style={{
                      background: `hsl(${hue} 55% 35%)`,
                      color: `hsl(${hue} 80% 75%)`,
                    }}
                  >
                    {msg.sender[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-xs font-bold"
                      style={{ color: `hsl(${hue} 70% 65%)` }}
                    >
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {msg.time}
                    </span>
                  </div>
                  {msg.text.startsWith("__IMG__") ? (
                    <img
                      src={msg.text.slice(7)}
                      alt="shared"
                      className="mt-1.5 rounded-lg object-cover"
                      style={{ maxWidth: 200, maxHeight: 200 }}
                    />
                  ) : (
                    <p className="text-sm text-foreground/85 break-words leading-snug">
                      {msg.text}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
        <input
          ref={imgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          data-ocid="chat.upload_button"
        />
        <button
          type="button"
          onClick={() => imgInputRef.current?.click()}
          disabled={uploadingImg || !actor}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.25)",
            color: "#22c55e",
          }}
          data-ocid="chat.dropzone"
        >
          {uploadingImg ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-background/60 border-border/50 text-sm"
          data-ocid="chat.input"
        />
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || sending || !actor}
          size="icon"
          className="shrink-0"
          style={{
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            border: "none",
          }}
          data-ocid="chat.submit_button"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 text-[#0f172a]" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function canClaimDaily(profile: AppProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.lastDailyReward === 0n) return true;
  const nowNs = BigInt(Date.now()) * 1_000_000n;
  const dayNs = 86_400_000_000_000n;
  return nowNs - profile.lastDailyReward > dayNs;
}

function fmtCoins(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

type Tab = "home" | "spins" | "rewards" | "vip" | "chat" | "admin" | "profile";
type GameType =
  | "slots"
  | "blackjack"
  | "dice"
  | "tournament"
  | "cardflip"
  | null;

const NAV_TABS: {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}[] = [
  { id: "home", label: "HOME", icon: <Gamepad2 className="h-3.5 w-3.5" /> },
  { id: "spins", label: "DAILY SPINS", icon: <Zap className="h-3.5 w-3.5" /> },
  { id: "rewards", label: "REWARDS", icon: <Gift className="h-3.5 w-3.5" /> },
  { id: "vip", label: "VIP CLUB", icon: <Crown className="h-3.5 w-3.5" /> },
  {
    id: "chat",
    label: "LIVE CHAT",
    icon: <MessageCircle className="h-3.5 w-3.5" />,
  },
  {
    id: "admin",
    label: "ADMIN",
    icon: <Shield className="h-3.5 w-3.5" />,
    adminOnly: true,
  },
  {
    id: "profile",
    label: "PROFILE",
    icon: <User className="h-3.5 w-3.5" />,
  },
];

export default function App() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const { uploadFile, getUrl } = useBlobStorage();

  const [tab, setTab] = useState<Tab>("home");
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [registering, setRegistering] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [purchasingVip, setPurchasingVip] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [claimingAdmin, setClaimingAdmin] = useState(false);
  const [grantingVip, setGrantingVip] = useState(false);
  const [addingCoins, setAddingCoins] = useState(false);
  const [adminCoinsAmount, setAdminCoinsAmount] = useState("100000");
  const [appStats, setAppStats] = useState<{
    totalUsers: number;
    vipCount: number;
    totalMessages: number;
  } | null>(null);
  const [allUsers, setAllUsers] = useState<
    Array<{
      principal: string;
      username: string;
      coins: number;
      isVIP: boolean;
      phone: string;
    }>
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userCoinsMap, setUserCoinsMap] = useState<Record<string, string>>({});
  const [grantingVIPToUser, setGrantingVIPToUser] = useState<string | null>(
    null,
  );
  const [addingCoinsToUser, setAddingCoinsToUser] = useState<string | null>(
    null,
  );
  const [clearingChat, setClearingChat] = useState(false);
  const [spinDisabled, setSpinDisabled] = useState(false);
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [profileBio, setProfileBio] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const profileImgRef = useRef<HTMLInputElement>(null);

  // Countdown timer state
  const [countdown, setCountdown] = useState({ h: 4, m: 31, s: 15 });
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        const total = c.h * 3600 + c.m * 60 + c.s;
        if (total <= 0) return { h: 0, m: 0, s: 0 };
        const t = total - 1;
        return {
          h: Math.floor(t / 3600),
          m: Math.floor((t % 3600) / 60),
          s: t % 60,
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const countdownStr = `${String(countdown.h).padStart(2, "0")}:${String(countdown.m).padStart(2, "0")}:${String(countdown.s).padStart(2, "0")}`;

  // ---------- Profile query ----------
  const { data: profile, isLoading: profileLoading } = useQuery<
    AppProfile | undefined
  >({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return undefined;
      return actor.getProfile() as unknown as AppProfile;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });

  // Trigger registration modal when username is empty
  useEffect(() => {
    if (profile && !profile.username) setShowRegister(true);
  }, [profile]);

  // ---------- Derived ----------
  const isLoading = profileLoading || isFetching;
  const username = profile?.username || "Player";
  const coins = profile ? Number(profile.coins) : 0;
  const isVip = profile?.isVIP ?? false;
  const isAdmin = profile?.isAdmin ?? false;
  const canClaim = canClaimDaily(profile);

  // Sync local bio/avatar from profile when loaded
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional sync on profile load
  useEffect(() => {
    if (profile) {
      setProfileBio(profile.bio || "");
      setProfileAvatarUrl(profile.avatarUrl || "");
    }
  }, [profile?.bio, profile?.avatarUrl]);

  // ---------- Handlers ----------
  const handleRegister = async () => {
    if (!actor || !regName.trim()) return;
    setRegistering(true);
    try {
      await (actor as any).registerUser(regName.trim(), regPhone.trim());
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setShowRegister(false);
      if (regPhone.trim() === "9022892295") {
        toast.success("Welcome Admin! 👑 You have been granted admin access!");
      } else {
        toast.success(
          `Welcome, ${regName.trim()}! 🎉 You start with 100 coins!`,
        );
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const handleSpinComplete = async (value: number) => {
    if (!actor) return;
    setSpinDisabled(true);
    try {
      await actor.spinWheel(BigInt(value));
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSpinResult(value);
      setShowSpinModal(true);
    } catch {
      toast.error("Spin failed to record. Please try again.");
    } finally {
      setSpinDisabled(false);
    }
  };

  const handleClaimDaily = async () => {
    if (!actor || !canClaim || claimingDaily) return;
    const reward = BigInt(Math.floor(Math.random() * 51) + 10);
    setClaimingDaily(true);
    try {
      await actor.claimDailyReward(reward);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`🎁 +${reward} coins! Daily bonus claimed!`, {
        description: "See you again tomorrow for another bonus!",
        duration: 5000,
      });
    } catch {
      toast.error("Could not claim daily reward. Try again.");
    } finally {
      setClaimingDaily(false);
    }
  };

  const handlePurchaseVip = async () => {
    if (!actor || isVip || purchasingVip) return;
    setShowPaymentQR(true);
  };

  const handleConfirmPayment = async () => {
    if (!actor || purchasingVip) return;
    setShowPaymentQR(false);
    setPurchasingVip(true);
    try {
      await actor.purchaseVIP();
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("👑 Welcome to the VIP Club!", {
        description: "You now enjoy exclusive rewards and bonus multipliers.",
        duration: 6000,
      });
    } catch {
      toast.error("VIP purchase failed. Please try again.");
    } finally {
      setPurchasingVip(false);
    }
  };

  const handleClaimAdmin = async () => {
    if (!actor || claimingAdmin) return;
    setClaimingAdmin(true);
    try {
      await (actor as any).claimAdmin();
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("👑 Admin access granted!", {
        description: "You are now the admin of FunHub Live.",
      });
    } catch {
      toast.error("Admin claim failed. Another admin may already exist.");
    } finally {
      setClaimingAdmin(false);
    }
  };

  const handleGrantVip = async () => {
    if (!actor || grantingVip || isVip) return;
    setGrantingVip(true);
    try {
      await (actor as any).grantVIP();
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("👑 VIP Activated!", {
        description: "You now have VIP status!",
      });
    } catch {
      toast.error("VIP grant failed. Please try again.");
    } finally {
      setGrantingVip(false);
    }
  };

  const handleAddCoins = async () => {
    if (!actor || addingCoins) return;
    const amount = Number.parseInt(adminCoinsAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid coin amount.");
      return;
    }
    setAddingCoins(true);
    try {
      await (actor as any).addCoins(BigInt(amount));
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`✅ Added ${amount.toLocaleString()} coins!`);
    } catch {
      toast.error("Add coins failed. Please try again.");
    } finally {
      setAddingCoins(false);
    }
  };

  const handleLoadAdminData = async () => {
    if (!actor || !isAdmin) return;
    setLoadingUsers(true);
    try {
      const [stats, users] = await Promise.all([
        (actor as any).getAppStats(),
        (actor as any).getAllUsers(),
      ]);
      setAppStats({
        totalUsers: Number(stats.totalUsers),
        vipCount: Number(stats.vipCount),
        totalMessages: Number(stats.totalMessages),
      });
      setAllUsers(
        users.map((u: any) => ({
          principal: u.principal,
          username: u.username || "(no name)",
          coins: Number(u.coins),
          isVIP: u.isVIP,
        })),
      );
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleGrantVIPToUser = async (principal: string) => {
    if (!actor) return;
    setGrantingVIPToUser(principal);
    try {
      await (actor as any).grantVIPToUser(principal);
      toast.success("VIP granted!");
      handleLoadAdminData();
    } catch {
      toast.error("Failed to grant VIP");
    } finally {
      setGrantingVIPToUser(null);
    }
  };

  const handleAddCoinsToUser = async (principal: string) => {
    if (!actor) return;
    const amount = Number.parseInt(userCoinsMap[principal] || "1000", 10);
    if (Number.isNaN(amount) || amount <= 0) return;
    setAddingCoinsToUser(principal);
    try {
      await (actor as any).addCoinsToUser(principal, BigInt(amount));
      toast.success(`${amount} coins added!`);
      handleLoadAdminData();
    } catch {
      toast.error("Failed to add coins");
    } finally {
      setAddingCoinsToUser(null);
    }
  };

  const handleClearChat = async () => {
    if (!actor) return;
    setClearingChat(true);
    try {
      await (actor as any).clearMessages();
      toast.success("Chat cleared!");
      if (appStats) setAppStats({ ...appStats, totalMessages: 0 });
    } catch {
      toast.error("Failed to clear chat");
    } finally {
      setClearingChat(false);
    }
  };

  // Load admin data on mount when admin
  useEffect(() => {
    if (!isAdmin || !actor) return;
    setLoadingUsers(true);
    Promise.all([(actor as any).getAppStats(), (actor as any).getAllUsers()])
      .then(([stats, users]) => {
        setAppStats({
          totalUsers: Number(stats.totalUsers),
          vipCount: Number(stats.vipCount),
          totalMessages: Number(stats.totalMessages),
        });
        setAllUsers(
          users.map((u: any) => ({
            principal: u.principal,
            username: u.username || "(no name)",
            coins: Number(u.coins),
            isVIP: u.isVIP,
          })),
        );
      })
      .catch(() => {
        toast.error("Failed to load admin data");
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, [isAdmin, actor]);

  // ---------- Section visibility ----------
  const show = {
    hero: tab === "home" || tab === "spins",
    ctaRow: tab === "home" || tab === "spins" || tab === "rewards",
    grid: tab === "home" || tab === "chat",
    vip: tab === "home" || tab === "vip",
    admin: tab === "admin",
    profile: tab === "profile",
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background font-sans">
      <Toaster position="top-right" richColors />

      {/* ── Active Game Overlay ──────────────────────────────────── */}
      {activeGame === "slots" && (
        <SlotMachine onBack={() => setActiveGame(null)} coins={coins} />
      )}
      {activeGame === "blackjack" && (
        <Blackjack onBack={() => setActiveGame(null)} coins={coins} />
      )}
      {activeGame === "dice" && (
        <DiceRoll onBack={() => setActiveGame(null)} coins={coins} />
      )}
      {activeGame === "cardflip" && (
        <CardFlip onBack={() => setActiveGame(null)} />
      )}
      {activeGame === "tournament" && (
        <Tournament onBack={() => setActiveGame(null)} />
      )}

      {/* ── Registration Modal ─────────────────────────────────────── */}
      <Dialog open={showRegister} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md rounded-2xl"
          style={{
            background: "#1e293b",
            border: "1px solid rgba(43,58,85,0.9)",
          }}
          data-ocid="register.modal"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center text-foreground">
              🎮 Welcome to FunHub Live!
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Choose a username to start collecting coins and competing!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <Input
              placeholder="Your username..."
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              className="bg-background/50 border-border/60 text-center text-base"
              autoFocus
              data-ocid="register.input"
            />
            <Input
              placeholder="Mobile number (10 digits)"
              type="tel"
              maxLength={10}
              value={regPhone}
              onChange={(e) =>
                setRegPhone(e.target.value.replace(/[^0-9]/g, ""))
              }
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              className="bg-background/50 border-border/60 text-center text-base"
              data-ocid="register.phone_input"
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter your 10-digit mobile number
            </p>
            <Button
              onClick={handleRegister}
              disabled={
                !regName.trim() || regPhone.trim().length !== 10 || registering
              }
              className="w-full py-5 text-base rounded-xl"
              style={{
                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                boxShadow: "0 0 24px rgba(34,197,94,0.4)",
                color: "#0f172a",
                fontWeight: 800,
                border: "none",
              }}
              data-ocid="register.submit_button"
            >
              {registering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
                </>
              ) : (
                "START PLAYING! 🎰"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Spin Result Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showSpinModal && spinResult !== null && (
          <Dialog open={showSpinModal} onOpenChange={setShowSpinModal}>
            <DialogContent
              className="sm:max-w-sm rounded-2xl text-center"
              style={{
                background: "#1e293b",
                border: "1px solid rgba(34,197,94,0.35)",
              }}
              data-ocid="spin_result.modal"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="py-4 space-y-4"
              >
                <div className="text-6xl">🎰</div>
                <p
                  className="text-2xl font-black uppercase tracking-widest"
                  style={{ color: "#22c55e" }}
                >
                  YOU WON!
                </p>
                <p className="text-6xl font-black" style={{ color: "#fbbf24" }}>
                  +{spinResult.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-sm">
                  coins added to your wallet
                </p>
                <Button
                  onClick={() => setShowSpinModal(false)}
                  className="w-full py-4 text-base rounded-xl"
                  style={{
                    background: "linear-gradient(135deg,#22c55e,#16a34a)",
                    color: "#0f172a",
                    fontWeight: 800,
                    border: "none",
                  }}
                  data-ocid="spin_result.close_button"
                >
                  AWESOME! 🎉
                </Button>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* PhonePe QR Payment Modal */}
      <Dialog open={showPaymentQR} onOpenChange={setShowPaymentQR}>
        <DialogContent className="bg-gray-900 border border-purple-500/40 text-white max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center text-yellow-400">
              💳 Pay via PhonePe / UPI
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300 text-sm">
              Scan the QR code below to complete your VIP purchase
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-xl overflow-hidden border-2 border-purple-400/60 shadow-lg shadow-purple-500/20">
              <img
                src="/assets/uploads/Screenshot_20260320_085315-1.jpg"
                alt="PhonePe QR Code"
                className="w-64 h-64 object-contain bg-white"
                data-ocid="payment.qr_code"
              />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <p className="text-xs text-gray-400 text-center mb-1">
                Ya seedha app se pay karo:
              </p>
              <a
                href="phonepe://pay?pa=9022892295@ibl&pn=FunHub%20VIP&am=199&cu=INR"
                className="w-full py-3 rounded-xl font-black text-sm text-center text-white bg-[#5f259f] hover:bg-[#7b2fcf] transition-all flex items-center justify-center gap-2"
              >
                💜 PhonePe se Pay karo
              </a>
              <a
                href="paytmmp://pay?pa=9022892295@ibl&pn=FunHub%20VIP&am=199&cu=INR"
                className="w-full py-3 rounded-xl font-black text-sm text-center text-white bg-[#002970] hover:bg-[#003fa0] transition-all flex items-center justify-center gap-2"
              >
                💙 Paytm se Pay karo
              </a>
              <a
                href="tez://upi/pay?pa=9022892295@ibl&pn=FunHub%20VIP&am=199&cu=INR"
                className="w-full py-3 rounded-xl font-black text-sm text-center text-white bg-[#1a73e8] hover:bg-[#1558b0] transition-all flex items-center justify-center gap-2"
              >
                🔵 GPay se Pay karo
              </a>
              <a
                href="upi://pay?pa=9022892295@ibl&pn=FunHub%20VIP&am=199&cu=INR"
                className="w-full py-3 rounded-xl font-black text-sm text-center text-white bg-gray-700 hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
              >
                📱 Koi bhi UPI App
              </a>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Payment ke baad{" "}
              <span className="text-yellow-400 font-semibold">"I've Paid"</span>{" "}
              dabao VIP activate karne ke liye
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={purchasingVip}
              data-ocid="payment.confirm_button"
              className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 transition-all disabled:opacity-50"
            >
              {purchasingVip
                ? "Activating VIP..."
                : "✅ I've Paid - Activate VIP"}
            </button>
            <button
              type="button"
              onClick={() => setShowPaymentQR(false)}
              data-ocid="payment.cancel_button"
              className="w-full py-3 rounded-xl font-bold text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all border border-gray-600"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeGame === null && (
        <>
          {/* ════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════ */}
          <header
            className="sticky top-0 z-50 w-full border-b border-border/40"
            style={{
              background: "rgba(15,23,42,0.96)",
              backdropFilter: "blur(14px)",
            }}
          >
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16 gap-3">
                {/* Logo */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow"
                    style={{
                      background: "linear-gradient(135deg,#22c55e,#16a34a)",
                      boxShadow: "0 0 12px rgba(34,197,94,0.35)",
                    }}
                  >
                    <Shield className="h-5 w-5 text-[#0f172a]" />
                  </div>
                  <div className="hidden sm:flex flex-col leading-none">
                    <span className="font-black text-lg tracking-tight">
                      <span style={{ color: "#22c55e" }}>FUN</span>
                      <span className="text-foreground">HUB</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold tracking-widest">
                      LIVE
                    </span>
                  </div>
                </div>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
                  {NAV_TABS.filter((t) => !t.adminOnly || isAdmin).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
                      style={{
                        color: tab === t.id ? "#22c55e" : "#94a3b8",
                        background:
                          tab === t.id ? "rgba(34,197,94,0.1)" : "transparent",
                        borderBottom:
                          tab === t.id
                            ? "2px solid #22c55e"
                            : "2px solid transparent",
                      }}
                      data-ocid={`nav.${t.id}.link`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </nav>

                {/* Right: coins + user */}
                <div className="flex items-center gap-2 shrink-0">
                  {isVip && (
                    <Badge
                      className="hidden sm:flex gap-1 text-xs"
                      style={{
                        background: "rgba(251,191,36,0.15)",
                        color: "#fbbf24",
                        border: "1px solid rgba(251,191,36,0.35)",
                      }}
                    >
                      <Crown className="h-3 w-3" /> VIP
                    </Badge>
                  )}

                  {/* Coin pill */}
                  <motion.div
                    key={coins}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold cursor-default"
                    style={{
                      background: "rgba(251,191,36,0.12)",
                      border: "1px solid rgba(251,191,36,0.35)",
                      color: "#fbbf24",
                    }}
                    data-ocid="header.coins.card"
                  >
                    <Coins className="h-4 w-4" />
                    <span>{isLoading ? "—" : fmtCoins(coins)}</span>
                  </motion.div>

                  {/* Avatar */}
                  <div className="flex items-center gap-1.5">
                    <Avatar
                      className="h-8 w-8 cursor-pointer"
                      style={{ border: "1.5px solid rgba(34,197,94,0.4)" }}
                      onClick={() => setTab("profile")}
                      data-ocid="header.profile.button"
                    >
                      {profile?.avatarUrl ? (
                        <AvatarImage src={profile.avatarUrl} alt={username} />
                      ) : null}
                      <AvatarFallback
                        className="text-xs font-bold"
                        style={{
                          background: "rgba(34,197,94,0.15)",
                          color: "#22c55e",
                        }}
                      >
                        {username[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-semibold text-foreground/80 max-w-[80px] truncate">
                      {username}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile tab bar */}
              <div className="flex md:hidden gap-1 pb-2 overflow-x-auto scrollbar-none">
                {NAV_TABS.filter((t) => !t.adminOnly || isAdmin).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase whitespace-nowrap transition-all"
                    style={{
                      color: tab === t.id ? "#22c55e" : "#94a3b8",
                      background:
                        tab === t.id ? "rgba(34,197,94,0.1)" : "transparent",
                    }}
                    data-ocid={`mobile.nav.${t.id}.link`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* ════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════════════ */}
          <main className="container mx-auto px-4 py-8 space-y-8">
            {/* ── Hero / Spin Wheel section ─────────────────────────────── */}
            <AnimatePresence mode="wait">
              {show.hero && (
                <motion.section
                  key="hero"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #0f172a 0%, #0d2042 40%, #0f172a 100%)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    boxShadow: "0 0 60px rgba(34,197,94,0.07)",
                  }}
                >
                  {/* Decorative floating emojis */}
                  <span className="absolute top-5 right-8 text-3xl opacity-25 animate-float">
                    🪙
                  </span>
                  <span className="absolute top-20 right-24 text-xl opacity-15 animate-float-slow">
                    ✨
                  </span>
                  <span
                    className="absolute bottom-8 left-8 text-2xl opacity-20 animate-float"
                    style={{ animationDelay: "1s" }}
                  >
                    💰
                  </span>
                  <span
                    className="absolute bottom-16 right-12 text-lg opacity-15 animate-float-slow"
                    style={{ animationDelay: "2s" }}
                  >
                    🎯
                  </span>

                  <div className="grid md:grid-cols-2 gap-8 p-6 md:p-10 items-center relative z-10">
                    {/* Left copy */}
                    <div className="space-y-5">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <p
                          className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                          style={{ color: "#22c55e" }}
                        >
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          LIVE NOW · {(1247).toLocaleString()} PLAYERS ONLINE
                        </p>
                        <h1 className="text-4xl lg:text-5xl font-black uppercase leading-tight tracking-tight">
                          <span className="text-foreground">
                            SPIN &amp; WIN
                          </span>
                          <br />
                          <span style={{ color: "#34d399" }}>BIG DAILY!</span>
                        </h1>
                        <p className="text-muted-foreground text-base mt-3 leading-relaxed">
                          Spin the wheel, collect daily bonuses, and climb to
                          VIP elite status!
                        </p>
                      </motion.div>

                      {/* Stat pills */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex gap-3 flex-wrap"
                      >
                        {[
                          {
                            icon: <Coins className="h-4 w-4" />,
                            val: "500",
                            sub: "Max Spin",
                          },
                          {
                            icon: <Trophy className="h-4 w-4" />,
                            val: "60K+",
                            sub: "Coins Today",
                          },
                          {
                            icon: <Star className="h-4 w-4" />,
                            val: "VIP",
                            sub: "Club Access",
                          },
                        ].map((s) => (
                          <div
                            key={s.val}
                            className="flex flex-col items-center px-3 py-2 rounded-xl"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <span style={{ color: "#fbbf24" }}>{s.icon}</span>
                            <span className="text-sm font-black text-foreground">
                              {s.val}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {s.sub}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    </div>

                    {/* Spin wheel */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.15,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                      className="flex justify-center"
                    >
                      <SpinWheel
                        onSpinComplete={handleSpinComplete}
                        disabled={!actor || isLoading || spinDisabled}
                      />
                    </motion.div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* ── CTA Row: Countdown + Daily Reward ────────────────────── */}
            <AnimatePresence mode="wait">
              {show.ctaRow && (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  {/* Next free spin countdown */}
                  <div
                    className="rounded-2xl p-6 space-y-3"
                    style={{
                      background: "#1e293b",
                      border: "1px solid rgba(43,58,85,0.85)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(34,197,94,0.15)" }}
                      >
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-black text-foreground uppercase tracking-wide text-sm">
                        NEXT FREE SPIN
                      </span>
                    </div>
                    <div
                      className="text-4xl font-black tracking-widest tabular-nums"
                      style={{ color: "#34d399" }}
                    >
                      {countdownStr}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Spin anytime — free spins reset every 24 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab("spins")}
                      className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/75 transition-colors"
                      data-ocid="cta.spins.link"
                    >
                      SPIN NOW <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Daily bonus */}
                  <div
                    className="rounded-2xl p-6 space-y-3"
                    style={{
                      background: "#1e293b",
                      border: canClaim
                        ? "1px solid rgba(34,197,94,0.3)"
                        : "1px solid rgba(43,58,85,0.85)",
                      boxShadow: canClaim
                        ? "0 0 24px rgba(34,197,94,0.08)"
                        : "0 4px 24px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(34,197,94,0.15)" }}
                      >
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-black text-foreground uppercase tracking-wide text-sm">
                        DAILY BONUS
                      </span>
                      <span
                        className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: canClaim
                            ? "rgba(34,197,94,0.2)"
                            : "rgba(148,163,184,0.15)",
                          color: canClaim ? "#22c55e" : "#94a3b8",
                        }}
                      >
                        {canClaim ? "READY!" : "CLAIMED"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {canClaim
                        ? "Your daily bonus is waiting! Earn up to 60 free coins every 24 hours."
                        : "You've claimed today's bonus. Come back tomorrow! 🌅"}
                    </p>
                    <Button
                      onClick={handleClaimDaily}
                      disabled={!canClaim || claimingDaily || !actor}
                      className="w-full py-4 rounded-xl text-sm"
                      style={
                        canClaim
                          ? {
                              background:
                                "linear-gradient(135deg,#22c55e,#16a34a)",
                              boxShadow: "0 0 18px rgba(34,197,94,0.35)",
                              color: "#0f172a",
                              fontWeight: 800,
                              border: "none",
                            }
                          : { border: "none" }
                      }
                      data-ocid="daily_reward.primary_button"
                    >
                      {claimingDaily ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          COLLECTING...
                        </>
                      ) : canClaim ? (
                        <>
                          <Gift className="mr-2 h-4 w-4" /> COLLECT DAILY BONUS!
                        </>
                      ) : (
                        "COME BACK TOMORROW"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Main grid: Game sections + Chat ───────────────────────── */}
            <AnimatePresence mode="wait">
              {show.grid && (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="grid lg:grid-cols-5 gap-6"
                >
                  {/* Game sections — left */}
                  {tab === "home" && (
                    <div className="lg:col-span-3 space-y-4">
                      <h2 className="text-base font-black uppercase tracking-widest text-foreground">
                        🎮 GAME SECTIONS
                      </h2>
                      <div className="space-y-3">
                        {[
                          {
                            emoji: "🎰",
                            name: "Slot Machines",
                            desc: "Vegas-style slots with massive jackpots",
                            players: 342,
                            color: "#ef4444",
                            game: "slots",
                          },
                          {
                            emoji: "🃏",
                            name: "Card Games",
                            desc: "Blackjack, Poker, and all-time card classics",
                            players: 189,
                            color: "#3b82f6",
                            game: "blackjack",
                          },
                          {
                            emoji: "🎲",
                            name: "Dice Roll",
                            desc: "High-stakes dice with multiplier chains",
                            players: 97,
                            color: "#8b5cf6",
                            game: "dice",
                          },
                          {
                            emoji: "🏆",
                            name: "Tournaments",
                            desc: "Compete vs. players for grand prize pools",
                            players: 621,
                            color: "#f59e0b",
                            game: "tournament",
                          },
                          {
                            emoji: "🎯",
                            name: "Precision Games",
                            desc: "Skill-based mini-games with coin rewards",
                            players: 244,
                            color: "#06b6d4",
                            game: "cardflip",
                          },
                        ].map((g, i) => (
                          <motion.div
                            key={g.name}
                            whileHover={{ x: 4, scale: 1.01 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => setActiveGame(g.game as GameType)}
                            className="flex items-center gap-4 p-4 rounded-xl cursor-pointer"
                            style={{
                              background: "#1e293b",
                              border: "1px solid rgba(43,58,85,0.8)",
                            }}
                            data-ocid={`games.item.${i + 1}`}
                          >
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                              style={{ background: `${g.color}1a` }}
                            >
                              {g.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-foreground text-sm">
                                {g.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {g.desc}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-black text-primary">
                                {g.players.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                online
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live Chat — right */}
                  <div
                    className={`${
                      tab === "home" ? "lg:col-span-2" : "lg:col-span-5"
                    } rounded-2xl p-5 flex flex-col`}
                    style={{
                      background: "#1e293b",
                      border: "1px solid rgba(43,58,85,0.8)",
                      minHeight: 480,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <h2 className="font-black uppercase tracking-widest text-foreground text-sm">
                        LIVE CHAT ROOM
                      </h2>
                      <span className="ml-auto text-xs text-muted-foreground">
                        1,247 online
                      </span>
                    </div>
                    <div className="flex-1" style={{ minHeight: 0 }}>
                      <ChatRoom
                        actor={actor}
                        username={username}
                        userAvatarUrl={profile?.avatarUrl}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── VIP Club section ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {show.vip && (
                <motion.section
                  key="vip"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="rounded-2xl p-6 md:p-8"
                  style={{
                    background:
                      "linear-gradient(135deg, #1e293b 0%, #1b2d4a 100%)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    boxShadow: "0 0 40px rgba(251,191,36,0.04)",
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-8">
                    {/* Left: tiers */}
                    <div className="flex-1 space-y-5">
                      <div className="flex items-center gap-3">
                        <Crown
                          className="h-8 w-8"
                          style={{ color: "#fbbf24" }}
                        />
                        <div>
                          <h2 className="text-xl font-black uppercase tracking-widest text-foreground">
                            VIP CLUB &amp; REWARDS
                          </h2>
                          <p className="text-muted-foreground text-sm">
                            Exclusive bonuses, privileges, and multipliers
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {VIP_TIERS.map((tier, i) => (
                          <motion.div
                            key={tier.name}
                            whileHover={{ y: -3, scale: 1.03 }}
                            transition={{ duration: 0.18 }}
                            className="rounded-xl p-4 text-center space-y-2"
                            style={{
                              background: "rgba(15,23,42,0.6)",
                              border: `1px solid ${tier.color}33`,
                            }}
                            data-ocid={`vip.tier.item.${i + 1}`}
                          >
                            <div className="text-3xl">{tier.emoji}</div>
                            <p
                              className="font-black text-sm uppercase tracking-wide"
                              style={{ color: tier.color }}
                            >
                              {tier.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {tier.req}
                            </p>
                            <p
                              className="text-[11px] font-semibold"
                              style={{ color: `${tier.color}cc` }}
                            >
                              {tier.perk}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Right: CTA */}
                    <div className="flex flex-col items-center gap-4 md:w-52">
                      {isVip ? (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-center space-y-3"
                        >
                          <div className="text-5xl">👑</div>
                          <Badge
                            className="text-sm px-4 py-1.5 font-black uppercase"
                            style={{
                              background: "rgba(251,191,36,0.18)",
                              color: "#fbbf24",
                              border: "1px solid rgba(251,191,36,0.4)",
                            }}
                          >
                            ACTIVE VIP MEMBER
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            You&apos;re enjoying all VIP perks!
                          </p>
                        </motion.div>
                      ) : (
                        <>
                          <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-foreground">
                              Join the Elite!
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Instant Bronze status
                            </p>
                            <p className="text-xs text-muted-foreground">
                              +10% bonus on all rewards
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Exclusive VIP tournaments
                            </p>
                          </div>
                          <Button
                            onClick={handlePurchaseVip}
                            disabled={purchasingVip || !actor}
                            className="w-full py-5 rounded-xl text-sm"
                            style={{
                              background:
                                "linear-gradient(135deg,#fbbf24,#d97706)",
                              boxShadow: "0 0 20px rgba(251,191,36,0.3)",
                              color: "#0f172a",
                              fontWeight: 800,
                              letterSpacing: "0.08em",
                              border: "none",
                            }}
                            data-ocid="vip.primary_button"
                          >
                            {purchasingVip ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                JOINING...
                              </>
                            ) : (
                              <>
                                <Crown className="mr-2 h-4 w-4" /> JOIN VIP NOW
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* ── Admin Panel section ───────────────────────────────────── */}
            <AnimatePresence>
              {show.admin && (
                <motion.section
                  key="admin"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35 }}
                  className="container mx-auto px-4 py-8 max-w-lg"
                  data-ocid="admin.section"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="p-2 rounded-xl"
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)",
                      }}
                    >
                      <Shield
                        className="h-6 w-6"
                        style={{ color: "#ef4444" }}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground tracking-wide">
                        ADMIN PANEL
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Control center for FunHub Live
                      </p>
                    </div>
                    {isAdmin && (
                      <span
                        className="ml-auto px-3 py-1 rounded-full text-xs font-black tracking-widest"
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          color: "#ef4444",
                          border: "1px solid rgba(239,68,68,0.4)",
                        }}
                        data-ocid="admin.success_state"
                      >
                        ✓ ADMIN
                      </span>
                    )}
                  </div>

                  {/* Claim Admin */}
                  <div
                    className="rounded-2xl p-5 mb-5"
                    style={{
                      background: "rgba(30,41,59,0.9)",
                      border: "1px solid rgba(43,58,85,0.9)",
                    }}
                    data-ocid="admin.panel"
                  >
                    <h3 className="text-sm font-black text-foreground tracking-widest uppercase mb-1">
                      Claim Admin Access
                    </h3>
                    <p className="text-xs text-muted-foreground mb-1">
                      First user to claim becomes the admin of this app.
                    </p>
                    <p className="text-xs mb-4" style={{ color: "#fbbf24" }}>
                      ⚡ One-time setup — first claim wins.
                    </p>
                    <Button
                      onClick={handleClaimAdmin}
                      disabled={claimingAdmin || isAdmin || !actor}
                      className="w-full py-4 rounded-xl text-sm font-black tracking-widest"
                      style={{
                        background: isAdmin
                          ? "rgba(34,197,94,0.15)"
                          : "linear-gradient(135deg,#ef4444,#b91c1c)",
                        color: isAdmin ? "#22c55e" : "#fff",
                        border: isAdmin
                          ? "1px solid rgba(34,197,94,0.3)"
                          : "none",
                        boxShadow: isAdmin
                          ? "none"
                          : "0 0 20px rgba(239,68,68,0.3)",
                      }}
                      data-ocid="admin.submit_button"
                    >
                      {claimingAdmin ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Claiming...
                        </>
                      ) : isAdmin ? (
                        "✅ You Are The Admin"
                      ) : (
                        "🛡️ Claim Admin"
                      )}
                    </Button>
                  </div>

                  {/* Admin Controls - only if admin */}
                  {isAdmin && (
                    <div className="space-y-4">
                      {/* Grant VIP */}
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          background: "rgba(30,41,59,0.9)",
                          border: "1px solid rgba(251,191,36,0.25)",
                        }}
                      >
                        <h3
                          className="text-sm font-black tracking-widest uppercase mb-1"
                          style={{ color: "#fbbf24" }}
                        >
                          👑 VIP Status
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Current:{" "}
                          {isVip ? (
                            <span style={{ color: "#fbbf24" }}>
                              ✅ VIP Active
                            </span>
                          ) : (
                            "Not VIP"
                          )}
                        </p>
                        <Button
                          onClick={handleGrantVip}
                          disabled={grantingVip || isVip || !actor}
                          className="w-full py-4 rounded-xl text-sm font-black tracking-widest"
                          style={{
                            background: isVip
                              ? "rgba(251,191,36,0.1)"
                              : "linear-gradient(135deg,#fbbf24,#d97706)",
                            color: isVip ? "#fbbf24" : "#0f172a",
                            border: isVip
                              ? "1px solid rgba(251,191,36,0.3)"
                              : "none",
                            boxShadow: isVip
                              ? "none"
                              : "0 0 20px rgba(251,191,36,0.3)",
                          }}
                          data-ocid="admin.primary_button"
                        >
                          {grantingVip ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                              Activating...
                            </>
                          ) : isVip ? (
                            "✅ VIP Already Active"
                          ) : (
                            "Grant Myself VIP 👑"
                          )}
                        </Button>
                      </div>

                      {/* Add Coins */}
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          background: "rgba(30,41,59,0.9)",
                          border: "1px solid rgba(34,197,94,0.25)",
                        }}
                      >
                        <h3
                          className="text-sm font-black tracking-widest uppercase mb-1"
                          style={{ color: "#22c55e" }}
                        >
                          💰 Add Coins
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Current balance:{" "}
                          <span style={{ color: "#fbbf24" }}>
                            {fmtCoins(coins)} coins
                          </span>
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={adminCoinsAmount}
                            onChange={(e) =>
                              setAdminCoinsAmount(e.target.value)
                            }
                            placeholder="Amount"
                            className="bg-background/50 border-border/60 text-center font-bold"
                            data-ocid="admin.input"
                          />
                          <Button
                            onClick={handleAddCoins}
                            disabled={addingCoins || !actor}
                            className="shrink-0 px-5 rounded-xl font-black"
                            style={{
                              background:
                                "linear-gradient(135deg,#22c55e,#16a34a)",
                              color: "#0f172a",
                              border: "none",
                              boxShadow: "0 0 16px rgba(34,197,94,0.3)",
                            }}
                            data-ocid="admin.save_button"
                          >
                            {addingCoins ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "ADD"
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* App Stats */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between mb-3">
                          <h3
                            className="text-sm font-black tracking-widest uppercase"
                            style={{ color: "#60a5fa" }}
                          >
                            📊 App Statistics
                          </h3>
                          <button
                            type="button"
                            onClick={handleLoadAdminData}
                            disabled={loadingUsers}
                            className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                            style={{
                              background: "rgba(96,165,250,0.15)",
                              color: "#60a5fa",
                              border: "1px solid rgba(96,165,250,0.3)",
                            }}
                            data-ocid="admin.secondary_button"
                          >
                            {loadingUsers ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "↻"
                            )}{" "}
                            Refresh
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div
                            className="rounded-xl p-3 text-center"
                            style={{
                              background: "rgba(30,41,59,0.9)",
                              border: "1px solid rgba(96,165,250,0.2)",
                            }}
                          >
                            <div
                              className="text-xl font-black"
                              style={{ color: "#60a5fa" }}
                            >
                              {appStats?.totalUsers ?? "—"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Users
                            </div>
                          </div>
                          <div
                            className="rounded-xl p-3 text-center"
                            style={{
                              background: "rgba(30,41,59,0.9)",
                              border: "1px solid rgba(251,191,36,0.2)",
                            }}
                          >
                            <div
                              className="text-xl font-black"
                              style={{ color: "#fbbf24" }}
                            >
                              {appStats?.vipCount ?? "—"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              VIP
                            </div>
                          </div>
                          <div
                            className="rounded-xl p-3 text-center"
                            style={{
                              background: "rgba(30,41,59,0.9)",
                              border: "1px solid rgba(167,139,250,0.2)",
                            }}
                          >
                            <div
                              className="text-xl font-black"
                              style={{ color: "#a78bfa" }}
                            >
                              {appStats?.totalMessages ?? "—"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Messages
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* User Management */}
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          background: "rgba(30,41,59,0.9)",
                          border: "1px solid rgba(96,165,250,0.25)",
                        }}
                      >
                        <h3
                          className="text-sm font-black tracking-widest uppercase mb-3"
                          style={{ color: "#60a5fa" }}
                        >
                          👥 User Management
                        </h3>
                        {allUsers.length === 0 ? (
                          <div
                            className="text-center py-4"
                            data-ocid="admin.empty_state"
                          >
                            <p className="text-xs text-muted-foreground mb-2">
                              No users loaded yet.
                            </p>
                            <button
                              type="button"
                              onClick={handleLoadAdminData}
                              className="text-xs font-bold px-3 py-1 rounded-lg"
                              style={{
                                background: "rgba(96,165,250,0.15)",
                                color: "#60a5fa",
                              }}
                            >
                              Load Users
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {allUsers.map((user, idx) => (
                              <div
                                key={user.principal}
                                className="rounded-xl p-3"
                                style={{
                                  background: "rgba(15,23,42,0.6)",
                                  border: "1px solid rgba(43,58,85,0.8)",
                                }}
                                data-ocid={`admin.item.${idx + 1}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-foreground">
                                      {user.username}
                                      {user.phone ? (
                                        <span className="text-xs text-muted-foreground ml-1">
                                          ({user.phone})
                                        </span>
                                      ) : null}
                                    </span>
                                    {user.isVIP && (
                                      <Crown
                                        className="h-3 w-3"
                                        style={{ color: "#fbbf24" }}
                                      />
                                    )}
                                  </div>
                                  <span
                                    className="text-xs font-black px-2 py-0.5 rounded-full"
                                    style={{
                                      background: "rgba(251,191,36,0.15)",
                                      color: "#fbbf24",
                                    }}
                                  >
                                    🪙 {user.coins.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mb-2 font-mono truncate">
                                  {user.principal.slice(0, 24)}...
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGrantVIPToUser(user.principal)
                                    }
                                    disabled={
                                      user.isVIP ||
                                      grantingVIPToUser === user.principal
                                    }
                                    className="text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shrink-0"
                                    style={{
                                      background: user.isVIP
                                        ? "rgba(251,191,36,0.1)"
                                        : "linear-gradient(135deg,#fbbf24,#d97706)",
                                      color: user.isVIP ? "#fbbf24" : "#0f172a",
                                      border: user.isVIP
                                        ? "1px solid rgba(251,191,36,0.3)"
                                        : "none",
                                      opacity: user.isVIP ? 0.6 : 1,
                                    }}
                                    data-ocid={`admin.toggle.${idx + 1}`}
                                  >
                                    {grantingVIPToUser === user.principal ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Crown className="h-3 w-3" />
                                    )}
                                    {user.isVIP ? "VIP" : "Grant VIP"}
                                  </button>
                                  <Input
                                    type="number"
                                    placeholder="1000"
                                    value={userCoinsMap[user.principal] || ""}
                                    onChange={(e) =>
                                      setUserCoinsMap((m) => ({
                                        ...m,
                                        [user.principal]: e.target.value,
                                      }))
                                    }
                                    className="bg-background/50 border-border/60 text-center text-xs font-bold h-7"
                                    data-ocid={`admin.input.${idx + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddCoinsToUser(user.principal)
                                    }
                                    disabled={
                                      addingCoinsToUser === user.principal
                                    }
                                    className="text-xs font-bold px-2 py-1 rounded-lg shrink-0"
                                    style={{
                                      background:
                                        "linear-gradient(135deg,#22c55e,#16a34a)",
                                      color: "#0f172a",
                                    }}
                                    data-ocid={`admin.save_button.${idx + 1}`}
                                  >
                                    {addingCoinsToUser === user.principal ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      "+Coins"
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Danger Zone */}
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          background: "rgba(30,41,59,0.9)",
                          border: "1px solid rgba(239,68,68,0.4)",
                        }}
                      >
                        <h3
                          className="text-sm font-black tracking-widest uppercase mb-1"
                          style={{ color: "#ef4444" }}
                        >
                          ⚠️ Danger Zone
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Destructive actions — use with caution.
                        </p>
                        <button
                          type="button"
                          onClick={handleClearChat}
                          disabled={clearingChat}
                          className="w-full py-3 rounded-xl text-sm font-black tracking-widest flex items-center justify-center gap-2"
                          style={{
                            background:
                              "linear-gradient(135deg,#ef4444,#b91c1c)",
                            color: "#fff",
                            boxShadow: "0 0 16px rgba(239,68,68,0.3)",
                            border: "none",
                          }}
                          data-ocid="admin.delete_button"
                        >
                          {clearingChat ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "🗑️"
                          )}{" "}
                          Clear All Chat Messages
                        </button>
                      </div>
                    </div>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            {/* ── Profile Tab ──────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {show.profile && (
                <motion.section
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="container mx-auto px-4 py-8 max-w-lg"
                  data-ocid="profile.section"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="p-2 rounded-xl"
                      style={{
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.2)",
                      }}
                    >
                      <User className="h-5 w-5" style={{ color: "#22c55e" }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-widest text-foreground">
                        My Profile
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Apna profile customize karo
                      </p>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-6 space-y-6"
                    style={{
                      background: "#1e293b",
                      border: "1px solid rgba(43,58,85,0.8)",
                    }}
                  >
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <Avatar
                          className="h-24 w-24 cursor-pointer"
                          style={{ border: "3px solid rgba(34,197,94,0.4)" }}
                          onClick={() => profileImgRef.current?.click()}
                          data-ocid="profile.upload_button"
                        >
                          {profileAvatarUrl ? (
                            <AvatarImage
                              src={profileAvatarUrl}
                              alt={username}
                            />
                          ) : null}
                          <AvatarFallback
                            className="text-2xl font-black"
                            style={{
                              background: "rgba(34,197,94,0.15)",
                              color: "#22c55e",
                            }}
                          >
                            {username[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                          style={{
                            background:
                              "linear-gradient(135deg,#22c55e,#16a34a)",
                            border: "2px solid #1e293b",
                          }}
                          onClick={() => profileImgRef.current?.click()}
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#0f172a]" />
                        </button>
                      </div>
                      <input
                        ref={profileImgRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            toast.info("Uploading photo...");
                            const blobId = await uploadFile(file);
                            const url = getUrl(blobId);
                            setProfileAvatarUrl(url);
                            toast.success(
                              "Photo uploaded! Save profile to keep it.",
                            );
                          } catch {
                            toast.error("Photo upload failed");
                          }
                          if (e.target) e.target.value = "";
                        }}
                        data-ocid="profile.dropzone"
                      />
                      <div className="text-center">
                        <p className="font-black text-lg text-foreground">
                          {username}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                          {isVip && (
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.15))",
                                color: "#fbbf24",
                                border: "1.5px solid rgba(251,191,36,0.5)",
                                boxShadow: "0 0 12px rgba(251,191,36,0.2)",
                                textShadow: "0 0 8px rgba(251,191,36,0.4)",
                              }}
                            >
                              👑 VIP Member
                            </span>
                          )}
                          {isAdmin && (
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(139,92,246,0.15))",
                                color: "#c4b5fd",
                                border: "1.5px solid rgba(167,139,250,0.5)",
                                boxShadow: "0 0 12px rgba(139,92,246,0.25)",
                                textShadow: "0 0 8px rgba(167,139,250,0.4)",
                              }}
                            >
                              💎 Founder
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coins */}
                    <div
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{
                        background: "rgba(251,191,36,0.07)",
                        border: "1px solid rgba(251,191,36,0.2)",
                      }}
                    >
                      <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                        <Coins
                          className="h-4 w-4"
                          style={{ color: "#fbbf24" }}
                        />{" "}
                        Coins Balance
                      </span>
                      <span
                        className="font-black text-lg"
                        style={{ color: "#fbbf24" }}
                      >
                        {fmtCoins(coins)}
                      </span>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <label
                        htmlFor="profile-bio"
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        Bio / About Me
                      </label>
                      <div className="relative">
                        <Textarea
                          value={profileBio}
                          onChange={(e) =>
                            setProfileBio(e.target.value.slice(0, 150))
                          }
                          id="profile-bio"
                          placeholder="Apne baare mein kuch likho... (max 150 chars)"
                          className="bg-background/60 border-border/50 text-sm resize-none"
                          rows={3}
                          maxLength={150}
                          data-ocid="profile.textarea"
                        />
                        <span
                          className="absolute bottom-2 right-3 text-[10px]"
                          style={{
                            color:
                              profileBio.length >= 140 ? "#ef4444" : "#64748b",
                          }}
                        >
                          {profileBio.length}/150
                        </span>
                      </div>
                    </div>

                    {/* Avatar URL manual input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="profile-avatar-url"
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        Profile Photo URL (optional)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={profileAvatarUrl}
                          onChange={(e) => setProfileAvatarUrl(e.target.value)}
                          id="profile-avatar-url"
                          placeholder="https://... ya upar se photo upload karo"
                          className="flex-1 bg-background/60 border-border/50 text-sm"
                          data-ocid="profile.input"
                        />
                      </div>
                    </div>

                    {/* Save button */}
                    <Button
                      onClick={async () => {
                        if (!actor) return;
                        setSavingProfile(true);
                        try {
                          await (actor as any).updateProfile(
                            profileBio,
                            profileAvatarUrl,
                          );
                          await queryClient.invalidateQueries({
                            queryKey: ["profile"],
                          });
                          toast.success("Profile saved! ✅");
                        } catch {
                          toast.error("Profile save failed");
                        } finally {
                          setSavingProfile(false);
                        }
                      }}
                      disabled={savingProfile || !actor}
                      className="w-full font-black tracking-widest"
                      style={{
                        background: "linear-gradient(135deg,#22c55e,#16a34a)",
                        color: "#0f172a",
                        border: "none",
                      }}
                      data-ocid="profile.save_button"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                          Saving...
                        </>
                      ) : (
                        "💾 Save Profile"
                      )}
                    </Button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </main>

          {/* ════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════ */}
          <footer
            className="mt-12 border-t border-border/30"
            style={{ background: "rgba(15,23,42,0.85)" }}
          >
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-black text-foreground">
                    FunHub Live
                  </span>
                  <span>— Where every spin is a win!</span>
                </div>
                <div className="flex gap-5 text-xs">
                  {["Terms", "Privacy", "Support", "Fair Play"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      className="hover:text-foreground transition-colors"
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <p className="text-xs">
                  © {new Date().getFullYear()}. Built with ❤️ using{" "}
                  <a
                    href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    caffeine.ai
                  </a>
                </p>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
