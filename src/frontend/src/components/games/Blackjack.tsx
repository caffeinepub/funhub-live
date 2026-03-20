import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type Card = { rank: string; suit: string; hidden: boolean };

const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const SUITS = ["♠", "♥", "♦", "♣"];
const RED_SUITS = new Set(["♥", "♦"]);

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS)
    for (const rank of RANKS) deck.push({ rank, suit, hidden: false });
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(rank: string): number {
  if (["J", "Q", "K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return Number(rank);
}

function handTotal(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.hidden) continue;
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function CardDisplay({ card, index }: { card: Card; index: number }) {
  const isRed = RED_SUITS.has(card.suit);
  return (
    <motion.div
      initial={{ scale: 0, rotate: -10, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className="w-14 h-20 rounded-lg flex flex-col items-start justify-start p-1.5 text-sm font-black shrink-0"
      style={{
        background: card.hidden
          ? "linear-gradient(135deg, #1e3a5f, #2d4a7a)"
          : "white",
        border: "2px solid rgba(255,255,255,0.2)",
        color: card.hidden ? "transparent" : isRed ? "#dc2626" : "#0f172a",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      {card.hidden ? (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-2xl" style={{ color: "rgba(34,197,94,0.4)" }}>
            🂠
          </span>
        </div>
      ) : (
        <>
          <span className="leading-none">{card.rank}</span>
          <span className="leading-none">{card.suit}</span>
        </>
      )}
    </motion.div>
  );
}

interface Props {
  onBack: () => void;
  coins: number;
}

type GameState = "betting" | "playing" | "done";

export default function Blackjack({ onBack, coins }: Props) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [bet, setBet] = useState(10);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [result, setResult] = useState<{
    msg: string;
    won: boolean;
    amount: number;
  } | null>(null);

  const dealGame = () => {
    if (coins < bet) {
      toast.error(`Need ${bet} coins to play.`);
      return;
    }
    const d = makeDeck();
    const p = [d[0], d[2]];
    const dl = [d[1], { ...d[3], hidden: true }];
    setDeck(d.slice(4));
    setPlayerCards(p);
    setDealerCards(dl);
    setResult(null);
    setGameState("playing");
  };

  const finishGame = async (
    pCards: Card[],
    dCards: Card[],
    curDeck: Card[],
  ) => {
    // Reveal dealer hidden card
    const revealed = dCards.map((c) => ({ ...c, hidden: false }));
    let finalDealer = [...revealed];
    let finalDeck = [...curDeck];

    // Dealer hits until 17+
    while (handTotal(finalDealer) < 17 && finalDeck.length > 0) {
      finalDealer = [...finalDealer, finalDeck[0]];
      finalDeck = finalDeck.slice(1);
    }

    setDealerCards(finalDealer);
    const pTotal = handTotal(pCards);
    const dTotal = handTotal(finalDealer);

    let msg = "";
    let won = false;
    let amount = bet;

    if (pTotal > 21) {
      msg = "💥 BUST! You lose.";
      won = false;
    } else if (dTotal > 21) {
      msg = "🎉 Dealer busts! You win!";
      won = true;
      amount = bet * 2;
    } else if (pTotal === 21 && pCards.length === 2) {
      msg = "🃏 BLACKJACK! 2.5×!";
      won = true;
      amount = Math.floor(bet * 2.5);
    } else if (pTotal > dTotal) {
      msg = "✅ You win!";
      won = true;
      amount = bet * 2;
    } else if (pTotal === dTotal) {
      msg = "🤝 Push! Bet returned.";
      won = true;
      amount = bet;
    } else {
      msg = "❌ Dealer wins.";
      won = false;
    }

    setResult({ msg, won, amount });
    setGameState("done");

    try {
      await actor!.playBlackjack(BigInt(bet), won);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      if (won && amount > bet) toast.success(`+${amount} coins!`);
      else if (!won) toast.error(`Lost ${bet} coins.`);
      else toast.success("Bet returned (push).");
    } catch {
      toast.error("Failed to record blackjack result.");
    }
  };

  const handleHit = () => {
    if (!deck.length) return;
    const newCard = deck[0];
    const newCards = [...playerCards, newCard];
    const newDeck = deck.slice(1);
    setPlayerCards(newCards);
    setDeck(newDeck);
    if (handTotal(newCards) > 21) finishGame(newCards, dealerCards, newDeck);
  };

  const handleStand = () => finishGame(playerCards, dealerCards, deck);

  const pTotal = handTotal(playerCards);
  const dVisible = handTotal(dealerCards.filter((c) => !c.hidden));

  return (
    <div className="min-h-screen" style={{ background: "#0f172a" }}>
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold mb-6 hover:text-green-400 transition-colors"
          style={{ color: "#94a3b8" }}
          data-ocid="blackjack.back.button"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Games
        </button>

        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: "#1e293b",
            border: "1px solid rgba(59,130,246,0.3)",
          }}
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🃏</div>
            <h1
              className="text-2xl font-black uppercase tracking-widest"
              style={{ color: "#3b82f6" }}
            >
              Blackjack
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Beat the dealer to 21!
            </p>
          </div>

          {gameState === "betting" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Your bet
                  </p>
                  <p
                    className="text-sm font-black"
                    style={{ color: "#fbbf24" }}
                  >
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
                  className="w-full accent-blue-500"
                  data-ocid="blackjack.bet.input"
                />
              </div>
              <Button
                onClick={dealGame}
                disabled={!actor}
                className="w-full py-6 text-base rounded-xl font-black uppercase tracking-widest"
                style={{
                  background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                  color: "white",
                  border: "none",
                  boxShadow: "0 0 24px rgba(59,130,246,0.4)",
                }}
                data-ocid="blackjack.primary_button"
              >
                🃏 DEAL ({bet} coins)
              </Button>
            </div>
          )}

          {(gameState === "playing" || gameState === "done") && (
            <div className="space-y-4">
              {/* Dealer */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Dealer{" "}
                  {gameState === "done"
                    ? `— ${handTotal(dealerCards)}`
                    : `— ${dVisible}`}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {dealerCards.map((card, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional card
                    <CardDisplay key={i} card={card} index={i} />
                  ))}
                </div>
              </div>

              {/* Player */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  You — {pTotal}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {playerCards.map((card, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional card
                    <CardDisplay key={i} card={card} index={i} />
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-3 rounded-xl"
                    style={{
                      background: result.won
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(239,68,68,0.15)",
                      border: result.won
                        ? "1px solid rgba(34,197,94,0.3)"
                        : "1px solid rgba(239,68,68,0.3)",
                    }}
                    data-ocid="blackjack.result.card"
                  >
                    <p
                      className="text-xl font-black"
                      style={{ color: result.won ? "#22c55e" : "#ef4444" }}
                    >
                      {result.msg}
                    </p>
                    {result.won && result.amount !== bet && (
                      <p
                        className="text-2xl font-black"
                        style={{ color: "#fbbf24" }}
                      >
                        +{result.amount} coins
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {gameState === "playing" && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleHit}
                    className="flex-1 py-4 rounded-xl font-black uppercase"
                    style={{
                      background: "linear-gradient(135deg,#22c55e,#16a34a)",
                      color: "#0f172a",
                      border: "none",
                    }}
                    data-ocid="blackjack.hit.button"
                  >
                    HIT
                  </Button>
                  <Button
                    onClick={handleStand}
                    className="flex-1 py-4 rounded-xl font-black uppercase"
                    style={{
                      background: "linear-gradient(135deg,#ef4444,#dc2626)",
                      color: "white",
                      border: "none",
                    }}
                    data-ocid="blackjack.stand.button"
                  >
                    STAND
                  </Button>
                </div>
              )}

              {gameState === "done" && (
                <Button
                  onClick={() => setGameState("betting")}
                  className="w-full py-5 rounded-xl font-black uppercase tracking-widest"
                  style={{
                    background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                    color: "white",
                    border: "none",
                  }}
                  data-ocid="blackjack.play_again.button"
                >
                  PLAY AGAIN
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
