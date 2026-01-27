import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";

const SYMBOLS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLORS = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
  "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"
];

interface Card {
  id: number;
  symbol: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryMatchGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem("memorymatch-best");
    return saved ? parseInt(saved) : Infinity;
  });

  const initializeGame = () => {
    const pairs = SYMBOLS.map((symbol, index) => ({
      symbol,
      color: COLORS[index],
    }));
    
    const cardPairs = [...pairs, ...pairs].map((item, index) => ({
      id: index,
      symbol: item.symbol,
      color: item.color,
      isFlipped: false,
      isMatched: false,
    }));

    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }

    setCards(cardPairs);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameWon(false);
    setIsLocked(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (matches === SYMBOLS.length && matches > 0) {
      setGameWon(true);
      if (moves < bestScore) {
        setBestScore(moves);
        localStorage.setItem("memorymatch-best", moves.toString());
      }
    }
  }, [matches, moves, bestScore]);

  const handleCardClick = (cardId: number) => {
    if (isLocked) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (flippedCards.length >= 2) return;

    const newCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsLocked(true);

      const [first, second] = newFlipped;
      const firstCard = newCards.find(c => c.id === first);
      const secondCard = newCards.find(c => c.id === second);

      if (firstCard && secondCard && firstCard.symbol === secondCard.symbol) {
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === first || c.id === second
                ? { ...c, isMatched: true }
                : c
            )
          );
          setMatches(prev => prev + 1);
          setFlippedCards([]);
          setIsLocked(false);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === first || c.id === second
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-800 to-slate-900 p-4" data-testid="memorymatch-game">
      <h1 className="text-3xl font-bold text-white mb-4">Memory Match</h1>

      <div className="flex gap-8 mb-4 text-white">
        <div className="text-center">
          <div className="text-sm text-gray-400">Moves</div>
          <div className="text-2xl font-bold">{moves}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">Matches</div>
          <div className="text-2xl font-bold text-green-400">{matches}/{SYMBOLS.length}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">Best</div>
          <div className="text-2xl font-bold text-amber-400">
            {bestScore === Infinity ? "-" : bestScore}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`w-20 h-20 rounded-lg text-3xl font-bold transition-all duration-300 transform ${
              card.isFlipped || card.isMatched
                ? `${card.color} text-white scale-100`
                : "bg-gray-600 hover:bg-gray-500 text-transparent scale-95 hover:scale-100"
            } ${card.isMatched ? "opacity-60" : ""}`}
            disabled={card.isMatched}
            data-testid={`card-${card.id}`}
          >
            {card.isFlipped || card.isMatched ? card.symbol : "?"}
          </button>
        ))}
      </div>

      <Button onClick={initializeGame} variant="outline" data-testid="button-new-game">
        <RotateCcw className="w-4 h-4 mr-2" />
        New Game
      </Button>

      {gameWon && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-lg mb-4">You won in {moves} moves!</p>
            {moves === bestScore && (
              <p className="text-green-500 font-semibold mb-4">New Best Score!</p>
            )}
            <Button onClick={initializeGame} data-testid="button-play-again">
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
