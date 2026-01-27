import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const GRID_SIZE = 4;

type Grid = (number | null)[][];

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: "#eee4da", text: "#776e65" },
  4: { bg: "#ede0c8", text: "#776e65" },
  8: { bg: "#f2b179", text: "#f9f6f2" },
  16: { bg: "#f59563", text: "#f9f6f2" },
  32: { bg: "#f67c5f", text: "#f9f6f2" },
  64: { bg: "#f65e3b", text: "#f9f6f2" },
  128: { bg: "#edcf72", text: "#f9f6f2" },
  256: { bg: "#edcc61", text: "#f9f6f2" },
  512: { bg: "#edc850", text: "#f9f6f2" },
  1024: { bg: "#edc53f", text: "#f9f6f2" },
  2048: { bg: "#edc22e", text: "#f9f6f2" },
};

export function Game2048() {
  const [grid, setGrid] = useState<Grid>(() => initializeGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem("2048-best-score");
    return saved ? parseInt(saved) : 0;
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  function initializeGrid(): Grid {
    const newGrid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    return newGrid;
  }

  function addRandomTile(grid: Grid): boolean {
    const emptyCells: { row: number; col: number }[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!grid[row][col]) {
          emptyCells.push({ row, col });
        }
      }
    }
    if (emptyCells.length === 0) return false;
    const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  function moveLeft(grid: Grid): { newGrid: Grid; scored: number; moved: boolean } {
    let scored = 0;
    let moved = false;
    const newGrid: Grid = grid.map(row => {
      const filtered = row.filter(cell => cell !== null) as number[];
      const merged: number[] = [];
      let i = 0;
      while (i < filtered.length) {
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
          merged.push(filtered[i] * 2);
          scored += filtered[i] * 2;
          i += 2;
        } else {
          merged.push(filtered[i]);
          i++;
        }
      }
      while (merged.length < GRID_SIZE) {
        merged.push(null as any);
      }
      return merged;
    });
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] !== newGrid[row][col]) {
          moved = true;
        }
      }
    }
    
    return { newGrid, scored, moved };
  }

  function rotateGrid(grid: Grid): Grid {
    const newGrid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        newGrid[col][GRID_SIZE - 1 - row] = grid[row][col];
      }
    }
    return newGrid;
  }

  function move(direction: "left" | "right" | "up" | "down") {
    if (isGameOver) return;

    let workingGrid = grid.map(row => [...row]);
    let rotations = { left: 0, right: 2, up: 3, down: 1 }[direction];

    for (let i = 0; i < rotations; i++) {
      workingGrid = rotateGrid(workingGrid);
    }

    const { newGrid, scored, moved } = moveLeft(workingGrid);

    for (let i = 0; i < (4 - rotations) % 4; i++) {
      workingGrid = rotateGrid(newGrid);
    }
    
    let finalGrid = newGrid;
    for (let i = 0; i < (4 - rotations) % 4; i++) {
      finalGrid = rotateGrid(finalGrid);
    }

    if (moved) {
      addRandomTile(finalGrid);
      setGrid(finalGrid);
      const newScore = score + scored;
      setScore(newScore);
      
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem("2048-best-score", newScore.toString());
      }

      for (const row of finalGrid) {
        if (row.includes(2048) && !hasWon) {
          setHasWon(true);
        }
      }

      if (checkGameOver(finalGrid)) {
        setIsGameOver(true);
      }
    }
  }

  function checkGameOver(grid: Grid): boolean {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!grid[row][col]) return false;
        if (col < GRID_SIZE - 1 && grid[row][col] === grid[row][col + 1]) return false;
        if (row < GRID_SIZE - 1 && grid[row][col] === grid[row + 1][col]) return false;
      }
    }
    return true;
  }

  const resetGame = () => {
    setGrid(initializeGrid());
    setScore(0);
    setIsGameOver(false);
    setHasWon(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          move("left");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          move("right");
          break;
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          move("up");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          move("down");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [grid, isGameOver, score, bestScore, hasWon]);

  const getTileStyle = (value: number | null) => {
    if (!value) return { backgroundColor: "rgba(238, 228, 218, 0.35)" };
    const colors = TILE_COLORS[value] || { bg: "#3c3a32", text: "#f9f6f2" };
    return {
      backgroundColor: colors.bg,
      color: colors.text,
    };
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#faf8ef] p-4" data-testid="game-2048">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-[#776e65]">2048</h1>
          <div className="flex gap-2">
            <div className="bg-[#bbada0] rounded px-4 py-2 text-center">
              <div className="text-xs text-[#eee4da] uppercase">Score</div>
              <div className="text-xl font-bold text-white" data-testid="text-score">{score}</div>
            </div>
            <div className="bg-[#bbada0] rounded px-4 py-2 text-center">
              <div className="text-xs text-[#eee4da] uppercase flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Best
              </div>
              <div className="text-xl font-bold text-white">{bestScore}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-[#776e65]">Join the tiles, get to <strong>2048!</strong></p>
          <Button onClick={resetGame} variant="outline" className="gap-2 bg-[#8f7a66] text-white hover:bg-[#9f8b77] border-none" data-testid="button-new-game">
            <RotateCcw className="w-4 h-4" />
            New Game
          </Button>
        </div>

        <div className="bg-[#bbada0] rounded-lg p-3 relative">
          <div className="grid grid-cols-4 gap-3">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="aspect-square rounded-md flex items-center justify-center font-bold text-2xl transition-all"
                  style={getTileStyle(cell)}
                  data-testid={`tile-${rowIndex}-${colIndex}`}
                >
                  {cell || ""}
                </div>
              ))
            )}
          </div>

          {(isGameOver || hasWon) && (
            <div className="absolute inset-0 bg-white/70 rounded-lg flex flex-col items-center justify-center">
              <h2 className="text-3xl font-bold text-[#776e65] mb-4">
                {hasWon ? "You Win!" : "Game Over!"}
              </h2>
              <Button onClick={resetGame} className="bg-[#8f7a66] hover:bg-[#9f8b77]" data-testid="button-try-again">
                Try Again
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-[#776e65]">
          <p>Use arrow keys or WASD to move tiles</p>
        </div>
      </div>
    </div>
  );
}
