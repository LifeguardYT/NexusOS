import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Plus, Minus, Bell } from "lucide-react";

const PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "25 min", seconds: 1500 },
  { label: "30 min", seconds: 1800 },
];

export function TimerApp() {
  const [initialTime, setInitialTime] = useState(300);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const playAlarm = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    
    let count = 0;
    const beep = setInterval(() => {
      count++;
      gainNode.gain.value = count % 2 === 0 ? 0.3 : 0;
      if (count >= 10) {
        clearInterval(beep);
        oscillator.stop();
      }
    }, 300);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const adjustTime = (amount: number) => {
    if (isRunning) return;
    const newTime = Math.max(0, Math.min(35999, initialTime + amount));
    setInitialTime(newTime);
    setTimeLeft(newTime);
    setIsComplete(false);
  };

  const setPreset = (seconds: number) => {
    if (isRunning) return;
    setInitialTime(seconds);
    setTimeLeft(seconds);
    setIsComplete(false);
  };

  const handleStartStop = () => {
    if (timeLeft === 0) return;
    setIsRunning(!isRunning);
    setIsComplete(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialTime);
    setIsComplete(false);
  };

  const progress = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 to-purple-900 p-6" data-testid="timer-app">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-64 h-64 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isComplete ? "#ef4444" : "#22c55e"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} 283`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-mono font-bold ${isComplete ? "text-red-400 animate-pulse" : "text-white"}`}>
              {formatTime(timeLeft)}
            </div>
            {isComplete && (
              <div className="flex items-center gap-2 text-red-400 mt-2">
                <Bell className="w-5 h-5" />
                <span>Time's up!</span>
              </div>
            )}
          </div>
        </div>

        {!isRunning && (
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustTime(-60)}
              disabled={isRunning}
              data-testid="button-minus-minute"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm">1 min</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustTime(60)}
              disabled={isRunning}
              data-testid="button-plus-minute"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <Button
            size="lg"
            variant={isRunning ? "destructive" : "default"}
            onClick={handleStartStop}
            disabled={timeLeft === 0 && !isComplete}
            className="w-32 h-14 text-lg"
            data-testid="button-start-stop"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={handleReset}
            className="h-14"
            data-testid="button-reset"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>

        {!isRunning && (
          <div className="flex flex-wrap gap-2 justify-center">
            {PRESETS.map(preset => (
              <Button
                key={preset.seconds}
                variant="secondary"
                size="sm"
                onClick={() => setPreset(preset.seconds)}
                className={initialTime === preset.seconds ? "ring-2 ring-white" : ""}
                data-testid={`preset-${preset.seconds}`}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
