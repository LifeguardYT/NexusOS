import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Flag, Bot } from "lucide-react";

type PieceType = "K" | "Q" | "R" | "B" | "N" | "P" | null;
type PieceColor = "white" | "black" | null;

interface Piece {
  type: PieceType;
  color: PieceColor;
}

type Board = (Piece | null)[][];

const PIECE_SYMBOLS: Record<string, string> = {
  "K-white": "\u2654", "Q-white": "\u2655", "R-white": "\u2656",
  "B-white": "\u2657", "N-white": "\u2658", "P-white": "\u2659",
  "K-black": "\u265A", "Q-black": "\u265B", "R-black": "\u265C",
  "B-black": "\u265D", "N-black": "\u265E", "P-black": "\u265F",
};

const PIECE_VALUES: Record<string, number> = {
  "P": 100, "N": 320, "B": 330, "R": 500, "Q": 900, "K": 20000,
};

function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRow: PieceType[] = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: backRow[i], color: "black" };
    board[1][i] = { type: "P", color: "black" };
    board[6][i] = { type: "P", color: "white" };
    board[7][i] = { type: backRow[i], color: "white" };
  }
  
  return board;
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

export function ChessGame() {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<"white" | "black">("white");
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[]; black: Piece[] }>({ white: [], black: [] });
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const getValidMoves = useCallback((row: number, col: number, boardState: Board): { row: number; col: number }[] => {
    const piece = boardState[row][col];
    if (!piece) return [];
    
    const moves: { row: number; col: number }[] = [];
    const { type, color } = piece;
    const direction = color === "white" ? -1 : 1;

    const addMoveIfValid = (r: number, c: number, captureOnly = false, moveOnly = false): boolean => {
      if (r < 0 || r > 7 || c < 0 || c > 7) return false;
      const target = boardState[r][c];
      if (!target) {
        if (!captureOnly) moves.push({ row: r, col: c });
        return true;
      }
      if (target.color !== color && !moveOnly) {
        moves.push({ row: r, col: c });
      }
      return false;
    };

    const addLineMoves = (dr: number, dc: number) => {
      for (let i = 1; i < 8; i++) {
        if (!addMoveIfValid(row + dr * i, col + dc * i)) break;
        if (boardState[row + dr * i]?.[col + dc * i]) break;
      }
    };

    switch (type) {
      case "P":
        addMoveIfValid(row + direction, col, false, true);
        if ((color === "white" && row === 6) || (color === "black" && row === 1)) {
          if (!boardState[row + direction][col]) {
            addMoveIfValid(row + direction * 2, col, false, true);
          }
        }
        addMoveIfValid(row + direction, col - 1, true);
        addMoveIfValid(row + direction, col + 1, true);
        break;
      case "R":
        addLineMoves(1, 0); addLineMoves(-1, 0);
        addLineMoves(0, 1); addLineMoves(0, -1);
        break;
      case "N":
        [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
          .forEach(([dr, dc]) => addMoveIfValid(row + dr, col + dc));
        break;
      case "B":
        addLineMoves(1, 1); addLineMoves(1, -1);
        addLineMoves(-1, 1); addLineMoves(-1, -1);
        break;
      case "Q":
        addLineMoves(1, 0); addLineMoves(-1, 0);
        addLineMoves(0, 1); addLineMoves(0, -1);
        addLineMoves(1, 1); addLineMoves(1, -1);
        addLineMoves(-1, 1); addLineMoves(-1, -1);
        break;
      case "K":
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) addMoveIfValid(row + dr, col + dc);
          }
        }
        break;
    }

    return moves;
  }, []);

  const getAllMoves = useCallback((boardState: Board, color: "white" | "black"): { from: { row: number; col: number }; to: { row: number; col: number } }[] => {
    const allMoves: { from: { row: number; col: number }; to: { row: number; col: number } }[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];
        if (piece && piece.color === color) {
          const moves = getValidMoves(row, col, boardState);
          moves.forEach(to => {
            allMoves.push({ from: { row, col }, to });
          });
        }
      }
    }
    
    return allMoves;
  }, [getValidMoves]);

  const evaluateBoard = useCallback((boardState: Board): number => {
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];
        if (piece && piece.type) {
          const value = PIECE_VALUES[piece.type] || 0;
          const positionBonus = piece.type === "P" 
            ? (piece.color === "white" ? (6 - row) * 10 : row * 10)
            : 0;
          
          if (piece.color === "black") {
            score += value + positionBonus;
          } else {
            score -= value + positionBonus;
          }
        }
      }
    }
    
    return score;
  }, []);

  const makeMove = useCallback((boardState: Board, from: { row: number; col: number }, to: { row: number; col: number }): Board => {
    const newBoard = cloneBoard(boardState);
    const piece = newBoard[from.row][from.col];
    
    if (piece?.type === "P" && (to.row === 0 || to.row === 7)) {
      piece.type = "Q";
    }
    
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    
    return newBoard;
  }, []);

  const minimax = useCallback((
    boardState: Board, 
    depth: number, 
    alpha: number, 
    beta: number, 
    isMaximizing: boolean
  ): number => {
    if (depth === 0) {
      return evaluateBoard(boardState);
    }

    const color = isMaximizing ? "black" : "white";
    const moves = getAllMoves(boardState, color);
    
    if (moves.length === 0) {
      return isMaximizing ? -10000 : 10000;
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newBoard = makeMove(boardState, move.from, move.to);
        const evaluation = minimax(newBoard, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const newBoard = makeMove(boardState, move.from, move.to);
        const evaluation = minimax(newBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }, [evaluateBoard, getAllMoves, makeMove]);

  const getBestMove = useCallback((boardState: Board): { from: { row: number; col: number }; to: { row: number; col: number } } | null => {
    const moves = getAllMoves(boardState, "black");
    if (moves.length === 0) return null;

    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      const newBoard = makeMove(boardState, move.from, move.to);
      const score = minimax(newBoard, 2, -Infinity, Infinity, false);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }, [getAllMoves, makeMove, minimax]);

  useEffect(() => {
    if (currentPlayer === "black" && !gameOver && !isThinking) {
      setIsThinking(true);
      
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board);
        
        if (bestMove) {
          const newBoard = cloneBoard(board);
          const movingPiece = newBoard[bestMove.from.row][bestMove.from.col];
          const capturedPiece = newBoard[bestMove.to.row][bestMove.to.col];

          if (capturedPiece) {
            setCapturedPieces(prev => ({
              ...prev,
              black: [...prev.black, capturedPiece],
            }));

            if (capturedPiece.type === "K") {
              setGameOver("AI wins!");
            }
          }

          if (movingPiece?.type === "P" && (bestMove.to.row === 0 || bestMove.to.row === 7)) {
            movingPiece.type = "Q";
          }

          newBoard[bestMove.to.row][bestMove.to.col] = movingPiece;
          newBoard[bestMove.from.row][bestMove.from.col] = null;
          
          setBoard(newBoard);
          setCurrentPlayer("white");
        }
        
        setIsThinking(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameOver, board, getBestMove, isThinking]);

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver || currentPlayer === "black" || isThinking) return;

    const clickedPiece = board[row][col];

    if (selectedSquare) {
      const isValidMove = validMoves.some(m => m.row === row && m.col === col);
      
      if (isValidMove) {
        const newBoard = cloneBoard(board);
        const movingPiece = newBoard[selectedSquare.row][selectedSquare.col];
        const capturedPiece = newBoard[row][col];

        if (capturedPiece) {
          setCapturedPieces(prev => ({
            ...prev,
            white: [...prev.white, capturedPiece],
          }));

          if (capturedPiece.type === "K") {
            setGameOver("You win!");
          }
        }

        if (movingPiece?.type === "P" && (row === 0 || row === 7)) {
          movingPiece.type = "Q";
        }

        newBoard[row][col] = movingPiece;
        newBoard[selectedSquare.row][selectedSquare.col] = null;
        
        setBoard(newBoard);
        setCurrentPlayer("black");
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === "white") {
      setSelectedSquare({ row, col });
      setValidMoves(getValidMoves(row, col, board));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setCurrentPlayer("white");
    setCapturedPieces({ white: [], black: [] });
    setGameOver(null);
    setValidMoves([]);
    setIsThinking(false);
  };

  const resign = () => {
    setGameOver("AI wins by resignation!");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-amber-900 to-amber-950 p-4" data-testid="chess-game">
      <h1 className="text-3xl font-bold text-white mb-1">Chess</h1>
      <div className="flex items-center gap-2 text-white/70 mb-2">
        <Bot className="w-4 h-4" />
        <span className="text-sm">vs AI</span>
      </div>
      
      <div className="mb-2 text-lg font-semibold text-white">
        {gameOver ? (
          gameOver
        ) : isThinking ? (
          <span className="animate-pulse text-amber-300">AI (Black) is thinking...</span>
        ) : (
          <span>Your turn <span className="text-amber-200">(White pieces)</span></span>
        )}
      </div>

      <div className="flex gap-4 mb-2">
        <div className="flex items-center gap-1 text-white text-sm">
          <span>You captured (from AI):</span>
          {capturedPieces.white.map((p, i) => (
            <span key={i} className="text-xl">{PIECE_SYMBOLS[`${p.type}-${p.color}`]}</span>
          ))}
        </div>
      </div>

      <div className="bg-amber-800 p-2 rounded-lg shadow-xl">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
              const isValidMove = validMoves.some(m => m.row === rowIndex && m.col === colIndex);
              
              return (
                <div
                  key={colIndex}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  className={`w-12 h-12 flex items-center justify-center text-4xl cursor-pointer transition-all
                    ${isLight ? "bg-amber-200" : "bg-amber-700"}
                    ${isSelected ? "ring-4 ring-blue-500" : ""}
                    ${isValidMove ? "ring-2 ring-green-400 ring-inset" : ""}
                  `}
                  data-testid={`square-${rowIndex}-${colIndex}`}
                >
                  {piece && PIECE_SYMBOLS[`${piece.type}-${piece.color}`]}
                  {isValidMove && !piece && (
                    <div className="w-3 h-3 bg-green-500 rounded-full opacity-60" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1 text-white text-sm">
          <span>AI (Black) captured:</span>
          {capturedPieces.black.map((p, i) => (
            <span key={i} className="text-xl">{PIECE_SYMBOLS[`${p.type}-${p.color}`]}</span>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Button onClick={resetGame} variant="outline" data-testid="button-new-game">
          <RotateCcw className="w-4 h-4 mr-2" />
          New Game
        </Button>
        <Button onClick={resign} variant="destructive" disabled={!!gameOver} data-testid="button-resign">
          <Flag className="w-4 h-4 mr-2" />
          Resign
        </Button>
      </div>
    </div>
  );
}
