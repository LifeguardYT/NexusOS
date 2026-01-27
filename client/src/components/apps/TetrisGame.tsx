import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 24;

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: "#00f5ff" },
  O: { shape: [[1, 1], [1, 1]], color: "#ffff00" },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: "#a000f0" },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: "#00f000" },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "#f00000" },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: "#0000f0" },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: "#f0a000" },
};

type TetrominoType = keyof typeof TETROMINOES;
type Board = (string | null)[][];

interface Piece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

export function TetrisGame() {
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("tetris-high-score");
    return saved ? parseInt(saved) : 0;
  });
  const gameRef = useRef<HTMLDivElement>(null);

  function createEmptyBoard(): Board {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
  }

  function getRandomPiece(): TetrominoType {
    const types = Object.keys(TETROMINOES) as TetrominoType[];
    return types[Math.floor(Math.random() * types.length)];
  }

  function createPiece(type: TetrominoType): Piece {
    const tetromino = TETROMINOES[type];
    return {
      type,
      shape: tetromino.shape.map(row => [...row]),
      x: Math.floor((BOARD_WIDTH - tetromino.shape[0].length) / 2),
      y: 0,
      color: tetromino.color,
    };
  }

  function rotatePiece(piece: Piece): Piece {
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        rotated[x][rows - 1 - y] = piece.shape[y][x];
      }
    }
    return { ...piece, shape: rotated };
  }

  function isValidPosition(piece: Piece, boardState: Board): boolean {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
          if (newY >= 0 && boardState[newY][newX]) return false;
        }
      }
    }
    return true;
  }

  function placePiece(piece: Piece, boardState: Board): Board {
    const newBoard = boardState.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && piece.y + y >= 0) {
          newBoard[piece.y + y][piece.x + x] = piece.color;
        }
      }
    }
    return newBoard;
  }

  function clearLines(boardState: Board): { newBoard: Board; linesCleared: number } {
    const newBoard = boardState.filter(row => row.some(cell => !cell));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    return { newBoard, linesCleared };
  }

  const startGame = useCallback(() => {
    setBoard(createEmptyBoard());
    const first = getRandomPiece();
    const next = getRandomPiece();
    setCurrentPiece(createPiece(first));
    setNextPiece(next);
    setScore(0);
    setLines(0);
    setLevel(1);
    setIsGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    gameRef.current?.focus();
  }, []);

  const togglePause = () => {
    if (!isPlaying || isGameOver) return;
    setIsPaused(!isPaused);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || isGameOver || !currentPiece) return;

      let newPiece = { ...currentPiece };

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          newPiece = { ...currentPiece, x: currentPiece.x - 1 };
          if (isValidPosition(newPiece, board)) setCurrentPiece(newPiece);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newPiece = { ...currentPiece, x: currentPiece.x + 1 };
          if (isValidPosition(newPiece, board)) setCurrentPiece(newPiece);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newPiece = { ...currentPiece, y: currentPiece.y + 1 };
          if (isValidPosition(newPiece, board)) setCurrentPiece(newPiece);
          break;
        case "ArrowUp":
        case "w":
        case "W":
          newPiece = rotatePiece(currentPiece);
          if (isValidPosition(newPiece, board)) setCurrentPiece(newPiece);
          break;
        case " ":
          while (isValidPosition({ ...newPiece, y: newPiece.y + 1 }, board)) {
            newPiece = { ...newPiece, y: newPiece.y + 1 };
          }
          setCurrentPiece(newPiece);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isPaused, isGameOver, currentPiece, board]);

  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || !currentPiece) return;

    const speed = Math.max(100, 800 - (level - 1) * 100);
    const interval = setInterval(() => {
      const movedPiece = { ...currentPiece, y: currentPiece.y + 1 };

      if (isValidPosition(movedPiece, board)) {
        setCurrentPiece(movedPiece);
      } else {
        const newBoard = placePiece(currentPiece, board);
        const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
        
        setBoard(clearedBoard);
        
        if (linesCleared > 0) {
          const points = [0, 100, 300, 500, 800][linesCleared] * level;
          const newScore = score + points;
          setScore(newScore);
          setLines(prev => {
            const newLines = prev + linesCleared;
            setLevel(Math.floor(newLines / 10) + 1);
            return newLines;
          });
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem("tetris-high-score", newScore.toString());
          }
        }

        if (nextPiece) {
          const newPiece = createPiece(nextPiece);
          if (!isValidPosition(newPiece, clearedBoard)) {
            setIsGameOver(true);
            setIsPlaying(false);
          } else {
            setCurrentPiece(newPiece);
            setNextPiece(getRandomPiece());
          }
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isGameOver, currentPiece, board, level, score, highScore, nextPiece]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={x}
            className="border border-gray-700"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: cell || "#1a1a2e",
              boxShadow: cell ? "inset 2px 2px 4px rgba(255,255,255,0.3)" : "none",
            }}
            data-testid={`cell-${x}-${y}`}
          />
        ))}
      </div>
    ));
  };

  const renderNextPiece = () => {
    if (!nextPiece) return null;
    const shape = TETROMINOES[nextPiece].shape;
    const color = TETROMINOES[nextPiece].color;

    return (
      <div className="flex flex-col items-center">
        {shape.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div
                key={x}
                className="border border-gray-600"
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: cell ? color : "transparent",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={gameRef}
      className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800 p-4"
      tabIndex={0}
      data-testid="tetris-game"
    >
      <div className="flex gap-6">
        <div className="border-2 border-gray-600 rounded-lg overflow-hidden shadow-2xl">
          {renderBoard()}
        </div>

        <div className="flex flex-col gap-4 text-white">
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-yellow-400">
              <Trophy className="w-4 h-4" />
              <span className="text-sm">High Score: {highScore}</span>
            </div>
            <div className="text-2xl font-bold" data-testid="text-score">Score: {score}</div>
            <div className="text-sm text-gray-400">Lines: {lines}</div>
            <div className="text-sm text-gray-400">Level: {level}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Next:</div>
            {renderNextPiece()}
          </div>

          <div className="flex flex-col gap-2">
            {!isPlaying || isGameOver ? (
              <Button onClick={startGame} className="gap-2" data-testid="button-start">
                <Play className="w-4 h-4" />
                {isGameOver ? "Play Again" : "Start"}
              </Button>
            ) : (
              <Button onClick={togglePause} className="gap-2" data-testid="button-pause">
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
            )}
            <Button variant="outline" onClick={startGame} className="gap-2" data-testid="button-restart">
              <RotateCcw className="w-4 h-4" />
              Restart
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Arrow keys or WASD to move</p>
            <p>Up/W to rotate</p>
            <p>Space to hard drop</p>
          </div>
        </div>
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
            <p className="text-xl mb-2">Score: {score}</p>
            <p className="text-gray-400 mb-4">Lines: {lines} | Level: {level}</p>
            <Button onClick={startGame} className="gap-2" data-testid="button-play-again">
              <Play className="w-4 h-4" />
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
