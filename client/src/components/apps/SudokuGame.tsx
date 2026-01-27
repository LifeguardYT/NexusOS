import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Lightbulb, Trophy } from "lucide-react";

function generateSudoku(): { puzzle: number[][], solution: number[][] } {
  const solution: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
  
  function isValid(grid: number[][], row: number, col: number, num: number): boolean {
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i + startRow][j + startCol] === num) return false;
      }
    }
    return true;
  }

  function solve(grid: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (solve(grid)) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(solution);

  const puzzle = solution.map(row => [...row]);
  let cellsToRemove = 40;
  while (cellsToRemove > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      cellsToRemove--;
    }
  }

  return { puzzle, solution };
}

export function SudokuGame() {
  const [puzzle, setPuzzle] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [userGrid, setUserGrid] = useState<number[][]>([]);
  const [original, setOriginal] = useState<boolean[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [hints, setHints] = useState(3);

  const initGame = () => {
    const { puzzle, solution } = generateSudoku();
    setPuzzle(puzzle);
    setSolution(solution);
    setUserGrid(puzzle.map(row => [...row]));
    setOriginal(puzzle.map(row => row.map(cell => cell !== 0)));
    setSelectedCell(null);
    setErrors(new Set());
    setIsComplete(false);
    setHints(3);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (!original[row]?.[col]) {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (original[row][col]) return;

    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = num;
    setUserGrid(newGrid);

    const newErrors = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (newGrid[r][c] !== 0 && newGrid[r][c] !== solution[r][c]) {
          newErrors.add(`${r}-${c}`);
        }
      }
    }
    setErrors(newErrors);

    if (newGrid.every((row, r) => row.every((cell, c) => cell === solution[r][c]))) {
      setIsComplete(true);
    }
  };

  const useHint = () => {
    if (hints <= 0 || !selectedCell) return;
    const { row, col } = selectedCell;
    if (original[row][col]) return;

    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = solution[row][col];
    setUserGrid(newGrid);
    setHints(prev => prev - 1);

    const newErrors = new Set(errors);
    newErrors.delete(`${row}-${col}`);
    setErrors(newErrors);

    if (newGrid.every((row, r) => row.every((cell, c) => cell === solution[r][c]))) {
      setIsComplete(true);
    }
  };

  const getCellClass = (row: number, col: number) => {
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isOriginal = original[row]?.[col];
    const hasError = errors.has(`${row}-${col}`);
    const borderRight = col === 2 || col === 5;
    const borderBottom = row === 2 || row === 5;

    return `w-10 h-10 flex items-center justify-center text-lg font-semibold cursor-pointer transition-colors
      ${isSelected ? "bg-blue-500 text-white" : isOriginal ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"}
      ${hasError ? "text-red-500" : ""}
      ${borderRight ? "border-r-2 border-r-gray-500" : "border-r border-r-gray-300 dark:border-r-gray-600"}
      ${borderBottom ? "border-b-2 border-b-gray-500" : "border-b border-b-gray-300 dark:border-b-gray-600"}
    `;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-blue-900 to-indigo-900 p-4" data-testid="sudoku-game">
      <h1 className="text-3xl font-bold text-white mb-4">Sudoku</h1>

      <div className="mb-4 flex gap-4 items-center">
        <div className="text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <span>{hints} hints left</span>
        </div>
      </div>

      <div className="bg-gray-800 p-1 rounded-lg border-2 border-gray-500 mb-4">
        {userGrid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={getCellClass(rowIndex, colIndex)}
                data-testid={`cell-${rowIndex}-${colIndex}`}
              >
                {cell !== 0 ? cell : ""}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
          <Button
            key={num}
            variant="secondary"
            onClick={() => handleNumberInput(num)}
            disabled={!selectedCell || original[selectedCell.row]?.[selectedCell.col]}
            className="w-12 h-12 text-xl font-bold"
            data-testid={`num-${num}`}
          >
            {num === 0 ? "X" : num}
          </Button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={useHint} variant="outline" disabled={hints <= 0 || !selectedCell}>
          <Lightbulb className="w-4 h-4 mr-2" />
          Use Hint
        </Button>
        <Button onClick={initGame} variant="outline" data-testid="button-new-game">
          <RotateCcw className="w-4 h-4 mr-2" />
          New Game
        </Button>
      </div>

      {isComplete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
            <p className="text-lg mb-4">You solved the puzzle!</p>
            <Button onClick={initGame} data-testid="button-play-again">
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
