import { useOS } from "@/lib/os-context";
import { useAuth } from "@/hooks/use-auth";
import { 
  Globe, Settings, Folder, Calculator, FileText, CloudSun, Music, 
  Gamepad2, Bomb, Terminal, Wifi, WifiOff, Volume2, VolumeX, 
  Battery, BatteryCharging, LayoutGrid, LogIn, LogOut, User
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  globe: Globe,
  settings: Settings,
  folder: Folder,
  calculator: Calculator,
  "file-text": FileText,
  "cloud-sun": CloudSun,
  music: Music,
  "gamepad-2": Gamepad2,
  bomb: Bomb,
  terminal: Terminal,
};

export function Taskbar() {
  const { apps, windows, openWindow, focusWindow, minimizeWindow, startMenuOpen, setStartMenuOpen, currentTime, settings } = useOS();
  const { user, isAuthenticated, isLoading } = useAuth();

  const runningApps = apps.filter(app => windows.some(w => w.appId === app.id));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 h-12 flex items-center justify-between px-2 z-50"
      style={{
        backgroundColor: "rgba(20, 20, 25, 0.85)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Start Button */}
      <button
        onClick={(e) => { e.stopPropagation(); setStartMenuOpen(!startMenuOpen); }}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
          startMenuOpen ? "bg-white/20" : "hover:bg-white/10"
        }`}
        data-testid="btn-start-menu"
      >
        <LayoutGrid className="w-5 h-5 text-white" />
      </button>

      {/* Center - Running Apps */}
      <div className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {runningApps.map(app => {
          const Icon = iconMap[app.icon] || Globe;
          const appWindow = windows.find(w => w.appId === app.id);
          const isMinimized = appWindow?.isMinimized;
          const isFocused = appWindow && !isMinimized && appWindow.zIndex === Math.max(...windows.filter(w => !w.isMinimized).map(w => w.zIndex));

          return (
            <button
              key={app.id}
              onClick={() => {
                if (isMinimized) {
                  openWindow(app.id);
                } else if (isFocused) {
                  minimizeWindow(appWindow!.id);
                } else {
                  focusWindow(appWindow!.id);
                }
              }}
              className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center transition-all relative group ${
                isFocused ? "bg-white/20" : "hover:bg-white/10"
              }`}
              data-testid={`taskbar-app-${app.id}`}
            >
              <div className={`w-9 h-9 rounded-md flex items-center justify-center ${app.iconImage ? '' : app.color} overflow-hidden`}>
                {app.iconImage ? (
                  <img src={app.iconImage} alt={app.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon className="w-5 h-5 text-white" />
                )}
              </div>
              {/* Active indicator */}
              <div className={`absolute bottom-0.5 h-0.5 rounded-full transition-all ${
                isFocused ? "w-4 bg-blue-400" : "w-1.5 bg-white/50"
              }`} />
              {/* App name tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {app.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Right - System Tray */}
      <div className="flex items-center gap-3">
        {/* User/Login Button */}
        {isLoading ? null : isAuthenticated ? (
          <button
            onClick={() => window.location.href = "/api/logout"}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors group"
            data-testid="btn-logout"
          >
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <User className="w-4 h-4 text-white/70" />
            )}
            <span className="text-xs text-white/70 group-hover:text-white">{user?.firstName || "User"}</span>
            <LogOut className="w-3 h-3 text-white/50" />
          </button>
        ) : (
          <button
            onClick={() => window.location.href = "/api/login"}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-colors"
            data-testid="btn-login"
          >
            <LogIn className="w-4 h-4 text-white" />
            <span className="text-xs text-white font-medium">Login</span>
          </button>
        )}
        <div className="flex items-center gap-2 px-2">
          {settings.wifi ? (
            <Wifi className="w-4 h-4 text-white/70" />
          ) : (
            <WifiOff className="w-4 h-4 text-white/40" />
          )}
          {settings.volume > 0 ? (
            <Volume2 className="w-4 h-4 text-white/70" />
          ) : (
            <VolumeX className="w-4 h-4 text-white/40" />
          )}
          <BatteryCharging className="w-4 h-4 text-green-400" />
        </div>
        <div className="text-right px-2">
          <div className="text-xs font-medium text-white">{formatTime(currentTime)}</div>
          <div className="text-[10px] text-white/60">{formatDate(currentTime)}</div>
        </div>
      </div>
    </div>
  );
}
