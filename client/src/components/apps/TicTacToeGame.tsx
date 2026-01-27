import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type Player = "X" | "O" | null;

export function TicTacToeGame() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, ties: 0 });

  const calculateWinner = (squares: Player[]): Player => {
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

  const winner = calculateWinner(board);
  const winningLine = getWinningLine(board);
  const isDraw = !winner && board.every(cell => cell !== null);

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setScores(prev => ({ ...prev, [newWinner]: prev[newWinner] + 1 }));
    } else if (newBoard.every(cell => cell !== null)) {
      setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0, ties: 0 });
    resetGame();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-indigo-900 to-purple-900 p-4" data-testid="tictactoe-game">
      <h1 className="text-3xl font-bold text-white mb-4">Tic-Tac-Toe</h1>
      
      <div className="flex gap-8 mb-4 text-white">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">X</div>
          <div className="text-xl">{scores.X}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">Ties</div>
          <div className="text-xl">{scores.ties}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-pink-400">O</div>
          <div className="text-xl">{scores.O}</div>
        </div>
      </div>

      <div className="mb-4 h-8 text-xl font-semibold text-white">
        {winner ? (
          <span className={winner === "X" ? "text-blue-400" : "text-pink-400"}>
            {winner} Wins!
          </span>
        ) : isDraw ? (
          <span className="text-gray-400">It's a Draw!</span>
        ) : (
          <span>
            <span className={isXNext ? "text-blue-400" : "text-pink-400"}>
              {isXNext ? "X" : "O"}
            </span>'s Turn
          </span>
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
            disabled={!!cell || !!winner}
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
