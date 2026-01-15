import { useState, useCallback } from "react";
import { Flag, Bomb, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const GRID_SIZE = 10;
const MINES_COUNT = 15;

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

type GameState = "idle" | "playing" | "won" | "lost";

export function MinesweeperGame() {
  const [grid, setGrid] = useState<CellState[][]>(() => initializeGrid());
  const [gameState, setGameState] = useState<GameState>("idle");
  const [flagsLeft, setFlagsLeft] = useState(MINES_COUNT);
  const [time, setTime] = useState(0);

  function initializeGrid(): CellState[][] {
    const newGrid: CellState[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINES_COUNT) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (!newGrid[y][x].isMine) {
        newGrid[y][x].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mines
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!newGrid[y][x].isMine) {
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE && newGrid[ny][nx].isMine) {
                count++;
              }
            }
          }
          newGrid[y][x].adjacentMines = count;
        }
      }
    }

    return newGrid;
  }

  const resetGame = () => {
    setGrid(initializeGrid());
    setGameState("idle");
    setFlagsLeft(MINES_COUNT);
    setTime(0);
  };

  const revealCell = useCallback((x: number, y: number) => {
    if (gameState === "won" || gameState === "lost") return;
    if (grid[y][x].isRevealed || grid[y][x].isFlagged) return;

    if (gameState === "idle") {
      setGameState("playing");
    }

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));

    if (newGrid[y][x].isMine) {
      // Game over - reveal all mines
      for (let row of newGrid) {
        for (let cell of row) {
          if (cell.isMine) cell.isRevealed = true;
        }
      }
      setGrid(newGrid);
      setGameState("lost");
      return;
    }

    // Flood fill for empty cells
    const reveal = (cx: number, cy: number) => {
      if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) return;
      if (newGrid[cy][cx].isRevealed || newGrid[cy][cx].isFlagged || newGrid[cy][cx].isMine) return;

      newGrid[cy][cx].isRevealed = true;

      if (newGrid[cy][cx].adjacentMines === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            reveal(cx + dx, cy + dy);
          }
        }
      }
    };

    reveal(x, y);
    setGrid(newGrid);

    // Check win condition
    let unrevealedSafeCells = 0;
    for (let row of newGrid) {
      for (let cell of row) {
        if (!cell.isRevealed && !cell.isMine) unrevealedSafeCells++;
      }
    }
    if (unrevealedSafeCells === 0) {
      setGameState("won");
    }
  }, [grid, gameState]);

  const toggleFlag = useCallback((e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (gameState === "won" || gameState === "lost") return;
    if (grid[y][x].isRevealed) return;

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const cell = newGrid[y][x];

    if (cell.isFlagged) {
      cell.isFlagged = false;
      setFlagsLeft(prev => prev + 1);
    } else if (flagsLeft > 0) {
      cell.isFlagged = true;
      setFlagsLeft(prev => prev - 1);
    }

    setGrid(newGrid);
  }, [grid, gameState, flagsLeft]);

  const getCellColor = (cell: CellState) => {
    if (!cell.isRevealed) return "";
    if (cell.isMine) return "bg-red-500";
    return "bg-gray-700";
  };

  const getNumberColor = (num: number) => {
    const colors = [
      "",
      "text-blue-400",
      "text-green-400",
      "text-red-400",
      "text-purple-400",
      "text-yellow-400",
      "text-cyan-400",
      "text-pink-400",
      "text-white",
    ];
    return colors[num] || "";
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <div className="flex items-center gap-2 text-white">
          <Flag className="w-5 h-5 text-red-500" />
          <span className="font-mono text-lg">{flagsLeft}</span>
        </div>
        <div className={`text-xl font-bold ${
          gameState === "won" ? "text-green-400" : 
          gameState === "lost" ? "text-red-400" : "text-white"
        }`}>
          {gameState === "won" ? "You Won!" : gameState === "lost" ? "Game Over" : "Minesweeper"}
        </div>
        <Button
          onClick={resetGame}
          variant="ghost"
          size="icon"
          className="text-white"
          data-testid="btn-reset-minesweeper"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Game Board */}
      <div 
        className="grid gap-0.5 p-2 bg-gray-800 rounded-lg"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <button
              key={`${x}-${y}`}
              onClick={() => revealCell(x, y)}
              onContextMenu={(e) => toggleFlag(e, x, y)}
              className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-sm transition-all ${
                cell.isRevealed
                  ? getCellColor(cell)
                  : "bg-gray-600 hover:bg-gray-500 active:scale-95"
              }`}
              disabled={cell.isRevealed}
              data-testid={`cell-${x}-${y}`}
            >
              {cell.isRevealed ? (
                cell.isMine ? (
                  <Bomb className="w-4 h-4 text-white" />
                ) : cell.adjacentMines > 0 ? (
                  <span className={getNumberColor(cell.adjacentMines)}>
                    {cell.adjacentMines}
                  </span>
                ) : null
              ) : cell.isFlagged ? (
                <Flag className="w-4 h-4 text-red-500" />
              ) : null}
            </button>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-white/60 text-sm">
        <p>Left-click to reveal, Right-click to flag</p>
      </div>
    </div>
  );
}
