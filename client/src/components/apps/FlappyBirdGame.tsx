import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";

const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 3;
const BIRD_SIZE = 30;

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

export function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("flappybird-highscore");
    return saved ? parseInt(saved) : 0;
  });

  const birdRef = useRef({ y: 200, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const frameRef = useRef<number>(0);
  const scoreRef = useRef(0);

  const jump = useCallback(() => {
    if (gameState === "playing") {
      birdRef.current.velocity = JUMP_STRENGTH;
    }
  }, [gameState]);

  const startGame = () => {
    birdRef.current = { y: 200, velocity: 0 };
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameState("playing");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gameLoop = () => {
      if (gameState !== "playing") return;

      const bird = birdRef.current;
      const pipes = pipesRef.current;

      bird.velocity += GRAVITY;
      bird.y += bird.velocity;

      if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
        const topHeight = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
        pipes.push({ x: canvas.width, topHeight, passed: false });
      }

      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;
        
        if (pipes[i].x + PIPE_WIDTH < 0) {
          pipes.splice(i, 1);
          continue;
        }

        if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < 50) {
          pipes[i].passed = true;
          scoreRef.current++;
          setScore(scoreRef.current);
        }

        const birdLeft = 50;
        const birdRight = 50 + BIRD_SIZE;
        const birdTop = bird.y;
        const birdBottom = bird.y + BIRD_SIZE;

        const pipeLeft = pipes[i].x;
        const pipeRight = pipes[i].x + PIPE_WIDTH;

        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          if (birdTop < pipes[i].topHeight || birdBottom > pipes[i].topHeight + PIPE_GAP) {
            endGame();
            return;
          }
        }
      }

      if (bird.y < 0 || bird.y + BIRD_SIZE > canvas.height) {
        endGame();
        return;
      }

      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#228B22";
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(50 + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(50 + BIRD_SIZE / 2 + 5, bird.y + BIRD_SIZE / 2 - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2E8B57";
      for (const pipe of pipes) {
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.topHeight - PIPE_GAP);
        
        ctx.fillStyle = "#3CB371";
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
        ctx.fillRect(pipe.x - 5, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 10, 20);
        ctx.fillStyle = "#2E8B57";
      }

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    const endGame = () => {
      setGameState("gameover");
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
        localStorage.setItem("flappybird-highscore", scoreRef.current.toString());
      }
    };

    if (gameState === "playing") {
      frameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameState, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (gameState === "start" || gameState === "gameover") {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, jump]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-sky-200 p-4" data-testid="flappybird-game">
      <div className="mb-4 flex gap-8">
        <div className="text-center">
          <div className="text-sm text-gray-600">Score</div>
          <div className="text-3xl font-bold">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Best</div>
          <div className="text-3xl font-bold text-amber-600">{highScore}</div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          className="border-4 border-green-800 rounded-lg cursor-pointer"
          onClick={() => {
            if (gameState === "start" || gameState === "gameover") {
              startGame();
            } else {
              jump();
            }
          }}
          data-testid="game-canvas"
        />

        {gameState === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
            <h2 className="text-4xl font-bold text-white mb-4">Flappy Bird</h2>
            <Button onClick={startGame} size="lg" data-testid="button-start">
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
            <p className="text-white text-sm mt-4">Click or press Space to flap</p>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
            <h2 className="text-4xl font-bold text-white mb-2">Game Over!</h2>
            <p className="text-2xl text-white mb-4">Score: {score}</p>
            <Button onClick={startGame} size="lg" data-testid="button-restart">
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
