import { useState, useEffect } from "react";
import { AlertTriangle, Power } from "lucide-react";

interface ShutdownStatus {
  isShutdown: boolean;
  isShuttingDown: boolean;
  shutdownTime: number | null;
  message: string;
}

interface ShutdownOverlayProps {
  isAdmin: boolean;
}

export function ShutdownOverlay({ isAdmin }: ShutdownOverlayProps) {
  const [shutdownStatus, setShutdownStatus] = useState<ShutdownStatus>({
    isShutdown: false,
    isShuttingDown: false,
    shutdownTime: null,
    message: "",
  });
  const [countdown, setCountdown] = useState<number | null>(null);

  const fetchShutdownStatus = async () => {
    try {
      const response = await fetch("/api/shutdown/status");
      if (response.ok) {
        const data = await response.json();
        setShutdownStatus({
          isShutdown: data.isShutdown,
          isShuttingDown: data.isShuttingDown,
          shutdownTime: data.shutdownTime,
          message: data.message,
        });
      }
    } catch (e) {
      console.error("Failed to fetch shutdown status:", e);
    }
  };

  useEffect(() => {
    fetchShutdownStatus();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      fetchShutdownStatus();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "shutdown_status") {
          setShutdownStatus({
            isShutdown: data.isShutdown,
            isShuttingDown: data.isShuttingDown,
            shutdownTime: data.shutdownTime,
            message: data.message,
          });
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      fetchShutdownStatus();
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (shutdownStatus.isShuttingDown && shutdownStatus.shutdownTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((shutdownStatus.shutdownTime! - Date.now()) / 1000));
        setCountdown(remaining);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [shutdownStatus.isShuttingDown, shutdownStatus.shutdownTime]);

  if (shutdownStatus.isShutdown && !isAdmin) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none"
        data-testid="shutdown-screen"
      >
        <Power className="w-24 h-24 text-white/30 mb-8" />
        <h1 className="text-3xl font-bold text-white mb-4">{shutdownStatus.message}</h1>
        <p className="text-white/60 text-lg">Please contact your system administrator.</p>
      </div>
    );
  }

  if (shutdownStatus.isShuttingDown) {
    return (
      <div 
        className="fixed inset-0 z-[9998] pointer-events-none flex items-start justify-center pt-8"
        data-testid="shutdown-warning"
      >
        <div className="bg-red-600/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 animate-pulse">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <p className="font-bold text-lg">{shutdownStatus.message}</p>
            {countdown !== null && (
              <p className="text-sm opacity-90">System will shutdown in {countdown} seconds</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
