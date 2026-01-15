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
import { UpdatesApp } from "@/components/apps/UpdatesApp";
import { SnakeGame } from "@/components/apps/SnakeGame";
import { MinesweeperGame } from "@/components/apps/MinesweeperGame";
import { TerminalApp } from "@/components/apps/TerminalApp";
import { Power } from "lucide-react";

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
  updates: UpdatesApp,
  snake: SnakeGame,
  minesweeper: MinesweeperGame,
  terminal: TerminalApp,
};

export function Desktop() {
  const { settings, windows, showContextMenu, hideContextMenu, setStartMenuOpen, isPoweredOn, isShuttingDown, isStartingUp, startup } = useOS();

  const handleDesktopClick = () => {
    hideContextMenu();
    setStartMenuOpen(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      { label: "Refresh", action: () => window.location.reload() },
      { label: "Display Settings", action: () => {} },
      { label: "Personalize", action: () => {} },
    ]);
  };

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
