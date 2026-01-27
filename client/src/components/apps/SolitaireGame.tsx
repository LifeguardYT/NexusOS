import { useState, useCallback } from "react";
import { RotateCcw, Trophy, Undo } from "lucide-react";
import { Button } from "@/components/ui/button";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

interface Card {
  suit: Suit;
  value: CardValue;
  faceUp: boolean;
  id: string;
}

type Pile = Card[];

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
  spades: "\u2660",
};
const VALUE_DISPLAY: Record<CardValue, string> = {
  1: "A", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7",
  8: "8", 9: "9", 10: "10", 11: "J", 12: "Q", 13: "K",
};

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let value = 1; value <= 13; value++) {
      deck.push({
        suit,
        value: value as CardValue,
        faceUp: false,
        id: `${suit}-${value}`,
      });
    }
  }
  return shuffle(deck);
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function isRed(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

interface GameState {
  tableau: Pile[];
  foundations: Record<Suit, Pile>;
  stock: Pile;
  waste: Pile;
  moves: number;
}

function initializeGame(): GameState {
  const deck = createDeck();
  const tableau: Pile[] = [];
  let cardIndex = 0;

  for (let col = 0; col < 7; col++) {
    const pile: Pile = [];
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[cardIndex++] };
      card.faceUp = row === col;
      pile.push(card);
    }
    tableau.push(pile);
  }

  const stock = deck.slice(cardIndex).map(c => ({ ...c, faceUp: false }));

  return {
    tableau,
    foundations: {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: [],
    },
    stock,
    waste: [],
    moves: 0,
  };
}

export function SolitaireGame() {
  const [game, setGame] = useState<GameState>(initializeGame);
  const [selectedCard, setSelectedCard] = useState<{ source: string; cards: Card[] } | null>(null);
  const [hasWon, setHasWon] = useState(false);

  const resetGame = () => {
    setGame(initializeGame());
    setSelectedCard(null);
    setHasWon(false);
  };

  const drawFromStock = () => {
    if (game.stock.length === 0) {
      setGame(prev => ({
        ...prev,
        stock: prev.waste.reverse().map(c => ({ ...c, faceUp: false })),
        waste: [],
        moves: prev.moves + 1,
      }));
    } else {
      const card = { ...game.stock[game.stock.length - 1], faceUp: true };
      setGame(prev => ({
        ...prev,
        stock: prev.stock.slice(0, -1),
        waste: [...prev.waste, card],
        moves: prev.moves + 1,
      }));
    }
    setSelectedCard(null);
  };

  const canMoveToFoundation = (card: Card, foundation: Pile): boolean => {
    if (foundation.length === 0) return card.value === 1;
    const topCard = foundation[foundation.length - 1];
    return topCard.suit === card.suit && topCard.value === card.value - 1;
  };

  const canMoveToTableau = (card: Card, pile: Pile): boolean => {
    if (pile.length === 0) return card.value === 13;
    const topCard = pile[pile.length - 1];
    if (!topCard.faceUp) return false;
    return isRed(card.suit) !== isRed(topCard.suit) && topCard.value === card.value + 1;
  };

  const checkWin = (foundations: Record<Suit, Pile>): boolean => {
    return Object.values(foundations).every(pile => pile.length === 13);
  };

  const handleCardClick = useCallback((source: string, cards: Card[]) => {
    if (!cards.length || !cards[0].faceUp) return;

    if (selectedCard) {
      if (selectedCard.source === source) {
        setSelectedCard(null);
        return;
      }

      const movingCards = selectedCard.cards;
      const movingCard = movingCards[0];

      if (source.startsWith("foundation-")) {
        const suit = source.replace("foundation-", "") as Suit;
        if (movingCards.length === 1 && canMoveToFoundation(movingCard, game.foundations[suit])) {
          setGame(prev => {
            const newState = { ...prev };
            
            if (selectedCard.source === "waste") {
              newState.waste = prev.waste.slice(0, -1);
            } else if (selectedCard.source.startsWith("tableau-")) {
              const col = parseInt(selectedCard.source.split("-")[1]);
              newState.tableau = prev.tableau.map((pile, i) => {
                if (i === col) {
                  const newPile = pile.slice(0, -1);
                  if (newPile.length > 0 && !newPile[newPile.length - 1].faceUp) {
                    newPile[newPile.length - 1] = { ...newPile[newPile.length - 1], faceUp: true };
                  }
                  return newPile;
                }
                return pile;
              });
            }

            newState.foundations = {
              ...prev.foundations,
              [suit]: [...prev.foundations[suit], movingCard],
            };
            newState.moves = prev.moves + 1;

            if (checkWin(newState.foundations)) {
              setHasWon(true);
            }

            return newState;
          });
          setSelectedCard(null);
          return;
        }
      }

      if (source.startsWith("tableau-")) {
        const col = parseInt(source.split("-")[1]);
        if (canMoveToTableau(movingCard, game.tableau[col])) {
          setGame(prev => {
            const newState = { ...prev };
            
            if (selectedCard.source === "waste") {
              newState.waste = prev.waste.slice(0, -1);
            } else if (selectedCard.source.startsWith("tableau-")) {
              const srcCol = parseInt(selectedCard.source.split("-")[1]);
              const cardIdx = prev.tableau[srcCol].findIndex(c => c.id === movingCard.id);
              newState.tableau = prev.tableau.map((pile, i) => {
                if (i === srcCol) {
                  const newPile = pile.slice(0, cardIdx);
                  if (newPile.length > 0 && !newPile[newPile.length - 1].faceUp) {
                    newPile[newPile.length - 1] = { ...newPile[newPile.length - 1], faceUp: true };
                  }
                  return newPile;
                }
                if (i === col) {
                  return [...pile, ...movingCards];
                }
                return pile;
              });
              newState.moves = prev.moves + 1;
              setSelectedCard(null);
              return newState;
            }

            newState.tableau = prev.tableau.map((pile, i) => 
              i === col ? [...pile, ...movingCards] : pile
            );
            newState.moves = prev.moves + 1;
            return newState;
          });
          setSelectedCard(null);
          return;
        }
      }

      setSelectedCard(null);
    } else {
      setSelectedCard({ source, cards });
    }
  }, [selectedCard, game]);

  const handleWasteClick = () => {
    if (game.waste.length > 0) {
      const topCard = game.waste[game.waste.length - 1];
      handleCardClick("waste", [topCard]);
    }
  };

  const handleFoundationClick = (suit: Suit) => {
    if (selectedCard) {
      handleCardClick(`foundation-${suit}`, game.foundations[suit]);
    }
  };

  const handleTableauClick = (col: number, cardIndex?: number) => {
    const pile = game.tableau[col];
    if (cardIndex !== undefined && pile[cardIndex]?.faceUp) {
      handleCardClick(`tableau-${col}`, pile.slice(cardIndex));
    } else if (selectedCard) {
      handleCardClick(`tableau-${col}`, pile);
    }
  };

  const renderCard = (card: Card | null, isSelected: boolean = false, onClick?: () => void) => {
    if (!card) {
      return (
        <div
          className="w-16 h-22 rounded-lg border-2 border-dashed border-gray-400 bg-green-800/30"
          onClick={onClick}
        />
      );
    }

    if (!card.faceUp) {
      return (
        <div
          className="w-16 h-22 rounded-lg bg-blue-800 border-2 border-blue-600 shadow-md cursor-pointer"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)" }}
          onClick={onClick}
        />
      );
    }

    const color = isRed(card.suit) ? "text-red-600" : "text-gray-900";
    const selected = isSelected ? "ring-2 ring-yellow-400 ring-offset-2" : "";

    return (
      <div
        className={`w-16 h-22 rounded-lg bg-white border border-gray-300 shadow-md cursor-pointer p-1 flex flex-col justify-between ${selected}`}
        onClick={onClick}
        data-testid={`card-${card.id}`}
      >
        <div className={`text-xs font-bold ${color}`}>
          {VALUE_DISPLAY[card.value]}{SUIT_SYMBOLS[card.suit]}
        </div>
        <div className={`text-2xl text-center ${color}`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
        <div className={`text-xs font-bold ${color} self-end rotate-180`}>
          {VALUE_DISPLAY[card.value]}{SUIT_SYMBOLS[card.suit]}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-green-700 p-4" data-testid="solitaire-game">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button onClick={resetGame} variant="outline" size="sm" className="gap-1" data-testid="button-new-game">
            <RotateCcw className="w-4 h-4" />
            New Game
          </Button>
        </div>
        <div className="flex items-center gap-4 text-white">
          <span>Moves: {game.moves}</span>
        </div>
      </div>

      <div className="flex gap-8 mb-6">
        <div className="flex gap-2">
          <div onClick={drawFromStock} className="cursor-pointer" data-testid="stock-pile">
            {game.stock.length > 0 ? (
              renderCard({ ...game.stock[0], faceUp: false })
            ) : (
              <div className="w-16 h-22 rounded-lg border-2 border-dashed border-white/50 flex items-center justify-center text-white/50">
                <RotateCcw className="w-6 h-6" />
              </div>
            )}
          </div>
          <div onClick={handleWasteClick} data-testid="waste-pile">
            {game.waste.length > 0 ? (
              renderCard(
                game.waste[game.waste.length - 1],
                selectedCard?.source === "waste"
              )
            ) : (
              <div className="w-16 h-22 rounded-lg border-2 border-dashed border-white/30" />
            )}
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2">
          {SUITS.map(suit => (
            <div
              key={suit}
              onClick={() => handleFoundationClick(suit)}
              className="cursor-pointer"
              data-testid={`foundation-${suit}`}
            >
              {game.foundations[suit].length > 0 ? (
                renderCard(game.foundations[suit][game.foundations[suit].length - 1])
              ) : (
                <div className="w-16 h-22 rounded-lg border-2 border-dashed border-white/50 flex items-center justify-center">
                  <span className={`text-2xl ${isRed(suit) ? "text-red-400" : "text-gray-400"}`}>
                    {SUIT_SYMBOLS[suit]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 flex-1">
        {game.tableau.map((pile, col) => (
          <div key={col} className="flex flex-col" data-testid={`tableau-${col}`}>
            {pile.length === 0 ? (
              <div
                className="w-16 h-22 rounded-lg border-2 border-dashed border-white/30 cursor-pointer"
                onClick={() => handleTableauClick(col)}
              />
            ) : (
              pile.map((card, cardIndex) => (
                <div
                  key={card.id}
                  style={{ marginTop: cardIndex === 0 ? 0 : -60 }}
                  onClick={() => handleTableauClick(col, cardIndex)}
                >
                  {renderCard(
                    card,
                    selectedCard?.source === `tableau-${col}` && 
                    selectedCard.cards.some(c => c.id === card.id)
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {hasWon && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
            <p className="text-gray-600 mb-4">You won in {game.moves} moves!</p>
            <Button onClick={resetGame} data-testid="button-play-again">Play Again</Button>
          </div>
        </div>
      )}
    </div>
  );
}
