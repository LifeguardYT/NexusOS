import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";

interface Lap {
  number: number;
  time: number;
  split: number;
}

export function StopwatchApp() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTime(accumulatedRef.current + (Date.now() - startTimeRef.current));
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        accumulatedRef.current = time;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    accumulatedRef.current = 0;
  };

  const handleLap = () => {
    if (!isRunning) return;
    
    const lastLapTime = laps.length > 0 ? laps[0].time : 0;
    const split = time - lastLapTime;
    
    setLaps(prev => [{
      number: prev.length + 1,
      time,
      split,
    }, ...prev]);
  };

  const getBestWorst = () => {
    if (laps.length < 2) return { best: -1, worst: -1 };
    const splits = laps.map(l => l.split);
    return {
      best: Math.min(...splits),
      worst: Math.max(...splits),
    };
  };

  const { best, worst } = getBestWorst();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black p-6" data-testid="stopwatch-app">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-7xl font-mono font-bold text-white mb-8 tabular-nums">
          {formatTime(time)}
        </div>

        <div className="flex gap-4">
          <Button
            size="lg"
            variant={isRunning ? "destructive" : "default"}
            onClick={handleStartStop}
            className="w-32 h-16 text-lg"
            data-testid="button-start-stop"
          >
            {isRunning ? (
              <>
                <Pause className="w-6 h-6 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-6 h-6 mr-2" />
                Start
              </>
            )}
          </Button>

          {time > 0 && !isRunning && (
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              className="w-32 h-16 text-lg"
              data-testid="button-reset"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Reset
            </Button>
          )}

          {isRunning && (
            <Button
              size="lg"
              variant="secondary"
              onClick={handleLap}
              className="w-32 h-16 text-lg"
              data-testid="button-lap"
            >
              <Flag className="w-6 h-6 mr-2" />
              Lap
            </Button>
          )}
        </div>
      </div>

      {laps.length > 0 && (
        <div className="h-64 overflow-y-auto mt-6">
          <table className="w-full">
            <thead className="text-gray-400 text-sm sticky top-0 bg-gray-900">
              <tr>
                <th className="text-left py-2 px-4">Lap</th>
                <th className="text-right py-2 px-4">Lap Time</th>
                <th className="text-right py-2 px-4">Total Time</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((lap, index) => (
                <tr
                  key={lap.number}
                  className={`text-white border-t border-gray-800 ${
                    lap.split === best ? "text-green-400" : 
                    lap.split === worst ? "text-red-400" : ""
                  }`}
                  data-testid={`lap-${lap.number}`}
                >
                  <td className="py-2 px-4">Lap {lap.number}</td>
                  <td className="text-right py-2 px-4 font-mono">{formatTime(lap.split)}</td>
                  <td className="text-right py-2 px-4 font-mono">{formatTime(lap.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
