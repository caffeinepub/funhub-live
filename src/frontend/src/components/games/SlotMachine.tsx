import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "💎", "⭐", "7️⃣"];
const BET = 10;

interface Props {
  onBack: () => void;
  coins: number;
}

function Reel({ spinning, symbol }: { spinning: boolean; symbol: string }) {
  const symbols = [...SYMBOLS, ...SYMBOLS, ...SYMBOLS];
  return (
    <div
      className="w-20 h-24 rounded-xl overflow-hidden flex items-center justify-center text-4xl relative"
      style={{ background: "#0f172a", border: "2px solid rgba(34,197,94,0.3)" }}
    >
      {spinning ? (
        <motion.div
          animate={{ y: ["-200%", "200%"] }}
          transition={{
            duration: 0.15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="flex flex-col items-center gap-2"
        >
          {symbols.map((s, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <span key={i} className="text-3xl leading-none">
              {s}
            </span>
          ))}
        </motion.div>
      ) : (
        <motion.span
          key={symbol}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="text-4xl"
        >
          {symbol}
        </motion.span>
      )}
    </div>
  );
}

export default function SlotMachine({ onBack, coins }: Props) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [reels, setReels] = useState(["🍒", "🍋", "🍊"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ msg: string; won: number } | null>(
    null,
  );
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  const handleSpin = async () => {
    if (!actor || spinning) return;
    if (coins < BET) {
      toast.error("Not enough coins! Need at least 10 coins to spin.");
      return;
    }
    setSpinning(true);
    setResult(null);

    const r1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const r2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const r3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const finalReels = [r1, r2, r3];

    let won = 0;
    if (r1 === r2 && r2 === r3) won = BET * 50;
    else if (r1 === r2 || r2 === r3 || r1 === r3) won = BET * 2;

    const t1 = setTimeout(
      () => setReels((prev) => [r1, prev[1], prev[2]]),
      900,
    );
    const t2 = setTimeout(
      () => setReels((prev) => [prev[0], r2, prev[2]]),
      1500,
    );
    const t3 = setTimeout(async () => {
      setReels(finalReels);
      setSpinning(false);
      try {
        await actor.playSlots(BigInt(BET), BigInt(won));
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
        if (won > 0) {
          setResult({
            msg: r1 === r2 && r2 === r3 ? "🎉 JACKPOT!" : "✅ WIN!",
            won,
          });
          toast.success(`+${won} coins!`);
        } else {
          setResult({ msg: "❌ Try again!", won: 0 });
        }
      } catch {
        toast.error("Failed to record spin result.");
        setResult(null);
      }
    }, 2200);
    timeouts.current = [t1, t2, t3];
  };

  return (
    <div className="min-h-screen" style={{ background: "#0f172a" }}>
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold mb-6 hover:text-green-400 transition-colors"
          style={{ color: "#94a3b8" }}
          data-ocid="slots.back.button"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Games
        </button>

        <div
          className="rounded-2xl p-6 space-y-6"
          style={{
            background: "#1e293b",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🎰</div>
            <h1
              className="text-2xl font-black uppercase tracking-widest"
              style={{ color: "#22c55e" }}
            >
              Slot Machine
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cost: {BET} coins per spin
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {reels.map((sym, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static position
              <Reel key={i} spinning={spinning && i >= 0} symbol={sym} />
            ))}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-3 rounded-xl"
                style={{
                  background:
                    result.won > 0
                      ? "rgba(34,197,94,0.15)"
                      : "rgba(239,68,68,0.15)",
                  border:
                    result.won > 0
                      ? "1px solid rgba(34,197,94,0.3)"
                      : "1px solid rgba(239,68,68,0.3)",
                }}
                data-ocid="slots.result.card"
              >
                <p
                  className="text-xl font-black"
                  style={{ color: result.won > 0 ? "#22c55e" : "#ef4444" }}
                >
                  {result.msg}
                </p>
                {result.won > 0 && (
                  <p
                    className="text-3xl font-black"
                    style={{ color: "#fbbf24" }}
                  >
                    +{result.won} coins
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleSpin}
            disabled={spinning || !actor}
            className="w-full py-6 text-base rounded-xl font-black uppercase tracking-widest"
            style={{
              background: spinning
                ? "rgba(34,197,94,0.4)"
                : "linear-gradient(135deg,#22c55e,#16a34a)",
              color: "#0f172a",
              border: "none",
              boxShadow: spinning ? "none" : "0 0 24px rgba(34,197,94,0.4)",
            }}
            data-ocid="slots.primary_button"
          >
            {spinning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                SPINNING...
              </>
            ) : (
              <>🎰 SPIN ({BET} coins)</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
