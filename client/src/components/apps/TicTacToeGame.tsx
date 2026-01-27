import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Bot } from "lucide-react";

type Player = "X" | "O" | null;

export function TicTacToeGame() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, ties: 0 });
  const [isThinking, setIsThinking] = useState(false);

  const checkWinner = (squares: Player[]): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const getWinningLine = (squares: Player[]): number[] | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return line;
      }
    }
    return null;
  };

  const getEmptyCells = (squares: Player[]): number[] => {
    const empty: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) empty.push(i);
    }
    return empty;
  };

  const minimax = useCallback((squares: Player[], isAI: boolean): number => {
    const winner = checkWinner(squares);
    
    if (winner === "O") return 10;
    if (winner === "X") return -10;
    
    const emptyCells = getEmptyCells(squares);
    if (emptyCells.length === 0) return 0;

    if (isAI) {
      let bestScore = -Infinity;
      for (const i of emptyCells) {
        const newSquares = [...squares];
        newSquares[i] = "O";
        const score = minimax(newSquares, false);
        bestScore = Math.max(score, bestScore);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const i of emptyCells) {
        const newSquares = [...squares];
        newSquares[i] = "X";
        const score = minimax(newSquares, true);
        bestScore = Math.min(score, bestScore);
      }
      return bestScore;
    }
  }, []);

  const getBestMove = useCallback((squares: Player[]): number => {
    const emptyCells = getEmptyCells(squares);
    if (emptyCells.length === 0) return -1;
    
    let bestScore = -Infinity;
    let bestMove = emptyCells[0];

    for (const i of emptyCells) {
      const newSquares = [...squares];
      newSquares[i] = "O";
      const score = minimax(newSquares, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }

    return bestMove;
  }, [minimax]);

  const winner = checkWinner(board);
  const winningLine = getWinningLine(board);
  const isDraw = !winner && board.every(cell => cell !== null);

  useEffect(() => {
    if (!isXNext && !winner && !isDraw && !isThinking) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board);
        if (bestMove !== -1) {
          const newBoard = [...board];
          newBoard[bestMove] = "O";
          setBoard(newBoard);
          setIsXNext(true);

          const newWinner = checkWinner(newBoard);
          if (newWinner) {
            setScores(prev => ({ ...prev, [newWinner]: prev[newWinner] + 1 }));
          } else if (newBoard.every(cell => cell !== null)) {
            setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
          }
        }
        setIsThinking(false);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, isDraw, board, getBestMove, isThinking]);

  const handleClick = (index: number) => {
    if (board[index] || winner || !isXNext || isThinking) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsXNext(false);

    const newWinner = checkWinner(newBoard);
    if (newWinner) {
      setScores(prev => ({ ...prev, [newWinner]: prev[newWinner] + 1 }));
    } else if (newBoard.every(cell => cell !== null)) {
      setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setIsThinking(false);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0, ties: 0 });
    resetGame();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-indigo-900 to-purple-900 p-4" data-testid="tictactoe-game">
      <h1 className="text-3xl font-bold text-white mb-2">Tic-Tac-Toe</h1>
      <div className="flex items-center gap-2 text-white/70 mb-4">
        <Bot className="w-4 h-4" />
        <span className="text-sm">vs AI</span>
      </div>
      
      <div className="flex gap-8 mb-4 text-white">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">You (X)</div>
          <div className="text-xl">{scores.X}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">Ties</div>
          <div className="text-xl">{scores.ties}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-pink-400 flex items-center gap-1">
            AI (O) <Bot className="w-4 h-4" />
          </div>
          <div className="text-xl">{scores.O}</div>
        </div>
      </div>

      <div className="mb-4 h-8 text-xl font-semibold text-white">
        {winner ? (
          <span className={winner === "X" ? "text-blue-400" : "text-pink-400"}>
            {winner === "X" ? "You Win!" : "AI Wins!"}
          </span>
        ) : isDraw ? (
          <span className="text-gray-400">It's a Draw!</span>
        ) : isThinking ? (
          <span className="text-pink-400 animate-pulse">AI is thinking...</span>
        ) : (
          <span className="text-blue-400">Your Turn</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className={`w-24 h-24 text-5xl font-bold rounded-lg transition-all ${
              winningLine?.includes(index)
                ? "bg-green-500/50"
                : "bg-white/10 hover:bg-white/20"
            } ${
              cell === "X" ? "text-blue-400" : cell === "O" ? "text-pink-400" : ""
            }`}
            disabled={!!cell || !!winner || !isXNext || isThinking}
            data-testid={`cell-${index}`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={resetGame} variant="outline" data-testid="button-new-game">
          <RotateCcw className="w-4 h-4 mr-2" />
          New Game
        </Button>
        <Button onClick={resetScores} variant="secondary" data-testid="button-reset-scores">
          Reset Scores
        </Button>
      </div>
    </div>
  );
}
