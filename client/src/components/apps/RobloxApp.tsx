import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Home, Gamepad2, Users, ShoppingBag, User, Settings, Search,
  Play, Star, Clock, TrendingUp, Heart, ArrowLeft, X, Volume2,
  Maximize2, ChevronRight, Coins, Sword, Mountain, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface Game {
  id: string;
  name: string;
  thumbnail: string;
  creator: string;
  playing: number;
  visits: string;
  likes: number;
  category: string;
  description: string;
  playable: boolean;
  gameType?: "obby" | "collector" | "fighter" | "simulator";
}

interface Avatar {
  skinColor: string;
  hairStyle: number;
  hairColor: string;
  faceStyle: number;
  shirtColor: string;
  pantsColor: string;
  accessory: number;
}

interface UserData {
  id: string;
  firstName: string | null;
  email: string;
}

const DEFAULT_AVATAR: Avatar = {
  skinColor: "#ffdbac",
  hairStyle: 0,
  hairColor: "#4a3728",
  faceStyle: 0,
  shirtColor: "#3b82f6",
  pantsColor: "#1e3a5f",
  accessory: 0,
};

const SKIN_COLORS = ["#ffdbac", "#f5c6a5", "#e5a07a", "#c68642", "#8d5524", "#6b4423"];
const HAIR_COLORS = ["#4a3728", "#2c1810", "#000000", "#8b4513", "#daa520", "#ff6b6b", "#9333ea", "#22c55e"];
const SHIRT_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ffffff", "#1f2937"];
const PANTS_COLORS = ["#1e3a5f", "#1f2937", "#374151", "#7c3aed", "#059669", "#dc2626"];

const PLAYABLE_GAMES: Game[] = [
  {
    id: "coin-collector",
    name: "Coin Collector",
    thumbnail: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    creator: "NexusOS Games",
    playing: 45231,
    visits: "2.1M",
    likes: 89000,
    category: "Simulator",
    description: "Collect as many coins as you can! Move with arrow keys or WASD. Avoid the red obstacles!",
    playable: true,
    gameType: "collector"
  },
  {
    id: "tower-climb",
    name: "Tower Climb",
    thumbnail: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    creator: "NexusOS Games",
    playing: 32156,
    visits: "1.8M",
    likes: 67000,
    category: "Obby",
    description: "Jump your way to the top! Use arrow keys or WASD to move, SPACE to jump. Reach the top to win!",
    playable: true,
    gameType: "obby"
  },
  {
    id: "battle-arena",
    name: "Battle Arena",
    thumbnail: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
    creator: "NexusOS Games", 
    playing: 28934,
    visits: "1.5M",
    likes: 54000,
    category: "Fighting",
    description: "Fight enemies and survive! Arrow keys to move, SPACE to attack. Defeat all enemies to win!",
    playable: true,
    gameType: "fighter"
  },
];

const SHOWCASE_GAMES: Game[] = [
  {
    id: "1",
    name: "Adopt Me!",
    thumbnail: "linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)",
    creator: "DreamCraft",
    playing: 523847,
    visits: "32.5B",
    likes: 12500000,
    category: "Adventure",
    description: "Raise and dress cute pets!",
    playable: false
  },
  {
    id: "2", 
    name: "Brookhaven RP",
    thumbnail: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    creator: "Wolfpaq",
    playing: 412933,
    visits: "28.1B",
    likes: 9800000,
    category: "Town and City",
    description: "Live your dream life!",
    playable: false
  },
  {
    id: "3",
    name: "Blox Fruits",
    thumbnail: "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)",
    creator: "Gamer Robot Inc",
    playing: 356782,
    visits: "42.3B",
    likes: 11000000,
    category: "Adventure",
    description: "Become a powerful fruit user!",
    playable: false
  },
];

const ALL_GAMES = [...PLAYABLE_GAMES, ...SHOWCASE_GAMES];

type Tab = "home" | "discover" | "avatar" | "create" | "robux";

function AvatarDisplay({ avatar, size = 100, showShadow = true }: { avatar: Avatar; size?: number; showShadow?: boolean }) {
  const scale = size / 100;
  
  return (
    <div className="relative" style={{ width: size, height: size * 1.5 }}>
      {showShadow && (
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/20 rounded-full"
          style={{ width: size * 0.6, height: size * 0.1 }}
        />
      )}
      <svg viewBox="0 0 100 150" style={{ width: size, height: size * 1.5 }}>
        <rect x="30" y="50" width="40" height="50" rx="5" fill={avatar.shirtColor} />
        <rect x="25" y="100" width="20" height="40" rx="3" fill={avatar.pantsColor} />
        <rect x="55" y="100" width="20" height="40" rx="3" fill={avatar.pantsColor} />
        <rect x="15" y="55" width="15" height="35" rx="3" fill={avatar.skinColor} />
        <rect x="70" y="55" width="15" height="35" rx="3" fill={avatar.skinColor} />
        <circle cx="50" cy="30" r="25" fill={avatar.skinColor} />
        {avatar.hairStyle === 0 && (
          <path d="M25 25 Q50 5 75 25 Q75 15 50 10 Q25 15 25 25" fill={avatar.hairColor} />
        )}
        {avatar.hairStyle === 1 && (
          <ellipse cx="50" cy="18" rx="28" ry="15" fill={avatar.hairColor} />
        )}
        {avatar.hairStyle === 2 && (
          <>
            <ellipse cx="50" cy="15" rx="25" ry="12" fill={avatar.hairColor} />
            <rect x="20" y="15" width="8" height="30" rx="4" fill={avatar.hairColor} />
            <rect x="72" y="15" width="8" height="30" rx="4" fill={avatar.hairColor} />
          </>
        )}
        {avatar.hairStyle === 3 && (
          <path d="M25 30 Q30 5 50 8 Q70 5 75 30 L75 20 Q50 -5 25 20 Z" fill={avatar.hairColor} />
        )}
        {avatar.faceStyle === 0 && (
          <>
            <circle cx="40" cy="28" r="3" fill="#1a1a1a" />
            <circle cx="60" cy="28" r="3" fill="#1a1a1a" />
            <path d="M40 38 Q50 45 60 38" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          </>
        )}
        {avatar.faceStyle === 1 && (
          <>
            <ellipse cx="40" cy="28" rx="4" ry="3" fill="#1a1a1a" />
            <ellipse cx="60" cy="28" rx="4" ry="3" fill="#1a1a1a" />
            <ellipse cx="50" cy="40" rx="5" ry="3" fill="#1a1a1a" />
          </>
        )}
        {avatar.faceStyle === 2 && (
          <>
            <line x1="35" y1="28" x2="45" y2="28" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
            <line x1="55" y1="28" x2="65" y2="28" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
            <line x1="42" y1="40" x2="58" y2="40" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {avatar.faceStyle === 3 && (
          <>
            <circle cx="40" cy="26" r="5" fill="white" stroke="#1a1a1a" strokeWidth="1" />
            <circle cx="60" cy="26" r="5" fill="white" stroke="#1a1a1a" strokeWidth="1" />
            <circle cx="41" cy="26" r="2" fill="#1a1a1a" />
            <circle cx="61" cy="26" r="2" fill="#1a1a1a" />
            <path d="M42 40 Q50 48 58 40" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          </>
        )}
        {avatar.accessory === 1 && (
          <ellipse cx="50" cy="8" rx="20" ry="8" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
        )}
        {avatar.accessory === 2 && (
          <>
            <rect x="20" y="5" width="60" height="15" rx="3" fill="#1f2937" />
            <rect x="25" y="0" width="50" height="10" rx="2" fill="#1f2937" />
          </>
        )}
        {avatar.accessory === 3 && (
          <>
            <rect x="32" y="22" width="36" height="8" rx="4" fill="#1f2937" opacity="0.8" />
            <circle cx="40" cy="26" r="6" fill="#06b6d4" opacity="0.5" />
            <circle cx="60" cy="26" r="6" fill="#06b6d4" opacity="0.5" />
          </>
        )}
      </svg>
    </div>
  );
}

function CoinCollectorGame({ avatar, onExit }: { avatar: Avatar; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const playerRef = useRef({ x: 200, y: 200 });
  const coinsRef = useRef<{ x: number; y: number; collected: boolean }[]>([]);
  const obstaclesRef = useRef<{ x: number; y: number; dx: number; dy: number }[]>([]);
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    coinsRef.current = Array.from({ length: 10 }, () => ({
      x: Math.random() * 360 + 20,
      y: Math.random() * 260 + 20,
      collected: false
    }));
    obstaclesRef.current = Array.from({ length: 3 }, () => ({
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 50,
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 4
    }));
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const gameLoop = () => {
      const keys = keysRef.current;
      const speed = 5;
      if (keys.has("arrowup") || keys.has("w")) playerRef.current.y = Math.max(15, playerRef.current.y - speed);
      if (keys.has("arrowdown") || keys.has("s")) playerRef.current.y = Math.min(285, playerRef.current.y + speed);
      if (keys.has("arrowleft") || keys.has("a")) playerRef.current.x = Math.max(15, playerRef.current.x - speed);
      if (keys.has("arrowright") || keys.has("d")) playerRef.current.x = Math.min(385, playerRef.current.x + speed);

      obstaclesRef.current.forEach(obs => {
        obs.x += obs.dx;
        obs.y += obs.dy;
        if (obs.x < 10 || obs.x > 390) obs.dx *= -1;
        if (obs.y < 10 || obs.y > 290) obs.dy *= -1;
        const dist = Math.hypot(playerRef.current.x - obs.x, playerRef.current.y - obs.y);
        if (dist < 25) setGameOver(true);
      });

      coinsRef.current.forEach(coin => {
        if (!coin.collected) {
          const dist = Math.hypot(playerRef.current.x - coin.x, playerRef.current.y - coin.y);
          if (dist < 20) {
            coin.collected = true;
            setScore(s => s + 10);
          }
        }
      });

      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, 400, 300);

      coinsRef.current.forEach(coin => {
        if (!coin.collected) {
          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffed4a";
          ctx.beginPath();
          ctx.arc(coin.x - 2, coin.y - 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      obstaclesRef.current.forEach(obs => {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 15, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = avatar.skinColor;
      ctx.beginPath();
      ctx.arc(playerRef.current.x, playerRef.current.y - 10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = avatar.shirtColor;
      ctx.fillRect(playerRef.current.x - 10, playerRef.current.y, 20, 15);
      ctx.fillStyle = avatar.pantsColor;
      ctx.fillRect(playerRef.current.x - 8, playerRef.current.y + 15, 6, 10);
      ctx.fillRect(playerRef.current.x + 2, playerRef.current.y + 15, 6, 10);

      animationId = requestAnimationFrame(gameLoop);
    };
    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameOver, avatar]);

  return (
    <div className="h-full bg-zinc-900 flex flex-col items-center justify-center p-4">
      <div className="flex justify-between w-[400px] mb-2 text-white">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
        <Button variant="ghost" size="sm" onClick={onExit}>Exit</Button>
      </div>
      <canvas ref={canvasRef} width={400} height={300} className="border-2 border-zinc-600 rounded-lg" />
      {gameOver && (
        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
          <p className="text-yellow-400 text-lg">Final Score: {score}</p>
          <Button className="mt-4" onClick={() => { setScore(0); setTimeLeft(30); setGameOver(false); playerRef.current = { x: 200, y: 200 }; coinsRef.current = Array.from({ length: 10 }, () => ({ x: Math.random() * 360 + 20, y: Math.random() * 260 + 20, collected: false })); }}>
            Play Again
          </Button>
        </div>
      )}
      {!gameOver && <p className="text-zinc-400 text-sm mt-2">Use Arrow Keys or WASD to move</p>}
    </div>
  );
}

function ObbyGame({ avatar, onExit }: { avatar: Avatar; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(1);
  const [won, setWon] = useState(false);
  const playerRef = useRef({ x: 50, y: 250, vy: 0, onGround: false });
  const keysRef = useRef<Set<string>>(new Set());

  const platforms = [
    { x: 0, y: 280, w: 100, h: 20 },
    { x: 120, y: 250, w: 80, h: 15 },
    { x: 220, y: 210, w: 60, h: 15 },
    { x: 300, y: 170, w: 70, h: 15 },
    { x: 200, y: 130, w: 60, h: 15 },
    { x: 100, y: 90, w: 80, h: 15 },
    { x: 200, y: 50, w: 100, h: 15 },
    { x: 320, y: 30, w: 80, h: 20, isGoal: true },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (won) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const gameLoop = () => {
      const keys = keysRef.current;
      const player = playerRef.current;
      
      if (keys.has("arrowleft") || keys.has("a")) player.x -= 4;
      if (keys.has("arrowright") || keys.has("d")) player.x += 4;
      if ((keys.has(" ") || keys.has("arrowup") || keys.has("w")) && player.onGround) {
        player.vy = -12;
        player.onGround = false;
      }

      player.vy += 0.6;
      player.y += player.vy;
      player.onGround = false;

      platforms.forEach(p => {
        if (player.x > p.x - 10 && player.x < p.x + p.w + 10 &&
            player.y > p.y - 25 && player.y < p.y + 5 && player.vy >= 0) {
          player.y = p.y - 25;
          player.vy = 0;
          player.onGround = true;
          if ((p as any).isGoal) setWon(true);
        }
      });

      if (player.y > 320) {
        player.x = 50;
        player.y = 250;
        player.vy = 0;
      }
      player.x = Math.max(10, Math.min(390, player.x));

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 400, 300);

      platforms.forEach(p => {
        ctx.fillStyle = (p as any).isGoal ? "#22c55e" : "#64748b";
        ctx.fillRect(p.x, p.y, p.w, p.h);
      });

      ctx.fillStyle = avatar.pantsColor;
      ctx.fillRect(player.x - 5, player.y + 10, 4, 8);
      ctx.fillRect(player.x + 1, player.y + 10, 4, 8);
      ctx.fillStyle = avatar.shirtColor;
      ctx.fillRect(player.x - 7, player.y, 14, 12);
      ctx.fillStyle = avatar.skinColor;
      ctx.beginPath();
      ctx.arc(player.x, player.y - 6, 8, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(gameLoop);
    };
    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [won, avatar]);

  return (
    <div className="h-full bg-zinc-900 flex flex-col items-center justify-center p-4">
      <div className="flex justify-between w-[400px] mb-2 text-white">
        <span>Level: {level}</span>
        <Button variant="ghost" size="sm" onClick={onExit}>Exit</Button>
      </div>
      <canvas ref={canvasRef} width={400} height={300} className="border-2 border-zinc-600 rounded-lg" />
      {won && (
        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-2">You Win!</h2>
          <p className="text-white">You reached the top!</p>
          <Button className="mt-4" onClick={() => { setWon(false); playerRef.current = { x: 50, y: 250, vy: 0, onGround: false }; }}>
            Play Again
          </Button>
        </div>
      )}
      {!won && <p className="text-zinc-400 text-sm mt-2">Arrow Keys/WASD to move, SPACE to jump</p>}
    </div>
  );
}

function BattleGame({ avatar, onExit }: { avatar: Avatar; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const playerRef = useRef({ x: 200, y: 150, attacking: false, attackTime: 0 });
  const enemiesRef = useRef<{ x: number; y: number; health: number; hit: boolean }[]>([]);
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    enemiesRef.current = [
      { x: 350, y: 100, health: 30, hit: false },
      { x: 350, y: 200, health: 30, hit: false },
      { x: 50, y: 250, health: 30, hit: false },
    ];
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const gameLoop = () => {
      const keys = keysRef.current;
      const player = playerRef.current;
      const speed = 4;

      if (keys.has("arrowup") || keys.has("w")) player.y = Math.max(20, player.y - speed);
      if (keys.has("arrowdown") || keys.has("s")) player.y = Math.min(280, player.y + speed);
      if (keys.has("arrowleft") || keys.has("a")) player.x = Math.max(20, player.x - speed);
      if (keys.has("arrowright") || keys.has("d")) player.x = Math.min(380, player.x + speed);
      
      if (keys.has(" ") && !player.attacking) {
        player.attacking = true;
        player.attackTime = 15;
        enemiesRef.current.forEach(enemy => {
          if (enemy.health > 0) {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < 50) {
              enemy.health -= 15;
              enemy.hit = true;
              setTimeout(() => { enemy.hit = false; }, 100);
              if (enemy.health <= 0) setScore(s => s + 100);
            }
          }
        });
      }

      if (player.attackTime > 0) player.attackTime--;
      else player.attacking = false;

      enemiesRef.current.forEach(enemy => {
        if (enemy.health > 0) {
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 30) {
            enemy.x += (dx / dist) * 1.5;
            enemy.y += (dy / dist) * 1.5;
          } else if (!player.attacking) {
            setHealth(h => {
              const newH = h - 0.5;
              if (newH <= 0) setGameOver(true);
              return Math.max(0, newH);
            });
          }
        }
      });

      if (enemiesRef.current.every(e => e.health <= 0)) {
        enemiesRef.current = [
          { x: Math.random() * 300 + 50, y: Math.random() * 200 + 50, health: 40, hit: false },
          { x: Math.random() * 300 + 50, y: Math.random() * 200 + 50, health: 40, hit: false },
          { x: Math.random() * 300 + 50, y: Math.random() * 200 + 50, health: 40, hit: false },
          { x: Math.random() * 300 + 50, y: Math.random() * 200 + 50, health: 40, hit: false },
        ];
      }

      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(0, 0, 400, 300);

      enemiesRef.current.forEach(enemy => {
        if (enemy.health > 0) {
          ctx.fillStyle = enemy.hit ? "#ffffff" : "#dc2626";
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(enemy.x - 15, enemy.y - 25, (enemy.health / 40) * 30, 4);
        }
      });

      ctx.fillStyle = avatar.pantsColor;
      ctx.fillRect(player.x - 5, player.y + 5, 4, 10);
      ctx.fillRect(player.x + 1, player.y + 5, 4, 10);
      ctx.fillStyle = avatar.shirtColor;
      ctx.fillRect(player.x - 8, player.y - 8, 16, 15);
      ctx.fillStyle = avatar.skinColor;
      ctx.beginPath();
      ctx.arc(player.x, player.y - 15, 10, 0, Math.PI * 2);
      ctx.fill();

      if (player.attacking) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 40, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(gameLoop);
    };
    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameOver, avatar]);

  return (
    <div className="h-full bg-zinc-900 flex flex-col items-center justify-center p-4">
      <div className="flex justify-between w-[400px] mb-2 text-white">
        <span>HP: {Math.round(health)}</span>
        <span>Score: {score}</span>
        <Button variant="ghost" size="sm" onClick={onExit}>Exit</Button>
      </div>
      <canvas ref={canvasRef} width={400} height={300} className="border-2 border-zinc-600 rounded-lg" />
      {gameOver && (
        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Game Over!</h2>
          <p className="text-yellow-400 text-lg">Final Score: {score}</p>
          <Button className="mt-4" onClick={() => { setHealth(100); setScore(0); setGameOver(false); playerRef.current = { x: 200, y: 150, attacking: false, attackTime: 0 }; enemiesRef.current = [{ x: 350, y: 100, health: 30, hit: false }, { x: 350, y: 200, health: 30, hit: false }, { x: 50, y: 250, health: 30, hit: false }]; }}>
            Play Again
          </Button>
        </div>
      )}
      {!gameOver && <p className="text-zinc-400 text-sm mt-2">Arrow Keys/WASD to move, SPACE to attack</p>}
    </div>
  );
}

export function RobloxApp() {
  const { data: user } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
  });

  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [robux, setRobux] = useState(1250);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<Avatar>(() => {
    const saved = localStorage.getItem("roblox_avatar");
    return saved ? JSON.parse(saved) : DEFAULT_AVATAR;
  });

  useEffect(() => {
    localStorage.setItem("roblox_avatar", JSON.stringify(avatar));
  }, [avatar]);

  const username = user?.firstName || user?.email?.split("@")[0] || "Player";

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const toggleFavorite = (gameId: string) => {
    setFavorites(prev => prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]);
  };

  if (playingGame) {
    if (playingGame.gameType === "collector") {
      return <CoinCollectorGame avatar={avatar} onExit={() => setPlayingGame(null)} />;
    }
    if (playingGame.gameType === "obby") {
      return <ObbyGame avatar={avatar} onExit={() => setPlayingGame(null)} />;
    }
    if (playingGame.gameType === "fighter") {
      return <BattleGame avatar={avatar} onExit={() => setPlayingGame(null)} />;
    }
  }

  if (selectedGame) {
    return (
      <div className="h-full bg-zinc-900 flex flex-col overflow-hidden" data-testid="roblox-game-details">
        <div className="h-40 relative" style={{ background: selectedGame.thumbnail }}>
          <Button variant="ghost" size="icon" className="absolute top-2 left-2 text-white bg-black/30 hover:bg-black/50" onClick={() => setSelectedGame(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white drop-shadow-lg">{selectedGame.name}</h1>
              {selectedGame.playable && <Badge className="bg-green-600">Playable</Badge>}
            </div>
            <p className="text-white/80 text-sm">By {selectedGame.creator}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-2">
            <Button 
              className={`flex-1 gap-2 ${selectedGame.playable ? "bg-green-600 hover:bg-green-700" : "bg-zinc-600"}`}
              onClick={() => selectedGame.playable && setPlayingGame(selectedGame)}
              disabled={!selectedGame.playable}
            >
              <Play className="w-5 h-5" />
              {selectedGame.playable ? "Play Now" : "Coming Soon"}
            </Button>
            <Button variant="outline" size="icon" className={favorites.includes(selectedGame.id) ? "text-red-500 border-red-500" : ""} onClick={() => toggleFavorite(selectedGame.id)}>
              <Heart className="w-5 h-5" fill={favorites.includes(selectedGame.id) ? "currentColor" : "none"} />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="text-green-400 font-bold">{formatNumber(selectedGame.playing)}</div>
              <div className="text-zinc-400 text-xs">Playing</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="text-white font-bold">{selectedGame.visits}</div>
              <div className="text-zinc-400 text-xs">Visits</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="text-white font-bold">{formatNumber(selectedGame.likes)}</div>
              <div className="text-zinc-400 text-xs">Likes</div>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">About</h3>
            <p className="text-zinc-400 text-sm">{selectedGame.description}</p>
            <Badge className="mt-2 bg-zinc-700">{selectedGame.category}</Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-900 flex flex-col" data-testid="roblox-app">
      <div className="bg-zinc-800 p-2 flex items-center gap-2 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-white font-bold hidden sm:inline">Roblox</span>
        </div>
        
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search experiences" className="pl-8 bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-400 h-8" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="text-yellow-400 hover:bg-zinc-700 gap-1 px-2" onClick={() => setActiveTab("robux")}>
            <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-zinc-900">R$</span>
            </div>
            <span className="text-sm">{robux.toLocaleString()}</span>
          </Button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center cursor-pointer" onClick={() => setActiveTab("avatar")}>
            <AvatarDisplay avatar={avatar} size={32} showShadow={false} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-16 bg-zinc-800 border-r border-zinc-700 flex flex-col items-center py-4 gap-2">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "discover", icon: Gamepad2, label: "Discover" },
            { id: "avatar", icon: User, label: "Avatar" },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${activeTab === item.id ? "bg-zinc-600 text-white" : "text-zinc-400 hover:bg-zinc-700 hover:text-white"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-4">
          {activeTab === "home" && (
            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Play className="w-5 h-5 text-green-400" />
                  <h2 className="text-white font-bold">Playable Games</h2>
                  <Badge className="bg-green-600 text-xs">NEW</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PLAYABLE_GAMES.map(game => (
                    <GameCard key={game.id} game={game} onClick={() => setSelectedGame(game)} isFavorite={favorites.includes(game.id)} />
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h2 className="text-white font-bold">Popular</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SHOWCASE_GAMES.map(game => (
                    <GameCard key={game.id} game={game} onClick={() => setSelectedGame(game)} isFavorite={favorites.includes(game.id)} />
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "discover" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_GAMES.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(game => (
                <GameCard key={game.id} game={game} onClick={() => setSelectedGame(game)} isFavorite={favorites.includes(game.id)} />
              ))}
            </div>
          )}

          {activeTab === "avatar" && (
            <div className="max-w-lg mx-auto">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-xl p-6">
                  <AvatarDisplay avatar={avatar} size={150} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2"><Palette className="w-4 h-4" /> Skin Color</h3>
                  <div className="flex gap-2 flex-wrap">
                    {SKIN_COLORS.map(color => (
                      <button key={color} onClick={() => setAvatar(a => ({ ...a, skinColor: color }))} className={`w-8 h-8 rounded-full border-2 ${avatar.skinColor === color ? "border-white" : "border-transparent"}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Hair Style</h3>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map(i => (
                      <button key={i} onClick={() => setAvatar(a => ({ ...a, hairStyle: i }))} className={`w-12 h-12 rounded-lg bg-zinc-700 flex items-center justify-center border-2 ${avatar.hairStyle === i ? "border-blue-500" : "border-transparent"}`}>
                        <span className="text-white text-xs">Style {i + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Hair Color</h3>
                  <div className="flex gap-2 flex-wrap">
                    {HAIR_COLORS.map(color => (
                      <button key={color} onClick={() => setAvatar(a => ({ ...a, hairColor: color }))} className={`w-8 h-8 rounded-full border-2 ${avatar.hairColor === color ? "border-white" : "border-transparent"}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Face</h3>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map(i => (
                      <button key={i} onClick={() => setAvatar(a => ({ ...a, faceStyle: i }))} className={`w-12 h-12 rounded-lg bg-zinc-700 flex items-center justify-center border-2 ${avatar.faceStyle === i ? "border-blue-500" : "border-transparent"}`}>
                        <span className="text-lg">{["😊", "😮", "😐", "🙂"][i]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Shirt Color</h3>
                  <div className="flex gap-2 flex-wrap">
                    {SHIRT_COLORS.map(color => (
                      <button key={color} onClick={() => setAvatar(a => ({ ...a, shirtColor: color }))} className={`w-8 h-8 rounded-full border-2 ${avatar.shirtColor === color ? "border-white" : "border-transparent"}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Pants Color</h3>
                  <div className="flex gap-2 flex-wrap">
                    {PANTS_COLORS.map(color => (
                      <button key={color} onClick={() => setAvatar(a => ({ ...a, pantsColor: color }))} className={`w-8 h-8 rounded-full border-2 ${avatar.pantsColor === color ? "border-white" : "border-transparent"}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Accessory</h3>
                  <div className="flex gap-2">
                    {["None", "Halo", "Top Hat", "Shades"].map((name, i) => (
                      <button key={i} onClick={() => setAvatar(a => ({ ...a, accessory: i }))} className={`px-3 py-2 rounded-lg bg-zinc-700 text-white text-sm border-2 ${avatar.accessory === i ? "border-blue-500" : "border-transparent"}`}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "robux" && (
            <div className="max-w-md mx-auto py-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-zinc-900">R$</span>
                </div>
                <h2 className="text-white text-2xl font-bold">{robux.toLocaleString()}</h2>
                <p className="text-zinc-400">Robux Balance</p>
              </div>
              
              <div className="space-y-3">
                {[
                  { amount: 400, price: "$4.99" },
                  { amount: 800, price: "$9.99" },
                  { amount: 1700, price: "$19.99" },
                ].map(tier => (
                  <button key={tier.amount} onClick={() => setRobux(prev => prev + tier.amount)} className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-lg p-4 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-zinc-900">R$</span>
                      </div>
                      <span className="text-white font-medium">{tier.amount.toLocaleString()} Robux</span>
                    </div>
                    <span className="text-yellow-400 font-bold">{tier.price}</span>
                  </button>
                ))}
              </div>
              <p className="text-zinc-500 text-xs text-center mt-4">Simulated - no real purchases</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function GameCard({ game, onClick, isFavorite }: { game: Game; onClick: () => void; isFavorite: boolean }) {
  return (
    <button onClick={onClick} className="group text-left bg-zinc-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all">
      <div className="aspect-video relative" style={{ background: game.thumbnail }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-10 h-10 text-white" />
        </div>
        {game.playable && <Badge className="absolute top-1 left-1 bg-green-600 text-[10px]">Playable</Badge>}
        {isFavorite && <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><Heart className="w-3 h-3 text-white" fill="currentColor" /></div>}
      </div>
      <div className="p-2">
        <h3 className="text-white text-sm font-medium truncate">{game.name}</h3>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span>{game.playing >= 1000 ? (game.playing / 1000).toFixed(0) + "K" : game.playing} playing</span>
        </div>
      </div>
    </button>
  );
}
