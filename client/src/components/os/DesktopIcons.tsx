import { useOS } from "@/lib/os-context";
import { 
  Globe, Settings, Folder, Calculator, FileText, CloudSun, Music, 
  Gamepad2, Bomb, Terminal, Trash2, HardDrive, Bell, MessageCircle, Store, Bug,
  Grid3X3, Spade, Paintbrush, Camera, Mail, Video
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
  bell: Bell,
  "message-circle": MessageCircle,
  store: Store,
  bug: Bug,
  "grid-3x3": Grid3X3,
  spade: Spade,
  paintbrush: Paintbrush,
  camera: Camera,
  mail: Mail,
  video: Video,
};

export function DesktopIcons() {
  const { apps, openWindow, settings, showContextMenu, desktopShortcuts, removeDesktopShortcut } = useOS();

  if (!settings.showDesktopIcons) return null;

  const updatesApp = apps.find(app => app.id === "updates");
  const chatApp = apps.find(app => app.id === "chat");
  const appStoreApp = apps.find(app => app.id === "appstore");
  const bugReportApp = apps.find(app => app.id === "bugreport");
  
  const customShortcutApps = desktopShortcuts
    .map(id => apps.find(app => app.id === id))
    .filter((app): app is typeof apps[0] => app !== undefined);
  
  const desktopApps = [
    ...apps.slice(0, 6),
    ...(updatesApp ? [updatesApp] : []),
    { id: "trash", name: "Trash", icon: "trash", color: "bg-gray-500", defaultWidth: 600, defaultHeight: 400 },
    ...(chatApp ? [chatApp] : []),
    ...customShortcutApps.filter(app => !apps.slice(0, 6).includes(app) && app.id !== "updates" && app.id !== "chat"),
  ];

  const handleContextMenu = (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      { label: "Open", action: () => openWindow(appId) },
      { label: "Properties", action: () => {} },
    ]);
  };

  return (
    <div className="absolute top-4 left-4 grid grid-rows-7 grid-flow-col gap-2 z-0" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      {desktopApps.map(app => {
        const Icon = app.icon === "trash" ? Trash2 : iconMap[app.icon] || Folder;
        return (
          <button
            key={app.id}
            onDoubleClick={() => openWindow(app.id)}
            onContextMenu={(e) => handleContextMenu(e, app.id)}
            className="w-20 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors group"
            data-testid={`desktop-icon-${app.id}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${app.iconImage ? '' : app.color} shadow-lg group-hover:scale-105 transition-transform overflow-hidden`}>
              {app.iconImage ? (
                <img src={app.iconImage} alt={app.name} className="w-full h-full object-cover" />
              ) : (
                <Icon className="w-6 h-6 text-white" />
              )}
            </div>
            <span className="text-[11px] text-white text-center leading-tight drop-shadow-lg truncate w-full">
              {app.name}
            </span>
          </button>
        );
      })}
      <button
        onDoubleClick={() => openWindow("files")}
        className="w-20 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors group"
        data-testid="desktop-icon-computer"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-600 shadow-lg group-hover:scale-105 transition-transform">
          <HardDrive className="w-6 h-6 text-white" />
        </div>
        <span className="text-[11px] text-white text-center leading-tight drop-shadow-lg">
          This PC
        </span>
      </button>
      {appStoreApp && (
        <button
          onDoubleClick={() => openWindow("appstore")}
          onContextMenu={(e) => handleContextMenu(e, "appstore")}
          className="w-20 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors group"
          data-testid="desktop-icon-appstore"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500 shadow-lg group-hover:scale-105 transition-transform">
            <Store className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] text-white text-center leading-tight drop-shadow-lg">
            App Store
          </span>
        </button>
      )}
      {bugReportApp && (
        <button
          onDoubleClick={() => openWindow("bugreport")}
          onContextMenu={(e) => handleContextMenu(e, "bugreport")}
          className="w-20 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors group"
          data-testid="desktop-icon-bugreport"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500 shadow-lg group-hover:scale-105 transition-transform">
            <Bug className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] text-white text-center leading-tight drop-shadow-lg">
            Report Bug
          </span>
        </button>
      )}
    </div>
  );
}
