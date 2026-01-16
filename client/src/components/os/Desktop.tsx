import { useOS } from "@/lib/os-context";
import { Window } from "./Window";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { DesktopIcons } from "./DesktopIcons";
import { ContextMenu } from "./ContextMenu";
import { BrowserApp } from "@/components/apps/BrowserApp";
import { SettingsApp } from "@/components/apps/SettingsApp";
import { CalculatorApp } from "@/components/apps/CalculatorApp";
import { NotesApp } from "@/components/apps/NotesApp";
import { FilesApp } from "@/components/apps/FilesApp";
import { WeatherApp } from "@/components/apps/WeatherApp";
import { MusicApp } from "@/components/apps/MusicApp";
import { ChatApp } from "@/components/apps/ChatApp";
import { UpdatesApp } from "@/components/apps/UpdatesApp";
import { SnakeGame } from "@/components/apps/SnakeGame";
import { MinesweeperGame } from "@/components/apps/MinesweeperGame";
import { TerminalApp } from "@/components/apps/TerminalApp";
import AppStoreApp from "@/components/apps/AppStoreApp";
import { Power, Lock } from "lucide-react";
import { useState } from "react";

const wallpapers: Record<string, string> = {
  "gradient-1": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "gradient-2": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "gradient-3": "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "gradient-4": "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "gradient-5": "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
  "gradient-6": "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
};

const appComponents: Record<string, React.ComponentType> = {
  browser: BrowserApp,
  settings: SettingsApp,
  calculator: CalculatorApp,
  notes: NotesApp,
  files: FilesApp,
  weather: WeatherApp,
  music: MusicApp,
  chat: ChatApp,
  updates: UpdatesApp,
  snake: SnakeGame,
  minesweeper: MinesweeperGame,
  terminal: TerminalApp,
  appstore: AppStoreApp,
};

export function Desktop() {
  const { settings, windows, showContextMenu, hideContextMenu, setStartMenuOpen, isPoweredOn, isShuttingDown, isStartingUp, isLocked, startup, unlock, security, openWindow } = useOS();
  const [lockInput, setLockInput] = useState("");
  const [lockError, setLockError] = useState(false);

  const handleDesktopClick = () => {
    hideContextMenu();
    setStartMenuOpen(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      { label: "Refresh", action: () => window.location.reload() },
      { label: "Display Settings", action: () => {
        openWindow("settings");
        hideContextMenu();
      }},
      { label: "Personalize", action: () => {
        openWindow("settings");
        hideContextMenu();
      }},
    ]);
  };

  const handleUnlock = () => {
    if (unlock(lockInput)) {
      setLockInput("");
      setLockError(false);
    } else {
      setLockError(true);
      setLockInput("");
    }
  };

  // Lock screen
  if (isLocked && isPoweredOn && !isStartingUp) {
    const isPinMode = security.pin && !security.password;
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center select-none"
        style={{ 
          background: wallpapers[settings.wallpaper] || wallpapers["gradient-1"],
        }}
        data-testid="lock-screen"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
        <div className="relative z-10 flex flex-col items-center gap-6 p-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
            <Lock className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white">NexusOS</h2>
          <p className="text-white/70">Enter your {isPinMode ? "PIN" : "password"} to unlock</p>
          
          <div className="flex flex-col items-center gap-3">
            <input
              type={isPinMode ? "text" : "password"}
              value={lockInput}
              onChange={(e) => {
                if (isPinMode) {
                  // Only allow numbers for PIN
                  const val = e.target.value.replace(/\D/g, '');
                  setLockInput(val);
                } else {
                  setLockInput(e.target.value);
                }
                setLockError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder={isPinMode ? "Enter PIN" : "Enter password"}
              className={`w-64 px-4 py-3 rounded-lg bg-white/10 border ${lockError ? 'border-red-500' : 'border-white/20'} text-white placeholder-white/50 text-center focus:outline-none focus:border-blue-500`}
              data-testid="input-lock"
              autoFocus
            />
            {lockError && (
              <p className="text-red-400 text-sm">Incorrect {isPinMode ? "PIN" : "password"}</p>
            )}
            <button
              onClick={handleUnlock}
              className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              data-testid="btn-unlock"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Shutdown screen
  if (!isPoweredOn) {
    return (
      <div 
        className="fixed inset-0 bg-black flex flex-col items-center justify-center select-none animate-fade-in"
        data-testid="shutdown-screen"
      >
        <button
          onClick={startup}
          className="group flex flex-col items-center gap-6 p-8 rounded-2xl transition-all hover:bg-white/5"
          data-testid="btn-startup"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform animate-pulse-slow">
            <Power className="w-12 h-12 text-white" />
          </div>
          <span className="text-xl font-semibold text-white/90 group-hover:text-white transition-colors">
            Startup NexusOS
          </span>
        </button>
        <p className="absolute bottom-8 text-sm text-white/30">
          Press the button to start
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Shutdown animation overlay */}
      {isShuttingDown && (
        <div 
          className="fixed inset-0 bg-black z-[9999] pointer-events-none animate-shutdown"
          data-testid="shutdown-animation"
        />
      )}
      
      {/* Startup animation overlay */}
      {isStartingUp && (
        <div 
          className="fixed inset-0 bg-black z-[9999] pointer-events-none flex items-center justify-center animate-startup"
          data-testid="startup-animation"
        >
          <div className="flex flex-col items-center gap-4 animate-boot-logo">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <span className="text-3xl font-bold text-white">N</span>
            </div>
            <span className="text-lg font-medium text-white">NexusOS</span>
            <div className="flex gap-1 mt-2">
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    <div 
      className="fixed inset-0 overflow-hidden select-none"
      style={{ 
        background: wallpapers[settings.wallpaper] || wallpapers["gradient-1"],
        filter: `brightness(${settings.brightness}%)`,
      }}
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
      data-testid="desktop"
    >
      {/* NexusOS Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[12rem] font-bold text-white/10 tracking-wider">
          NexusOS
        </span>
      </div>

      {/* Desktop Icons */}
      <DesktopIcons />

      {/* Windows */}
      {windows.map(win => {
        const AppComponent = appComponents[win.appId];
        if (!AppComponent) return null;
        
        return (
          <Window key={win.id} window={win}>
            <AppComponent />
          </Window>
        );
      })}

      {/* Start Menu */}
      <StartMenu />

      {/* Taskbar */}
      <Taskbar />

      {/* Context Menu */}
      <ContextMenu />
    </div>
    </>
  );
}
