import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const EMOJIS = ["🐶", "🐱", "🦊", "🐸", "🦁", "🐼", "🦋", "🌺"];
const REWARD_PER_MATCH = 15;

function createBoard() {
  const pairs = [...EMOJIS, ...EMOJIS];
  return pairs
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({
      id: i,
      emoji,
      flipped: false,
      matched: false,
    }));
}

type CardType = {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
};

interface Props {
  onBack: () => void;
}

export default function CardFlip({ onBack }: Props) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [cards, setCards] = useState<CardType[]>(createBoard);
  const [selected, setSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [matches, setMatches] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalCoins = useRef(0);

  useEffect(() => {
    if (started && !won) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, won]);

  const handleFlip = useCallback(
    (id: number) => {
      if (locked || won) return;
      setCards((prev) => {
        const card = prev.find((c) => c.id === id);
        if (!card || card.flipped || card.matched) return prev;
        return prev.map((c) => (c.id === id ? { ...c, flipped: true } : c));
      });
      if (!started) setStarted(true);
      setSelected((prev) => {
        const next = [...prev, id];
        if (next.length === 2) {
          setLocked(true);
          setTimeout(() => checkMatch(next), 800);
          return next;
        }
        return next;
      });
    },
    [locked, won, started],
  );

  const checkMatch = (sel: number[]) => {
    setCards((prev) => {
      const [a, b] = sel.map((id) => prev.find((c) => c.id === id)!);
      if (a.emoji === b.emoji) {
        const updated = prev.map((c) =>
          sel.includes(c.id) ? { ...c, matched: true } : c,
        );
        const newMatches = updated.filter((c) => c.matched).length / 2;
        totalCoins.current += REWARD_PER_MATCH;
        actor
          ?.playCardFlip(BigInt(REWARD_PER_MATCH))
          .then(() => queryClient.invalidateQueries({ queryKey: ["profile"] }))
          .then(() => toast.success(`+${REWARD_PER_MATCH} coins! Match found!`))
          .catch(() => toast.error("Failed to record match."));
        setMatches(newMatches);
        if (newMatches === EMOJIS.length) {
          setWon(true);
          if (timerRef.current) clearInterval(timerRef.current);
        }
        setSelected([]);
        setLocked(false);
        return updated;
      }
      // No match — flip back
      setTimeout(() => {
        setCards((c) =>
          c.map((card) =>
            sel.includes(card.id) ? { ...card, flipped: false } : card,
          ),
        );
        setSelected([]);
        setLocked(false);
      }, 600);
      return prev;
    });
  };

  const resetGame = () => {
    setCards(createBoard());
    setSelected([]);
    setLocked(false);
    setMatches(0);
    setElapsed(0);
    setStarted(false);
    setWon(false);
    totalCoins.current = 0;
  };

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen" style={{ background: "#0f172a" }}>
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold mb-6 hover:text-green-400 transition-colors"
          style={{ color: "#94a3b8" }}
          data-ocid="cardflip.back.button"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Games
        </button>

        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "#1e293b",
            border: "1px solid rgba(6,182,212,0.3)",
          }}
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🎯</div>
            <h1
              className="text-2xl font-black uppercase tracking-widest"
              style={{ color: "#06b6d4" }}
            >
              Memory Match
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              +{REWARD_PER_MATCH} coins per pair matched!
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-around">
            <div className="text-center">
              <p className="text-xl font-black" style={{ color: "#06b6d4" }}>
                {matches}/{EMOJIS.length}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Matches
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black" style={{ color: "#fbbf24" }}>
                {fmtTime(elapsed)}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Time
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black" style={{ color: "#22c55e" }}>
                +{totalCoins.current}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Earned
              </p>
            </div>
          </div>

          {/* Board */}
          <div className="grid grid-cols-4 gap-2">
            {cards.map((card, idx) => (
              <motion.button
                key={card.id}
                type="button"
                onClick={() => handleFlip(card.id)}
                whileTap={{ scale: 0.92 }}
                className="aspect-square rounded-xl flex items-center justify-center text-2xl cursor-pointer"
                style={{
                  background:
                    card.flipped || card.matched
                      ? card.matched
                        ? "rgba(34,197,94,0.2)"
                        : selected.includes(card.id)
                          ? "rgba(6,182,212,0.35)"
                          : "rgba(6,182,212,0.2)"
                      : "#0f172a",
                  border: card.matched
                    ? "2px solid rgba(34,197,94,0.5)"
                    : selected.includes(card.id)
                      ? "2px solid rgba(6,182,212,0.9)"
                      : card.flipped
                        ? "2px solid rgba(6,182,212,0.5)"
                        : "2px solid rgba(43,58,85,0.8)",
                }}
                data-ocid={`cardflip.item.${idx + 1}`}
              >
                <AnimatePresence mode="wait">
                  {card.flipped || card.matched ? (
                    <motion.span
                      key="face"
                      initial={{ scale: 0, rotateY: 90 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {card.emoji}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="back"
                      className="text-xl"
                      style={{ color: "rgba(43,58,85,0.8)" }}
                    >
                      ❓
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>

          {won && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 rounded-xl space-y-1"
              style={{
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.4)",
              }}
              data-ocid="cardflip.success_state"
            >
              <p className="text-3xl">🎉</p>
              <p className="text-xl font-black" style={{ color: "#22c55e" }}>
                YOU WON!
              </p>
              <p className="text-sm text-muted-foreground">
                Finished in {fmtTime(elapsed)} · Earned {totalCoins.current}{" "}
                coins
              </p>
            </motion.div>
          )}

          <Button
            onClick={resetGame}
            className="w-full py-4 rounded-xl font-black uppercase tracking-widest"
            style={{
              background: "linear-gradient(135deg,#06b6d4,#0891b2)",
              color: "#0f172a",
              border: "none",
            }}
            data-ocid="cardflip.primary_button"
          >
            🔄 NEW GAME
          </Button>
        </div>
      </div>
    </div>
  );
}
