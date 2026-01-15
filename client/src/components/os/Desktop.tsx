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
import { SnakeGame } from "@/components/apps/SnakeGame";
import { MinesweeperGame } from "@/components/apps/MinesweeperGame";
import { TerminalApp } from "@/components/apps/TerminalApp";

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
  snake: SnakeGame,
  minesweeper: MinesweeperGame,
  terminal: TerminalApp,
};

export function Desktop() {
  const { settings, windows, showContextMenu, hideContextMenu, setStartMenuOpen } = useOS();

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

  return (
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
  );
}
