import { useState, useEffect, useCallback, useRef } from "react";
import { Play, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

export function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("snake-high-score");
    return saved ? parseInt(saved) : 0;
  });
  const directionRef = useRef(direction);
  const gameRef = useRef<HTMLDivElement>(null);

  const generateFood = useCallback((): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(false);
  };

  const startGame = () => {
    if (isGameOver) resetGame();
    setIsPlaying(true);
    gameRef.current?.focus();
  };

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      const currentDir = directionRef.current;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (currentDir !== "DOWN") {
            setDirection("UP");
          }
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (currentDir !== "UP") {
            setDirection("DOWN");
          }
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (currentDir !== "RIGHT") {
            setDirection("LEFT");
          }
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (currentDir !== "LEFT") {
            setDirection("RIGHT");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const currentDirection = directionRef.current;

        switch (currentDirection) {
          case "UP": head.y -= 1; break;
          case "DOWN": head.y += 1; break;
          case "LEFT": head.x -= 1; break;
          case "RIGHT": head.x += 1; break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          setIsPlaying(false);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("snake-high-score", String(score));
          }
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setIsGameOver(true);
          setIsPlaying(false);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("snake-high-score", String(score));
          }
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => prev + 10);
          setFood(generateFood());
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const speed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10);
    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [isPlaying, isGameOver, food, score, highScore, generateFood]);

  return (
    <div 
      ref={gameRef}
      className="h-full flex flex-col items-center justify-center bg-gray-900 p-4"
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-white font-medium">{highScore}</span>
        </div>
        <div className="text-2xl font-bold text-white">Score: {score}</div>
        <Button
          onClick={resetGame}
          variant="ghost"
          size="icon"
          className="text-white"
          data-testid="btn-reset-snake"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Game Board */}
      <div 
        className="relative border-2 border-green-500/50 rounded-lg overflow-hidden bg-gray-800"
        style={{ 
          width: GRID_SIZE * CELL_SIZE, 
          height: GRID_SIZE * CELL_SIZE 
        }}
      >
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34,197,94,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,197,94,0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
          }}
        />

        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute rounded-sm transition-all duration-75 ${
              index === 0 ? "bg-green-400" : "bg-green-500"
            }`}
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              margin: 1,
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute bg-red-500 rounded-full animate-pulse"
          style={{
            left: food.x * CELL_SIZE + 2,
            top: food.y * CELL_SIZE + 2,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
          }}
        />

        {/* Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            {isGameOver ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
                <p className="text-white/70 mb-4">Score: {score}</p>
                <Button onClick={startGame} className="gap-2" data-testid="btn-play-again">
                  <Play className="w-4 h-4" />
                  Play Again
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">Snake</h2>
                <Button onClick={startGame} className="gap-2" data-testid="btn-start-snake">
                  <Play className="w-4 h-4" />
                  Start Game
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls Info */}
      <div className="mt-4 text-center text-white/60 text-sm">
        <p>Use Arrow Keys or WASD to move</p>
      </div>
    </div>
  );
}
