import { useOS, type CustomAppInfo } from "@/lib/os-context";
import { Search, Power, User, Trash2, Package, Monitor } from "lucide-react";
import { 
  Globe, Settings, Folder, Calculator, FileText, CloudSun, Music, 
  Gamepad2, Bomb, Terminal, MessageSquare, Bell, Store, Bug,
  Grid3X3, Spade, Paintbrush, Camera, Mail, Video
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  "message-circle": MessageSquare,
  bell: Bell,
  store: Store,
  bug: Bug,
  "grid-3x3": Grid3X3,
  spade: Spade,
  paintbrush: Paintbrush,
  camera: Camera,
  mail: Mail,
  video: Video,
};

interface InstalledAppInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  externalUrl?: string;
  isSystemApp: boolean;
  iconImage?: string;
}

const externalApps: InstalledAppInfo[] = [
  {
    id: "youtube",
    name: "YouTube",
    icon: <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center"><div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5" /></div>,
    color: "bg-red-600",
    externalUrl: "https://www.youtube.com",
    isSystemApp: false,
  },
  {
    id: "coolmathgames",
    name: "CoolMathGames",
    icon: <img src="/assets/coolmathgames-logo.jpeg" alt="CoolMathGames" className="w-6 h-6 rounded object-cover" />,
    color: "bg-black",
    externalUrl: "https://www.coolmathgames.com/",
    isSystemApp: false,
  },
  {
    id: "geometry-lessons-monster",
    name: "Geometry Lessons Monster",
    icon: <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-teal-600 rounded flex items-center justify-center text-white font-bold text-xs">GL</div>,
    color: "bg-gradient-to-br from-green-500 to-teal-600",
    externalUrl: "https://geometry-lessons.monster/",
    isSystemApp: false,
  },
];

interface ContextMenuState {
  x: number;
  y: number;
  appId: string;
  appName: string;
  isSystemApp: boolean;
}

interface UserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
}

const APPS_PER_PAGE = 15;

export function StartMenu() {
  const { apps, openWindow, startMenuOpen, setStartMenuOpen, shutdown, installedApps, uninstallApp, desktopShortcuts, addDesktopShortcut, removeDesktopShortcut, customAppsInfo } = useOS();
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.email?.split('@')[0] || 'User';
  
  const initials = user?.firstName 
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  const installedCustomApps = customAppsInfo
    .filter(app => installedApps.includes(app.id))
    .map(app => ({
      id: app.id,
      name: app.name,
      icon: <img src={app.logoBase64} alt={app.name} className="w-6 h-6 rounded object-cover" />,
      color: "bg-gray-500",
      isSystemApp: false,
      externalUrl: app.externalUrl,
      iconImage: undefined as string | undefined,
    }));

  const allDisplayedApps = [
    ...apps.map(app => ({
      id: app.id,
      name: app.name,
      icon: app.icon,
      color: app.color,
      isSystemApp: true,
      externalUrl: undefined,
      iconImage: app.iconImage,
    })),
    ...externalApps.filter(app => installedApps.includes(app.id)),
    ...installedCustomApps,
  ];

  const filteredApps = allDisplayedApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredApps.length / APPS_PER_PAGE);
  const paginatedApps = searchQuery 
    ? filteredApps // Show all results when searching
    : filteredApps.slice(currentPage * APPS_PER_PAGE, (currentPage + 1) * APPS_PER_PAGE);
  
  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const handleAppClick = (app: typeof allDisplayedApps[0]) => {
    if (app.id.startsWith("custom-")) {
      openWindow(app.id);
    } else if (app.externalUrl) {
      openWindow("browser");
      localStorage.setItem("browser-navigate-url", app.externalUrl);
    } else {
      openWindow(app.id);
    }
    setStartMenuOpen(false);
  };

  const handleContextMenu = (e: React.MouseEvent, app: typeof allDisplayedApps[0]) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Position menu at mouse cursor
    const menuWidth = 180;
    const menuHeight = 120;
    let x = e.clientX;
    let y = e.clientY;
    
    // Check if menu would overflow right side of viewport
    if (x + menuWidth > window.innerWidth - 10) {
      x = x - menuWidth;
    }
    
    // Check if menu would overflow bottom of viewport
    if (y + menuHeight > window.innerHeight - 10) {
      y = y - menuHeight;
    }
    
    setContextMenu({ x, y, appId: app.id, appName: app.name, isSystemApp: app.isSystemApp });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleUninstall = () => {
    if (contextMenu) {
      uninstallApp(contextMenu.appId);
      closeContextMenu();
    }
  };

  const handleAddToDesktop = () => {
    if (contextMenu) {
      addDesktopShortcut(contextMenu.appId);
      closeContextMenu();
    }
  };

  const handleRemoveFromDesktop = () => {
    if (contextMenu) {
      removeDesktopShortcut(contextMenu.appId);
      closeContextMenu();
    }
  };

  const isOnDesktop = contextMenu ? desktopShortcuts.includes(contextMenu.appId) : false;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const taskbar = document.querySelector('[data-testid="btn-start-menu"]');
        if (!taskbar?.contains(e.target as Node)) {
          setStartMenuOpen(false);
          closeContextMenu();
        }
      }
    };

    if (startMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [startMenuOpen, setStartMenuOpen]);

  if (!startMenuOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bottom-14 left-1/2 -translate-x-1/2 w-[600px] rounded-xl overflow-hidden z-50 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-4 fade-in duration-200"
      style={{
        backgroundColor: "rgba(30, 30, 35, 0.95)",
        backdropFilter: "blur(20px)",
      }}
      onClick={closeContextMenu}
      data-testid="start-menu"
    >
      {contextMenu && (
        <div 
          className="fixed bg-card border border-border rounded-lg shadow-xl py-1 z-[60] min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
            {contextMenu.appName}
          </div>
          {isOnDesktop ? (
            <button
              onClick={handleRemoveFromDesktop}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors"
              data-testid="ctx-remove-desktop"
            >
              <Monitor className="w-4 h-4" />
              Remove from desktop
            </button>
          ) : (
            <button
              onClick={handleAddToDesktop}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors"
              data-testid="ctx-add-desktop"
            >
              <Monitor className="w-4 h-4" />
              Add to desktop
            </button>
          )}
          {!contextMenu.isSystemApp && (
            <button
              onClick={handleUninstall}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              data-testid="ctx-uninstall-start"
            >
              <Trash2 className="w-4 h-4" />
              Uninstall
            </button>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 text-sm"
            autoFocus
            data-testid="input-search-apps"
          />
        </div>
      </div>

      {/* Apps Grid */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide">All Apps</h3>
          {!searchQuery && totalPages > 1 && (
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentPage === i 
                      ? 'bg-white w-4' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  data-testid={`page-indicator-${i}`}
                  title={`Page ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {paginatedApps.map(app => {
            const isExternal = 'externalUrl' in app && app.externalUrl;
            const IconComponent = typeof app.icon === 'string' ? iconMap[app.icon] || Globe : null;
            
            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app)}
                onContextMenu={(e) => handleContextMenu(e, app)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors group relative"
                data-testid={`start-app-${app.id}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${app.iconImage ? '' : app.color} shadow-lg group-hover:scale-105 transition-transform overflow-hidden`}>
                  {app.iconImage ? (
                    <img src={app.iconImage} alt={app.name} className="w-full h-full object-cover rounded-xl" />
                  ) : IconComponent ? (
                    <IconComponent className="w-6 h-6 text-white" />
                  ) : (
                    app.icon
                  )}
                </div>
                <span className="text-xs text-white/80 text-center truncate w-full">{app.name}</span>
                {!app.isSystemApp && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-400" title="Installed App" />
                )}
              </button>
            );
          })}
        </div>

        {paginatedApps.length === 0 && (
          <div className="text-center py-8 text-white/40">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No apps found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 flex items-center justify-between">
        <button 
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => {
            openWindow("settings");
            setStartMenuOpen(false);
          }}
          data-testid="btn-user-profile"
        >
          <Avatar className="w-8 h-8">
            {user?.profileImageUrl ? (
              <AvatarImage src={user.profileImageUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-white/80">{displayName}</span>
        </button>
        <button 
          onClick={shutdown}
          className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-white/60 hover:text-red-400"
          data-testid="btn-power"
          title="Shutdown"
        >
          <Power className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
