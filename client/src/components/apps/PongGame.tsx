import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";

const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const WINNING_SCORE = 5;

export function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [winner, setWinner] = useState<"player" | "ai" | null>(null);

  const gameRef = useRef({
    playerY: 160,
    aiY: 160,
    ballX: 300,
    ballY: 200,
    ballVX: 4,
    ballVY: 2,
  });

  const keysRef = useRef({ up: false, down: false });

  const resetBall = useCallback((direction: number) => {
    const game = gameRef.current;
    game.ballX = 300;
    game.ballY = 200;
    game.ballVX = 4 * direction;
    game.ballVY = (Math.random() - 0.5) * 4;
  }, []);

  const startGame = () => {
    setScores({ player: 0, ai: 0 });
    setWinner(null);
    gameRef.current = {
      playerY: 160,
      aiY: 160,
      ballX: 300,
      ballY: 200,
      ballVX: 4,
      ballVY: 2,
    };
    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") keysRef.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s") keysRef.current.down = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") keysRef.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") keysRef.current.down = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      if (gameState !== "playing") return;

      const game = gameRef.current;
      const keys = keysRef.current;

      if (keys.up && game.playerY > 0) game.playerY -= 6;
      if (keys.down && game.playerY < 400 - PADDLE_HEIGHT) game.playerY += 6;

      const aiCenter = game.aiY + PADDLE_HEIGHT / 2;
      const targetY = game.ballY - PADDLE_HEIGHT / 2;
      if (aiCenter < targetY - 20) game.aiY += 4;
      if (aiCenter > targetY + 20) game.aiY -= 4;
      game.aiY = Math.max(0, Math.min(400 - PADDLE_HEIGHT, game.aiY));

      game.ballX += game.ballVX;
      game.ballY += game.ballVY;

      if (game.ballY <= 0 || game.ballY >= 400 - BALL_SIZE) {
        game.ballVY *= -1;
      }

      if (
        game.ballX <= PADDLE_WIDTH + 20 &&
        game.ballY + BALL_SIZE >= game.playerY &&
        game.ballY <= game.playerY + PADDLE_HEIGHT
      ) {
        game.ballVX = Math.abs(game.ballVX) * 1.05;
        const hitPos = (game.ballY - game.playerY) / PADDLE_HEIGHT;
        game.ballVY = (hitPos - 0.5) * 8;
      }

      if (
        game.ballX >= 600 - PADDLE_WIDTH - 20 - BALL_SIZE &&
        game.ballY + BALL_SIZE >= game.aiY &&
        game.ballY <= game.aiY + PADDLE_HEIGHT
      ) {
        game.ballVX = -Math.abs(game.ballVX) * 1.05;
        const hitPos = (game.ballY - game.aiY) / PADDLE_HEIGHT;
        game.ballVY = (hitPos - 0.5) * 8;
      }

      if (game.ballX <= 0) {
        setScores(prev => {
          const newScores = { ...prev, ai: prev.ai + 1 };
          if (newScores.ai >= WINNING_SCORE) {
            setWinner("ai");
            setGameState("gameover");
          }
          return newScores;
        });
        resetBall(1);
      }

      if (game.ballX >= 600 - BALL_SIZE) {
        setScores(prev => {
          const newScores = { ...prev, player: prev.player + 1 };
          if (newScores.player >= WINNING_SCORE) {
            setWinner("player");
            setGameState("gameover");
          }
          return newScores;
        });
        resetBall(-1);
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 600, 400);

      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "#444";
      ctx.beginPath();
      ctx.moveTo(300, 0);
      ctx.lineTo(300, 400);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#4ade80";
      ctx.fillRect(20, game.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

      ctx.fillStyle = "#f87171";
      ctx.fillRect(600 - PADDLE_WIDTH - 20, game.aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

      ctx.fillStyle = "#fff";
      ctx.fillRect(game.ballX, game.ballY, BALL_SIZE, BALL_SIZE);

      animationId = requestAnimationFrame(gameLoop);
    };

    if (gameState === "playing") {
      animationId = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [gameState, resetBall]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 p-4" data-testid="pong-game">
      <h1 className="text-3xl font-bold text-white mb-4">Pong</h1>

      <div className="flex gap-12 mb-4 text-4xl font-bold">
        <span className="text-green-400">{scores.player}</span>
        <span className="text-gray-500">-</span>
        <span className="text-red-400">{scores.ai}</span>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="border-4 border-gray-700 rounded-lg"
          data-testid="game-canvas"
        />

        {gameState === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <h2 className="text-3xl font-bold text-white mb-4">Pong</h2>
            <p className="text-gray-400 mb-4">First to {WINNING_SCORE} wins!</p>
            <Button onClick={startGame} size="lg" data-testid="button-start">
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
            <p className="text-gray-500 text-sm mt-4">Use Arrow Keys or W/S to move</p>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <h2 className={`text-4xl font-bold mb-4 ${winner === "player" ? "text-green-400" : "text-red-400"}`}>
              {winner === "player" ? "You Win!" : "AI Wins!"}
            </h2>
            <p className="text-xl text-white mb-4">
              {scores.player} - {scores.ai}
            </p>
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
