import { ArrowLeft, Trophy } from "lucide-react";
import { motion } from "motion/react";

const LEADERBOARD = [
  { rank: 1, name: "CoinMaster_99", coins: 1_247_850, badge: "👑" },
  { rank: 2, name: "LuckyAlex77", coins: 987_340, badge: "🥈" },
  { rank: 3, name: "SpinQueen", coins: 854_210, badge: "🥉" },
  { rank: 4, name: "VIPKing2024", coins: 723_600, badge: "💎" },
  { rank: 5, name: "FunHubPro", coins: 612_450, badge: "⭐" },
  { rank: 6, name: "GoldRush_X", coins: 534_800, badge: "⭐" },
  { rank: 7, name: "NightOwl_Z", coins: 489_120, badge: "⭐" },
  { rank: 8, name: "SpeedSpinner", coins: 421_700, badge: "⭐" },
  { rank: 9, name: "DiamondHands", coins: 398_050, badge: "⭐" },
  { rank: 10, name: "JackpotJoe", coins: 356_920, badge: "⭐" },
];

interface Props {
  onBack: () => void;
}

export default function Tournament({ onBack }: Props) {
  return (
    <div className="min-h-screen" style={{ background: "#0f172a" }}>
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold mb-6 hover:text-yellow-400 transition-colors"
          style={{ color: "#94a3b8" }}
          data-ocid="tournament.back.button"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Games
        </button>

        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: "#1e293b",
            border: "1px solid rgba(251,191,36,0.3)",
          }}
        >
          <div className="text-center space-y-2">
            <div className="text-5xl">🏆</div>
            <h1
              className="text-2xl font-black uppercase tracking-widest"
              style={{ color: "#fbbf24" }}
            >
              Tournaments
            </h1>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest"
              style={{
                background: "rgba(251,191,36,0.15)",
                border: "1px solid rgba(251,191,36,0.35)",
                color: "#fbbf24",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              COMING SOON
            </div>
            <p className="text-sm text-muted-foreground">
              Live tournaments launching soon! Compete for massive prize pools.
            </p>
          </div>

          {/* Leaderboard preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4" style={{ color: "#fbbf24" }} />
              <p
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: "#fbbf24" }}
              >
                All-Time Leaderboard
              </p>
            </div>

            {LEADERBOARD.map((player, i) => (
              <motion.div
                key={player.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background:
                    player.rank <= 3
                      ? `rgba(251,191,36,${0.12 - i * 0.02})`
                      : "rgba(15,23,42,0.6)",
                  border:
                    player.rank === 1
                      ? "1px solid rgba(251,191,36,0.4)"
                      : "1px solid rgba(43,58,85,0.6)",
                }}
                data-ocid={`tournament.item.${i + 1}`}
              >
                <span className="text-xl w-8 text-center">{player.badge}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">
                    {player.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Rank #{player.rank}
                  </p>
                </div>
                <p
                  className="font-black text-sm"
                  style={{ color: player.rank <= 3 ? "#fbbf24" : "#94a3b8" }}
                >
                  {player.coins.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
