import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const DICE_FACES: Record<number, string[][]> = {
  1: [
    [" ", " ", " "],
    [" ", "●", " "],
    [" ", " ", " "],
  ],
  2: [
    ["●", " ", " "],
    [" ", " ", " "],
    [" ", " ", "●"],
  ],
  3: [
    ["●", " ", " "],
    [" ", "●", " "],
    [" ", " ", "●"],
  ],
  4: [
    ["●", " ", "●"],
    [" ", " ", " "],
    ["●", " ", "●"],
  ],
  5: [
    ["●", " ", "●"],
    [" ", "●", " "],
    ["●", " ", "●"],
  ],
  6: [
    ["●", " ", "●"],
    ["●", " ", "●"],
    ["●", " ", "●"],
  ],
};

interface Props {
  onBack: () => void;
  coins: number;
}

export default function DiceRoll({ onBack, coins }: Props) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [pick, setPick] = useState(1);
  const [bet, setBet] = useState(10);
  const [rolling, setRolling] = useState(false);
  const [diceVal, setDiceVal] = useState(1);
  const [animDice, setAnimDice] = useState(1);
  const [result, setResult] = useState<{
    won: boolean;
    msg: string;
    amount: number;
  } | null>(null);

  const handleRoll = async () => {
    if (!actor || rolling) return;
    if (coins < bet) {
      toast.error(`Not enough coins! You need ${bet} coins.`);
      return;
    }
    setRolling(true);
    setResult(null);

    // Animate dice rolling
    let ticks = 0;
    const animInterval = setInterval(() => {
      setAnimDice(Math.ceil(Math.random() * 6));
      ticks++;
      if (ticks >= 12) {
        clearInterval(animInterval);
        const rolled = Math.ceil(Math.random() * 6);
        setDiceVal(rolled);
        setAnimDice(rolled);
        const won = rolled === pick;
        setResult({
          won,
          msg: won ? "🎉 YOU WIN!" : "❌ MISS!",
          amount: won ? bet * 5 : bet,
        });
        actor
          .playDice(BigInt(bet), won)
          .then(() => queryClient.invalidateQueries({ queryKey: ["profile"] }))
          .then(() => {
            if (won) toast.success(`+${bet * 5} coins! You rolled ${rolled}!`);
            else
              toast.error(
                `Lost ${bet} coins. Rolled ${rolled}, picked ${pick}.`,
              );
          })
          .catch(() => toast.error("Failed to record dice result."))
          .finally(() => setRolling(false));
      }
    }, 80);
  };

  const face = DICE_FACES[animDice];

  return (
    <div className="min-h-screen" style={{ background: "#0f172a" }}>
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold mb-6 hover:text-green-400 transition-colors"
          style={{ color: "#94a3b8" }}
          data-ocid="dice.back.button"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Games
        </button>

        <div
          className="rounded-2xl p-6 space-y-6"
          style={{
            background: "#1e293b",
            border: "1px solid rgba(139,92,246,0.3)",
          }}
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🎲</div>
            <h1
              className="text-2xl font-black uppercase tracking-widest"
              style={{ color: "#8b5cf6" }}
            >
              Dice Roll
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pick a number, win 5× your bet!
            </p>
          </div>

          {/* Dice face */}
          <div className="flex justify-center">
            <motion.div
              animate={
                rolling
                  ? {
                      rotate: [0, 15, -15, 10, -10, 0],
                      scale: [1, 1.1, 0.9, 1.05, 1],
                    }
                  : {}
              }
              transition={{
                duration: 0.1,
                repeat: rolling ? Number.POSITIVE_INFINITY : 0,
              }}
              className="w-28 h-28 rounded-2xl p-3 grid grid-rows-3 gap-1"
              style={{
                background: "#0f172a",
                border: "3px solid rgba(139,92,246,0.5)",
                boxShadow: "0 0 30px rgba(139,92,246,0.2)",
              }}
            >
              {face.map((row, ri) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static dice face grid
                <div key={ri} className="flex justify-around items-center">
                  {row.map((cell, ci) => {
                    const dotKey = `dot-${ri}-${ci}`;
                    return (
                      <span
                        key={dotKey}
                        className="text-lg leading-none"
                        style={{
                          color: cell === "●" ? "white" : "transparent",
                        }}
                      >
                        {cell}
                      </span>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Pick number */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Pick your number
            </p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPick(n)}
                  className="w-11 h-11 rounded-xl font-black text-lg transition-all"
                  style={{
                    background: pick === n ? "rgba(139,92,246,0.3)" : "#0f172a",
                    border:
                      pick === n
                        ? "2px solid #8b5cf6"
                        : "2px solid rgba(43,58,85,0.8)",
                    color: pick === n ? "#8b5cf6" : "#94a3b8",
                    boxShadow:
                      pick === n ? "0 0 12px rgba(139,92,246,0.3)" : "none",
                  }}
                  data-ocid={`dice.pick.${n}.button`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Bet slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Bet amount
              </p>
              <p className="text-sm font-black" style={{ color: "#fbbf24" }}>
                {bet} coins
              </p>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={10}
              value={bet}
              onChange={(e) => setBet(Number(e.target.value))}
              className="w-full accent-purple-500"
              data-ocid="dice.bet.input"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>10</span>
              <span>100</span>
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-3 rounded-xl"
                style={{
                  background: result.won
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(239,68,68,0.15)",
                  border: result.won
                    ? "1px solid rgba(34,197,94,0.3)"
                    : "1px solid rgba(239,68,68,0.3)",
                }}
                data-ocid="dice.result.card"
              >
                <p
                  className="text-xl font-black"
                  style={{ color: result.won ? "#22c55e" : "#ef4444" }}
                >
                  {result.msg}
                </p>
                <p className="text-sm text-muted-foreground">
                  {result.won
                    ? `Won ${result.amount} coins!`
                    : `Lost ${result.amount} coins. Rolled ${diceVal}.`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleRoll}
            disabled={rolling || !actor}
            className="w-full py-6 text-base rounded-xl font-black uppercase tracking-widest"
            style={{
              background: rolling
                ? "rgba(139,92,246,0.4)"
                : "linear-gradient(135deg,#8b5cf6,#7c3aed)",
              color: "white",
              border: "none",
              boxShadow: rolling ? "none" : "0 0 24px rgba(139,92,246,0.4)",
            }}
            data-ocid="dice.primary_button"
          >
            {rolling ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ROLLING...
              </>
            ) : (
              <>🎲 ROLL DICE ({bet} coins)</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
