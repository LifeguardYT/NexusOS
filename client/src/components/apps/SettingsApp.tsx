import { useState } from "react";
import { useOS } from "@/lib/os-context";
import { 
  Palette, Monitor, Volume2, Wifi, Bell, User, Lock, Info, 
  Sun, Moon, ChevronRight, Check
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type SettingsSection = "appearance" | "display" | "sound" | "network" | "notifications" | "accounts" | "privacy" | "about";

const sections: { id: SettingsSection; name: string; icon: React.ComponentType<any> }[] = [
  { id: "appearance", name: "Appearance", icon: Palette },
  { id: "display", name: "Display", icon: Monitor },
  { id: "sound", name: "Sound", icon: Volume2 },
  { id: "network", name: "Network", icon: Wifi },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "accounts", name: "Accounts", icon: User },
  { id: "privacy", name: "Privacy", icon: Lock },
  { id: "about", name: "About", icon: Info },
];

const wallpapers = [
  { id: "gradient-1", name: "Ocean Breeze", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { id: "gradient-2", name: "Sunset Glow", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { id: "gradient-3", name: "Forest Dawn", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { id: "gradient-4", name: "Purple Haze", gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
  { id: "gradient-5", name: "Dark Matter", gradient: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)" },
  { id: "gradient-6", name: "Aurora", gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
];

const accentColors = [
  { id: "blue", name: "Blue", color: "#3b82f6" },
  { id: "purple", name: "Purple", color: "#8b5cf6" },
  { id: "pink", name: "Pink", color: "#ec4899" },
  { id: "red", name: "Red", color: "#ef4444" },
  { id: "orange", name: "Orange", color: "#f97316" },
  { id: "green", name: "Green", color: "#22c55e" },
  { id: "teal", name: "Teal", color: "#14b8a6" },
];

export function SettingsApp() {
  const { settings, updateSettings } = useOS();
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");

  const renderContent = () => {
    switch (activeSection) {
      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Theme</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => updateSettings({ theme: "light" })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    settings.theme === "light" ? "border-blue-500 bg-blue-500/10" : "border-transparent bg-white/5 hover:bg-white/10"
                  }`}
                  data-testid="btn-theme-light"
                >
                  <div className="w-20 h-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <Sun className="w-6 h-6 text-yellow-500" />
                  </div>
                  <span className="text-sm">Light</span>
                  {settings.theme === "light" && <Check className="w-4 h-4 text-blue-500" />}
                </button>
                <button
                  onClick={() => updateSettings({ theme: "dark" })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    settings.theme === "dark" ? "border-blue-500 bg-blue-500/10" : "border-transparent bg-white/5 hover:bg-white/10"
                  }`}
                  data-testid="btn-theme-dark"
                >
                  <div className="w-20 h-14 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center">
                    <Moon className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm">Dark</span>
                  {settings.theme === "dark" && <Check className="w-4 h-4 text-blue-500" />}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Wallpaper</h3>
              <div className="grid grid-cols-3 gap-3">
                {wallpapers.map(wp => (
                  <button
                    key={wp.id}
                    onClick={() => updateSettings({ wallpaper: wp.id })}
                    className={`relative h-24 rounded-xl overflow-hidden border-2 transition-all ${
                      settings.wallpaper === wp.id ? "border-blue-500 ring-2 ring-blue-500/30" : "border-transparent hover:border-white/20"
                    }`}
                    style={{ background: wp.gradient }}
                    data-testid={`wallpaper-${wp.id}`}
                  >
                    {settings.wallpaper === wp.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 text-xs text-white drop-shadow-lg">{wp.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Accent Color</h3>
              <div className="flex gap-3">
                {accentColors.map(color => (
                  <button
                    key={color.id}
                    onClick={() => updateSettings({ accentColor: color.id })}
                    className={`w-10 h-10 rounded-full transition-all ${
                      settings.accentColor === color.id ? "ring-2 ring-offset-2 ring-offset-background ring-white" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                    data-testid={`accent-${color.id}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-white/10">
              <div>
                <h4 className="font-medium">Show Desktop Icons</h4>
                <p className="text-sm text-muted-foreground">Display app shortcuts on desktop</p>
              </div>
              <Switch
                checked={settings.showDesktopIcons}
                onCheckedChange={(checked) => updateSettings({ showDesktopIcons: checked })}
                data-testid="switch-desktop-icons"
              />
            </div>
          </div>
        );

      case "display":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Brightness</h3>
              <div className="flex items-center gap-4">
                <Sun className="w-5 h-5 text-muted-foreground" />
                <Slider
                  value={[settings.brightness]}
                  onValueChange={([value]) => updateSettings({ brightness: value })}
                  max={100}
                  step={1}
                  className="flex-1"
                  data-testid="slider-brightness"
                />
                <span className="text-sm w-10 text-right">{settings.brightness}%</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Font Size</h3>
              <div className="flex gap-3">
                {(["small", "medium", "large"] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => updateSettings({ fontSize: size })}
                    className={`px-4 py-2 rounded-lg capitalize transition-all ${
                      settings.fontSize === size ? "bg-blue-500 text-white" : "bg-white/5 hover:bg-white/10"
                    }`}
                    data-testid={`font-size-${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "sound":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Volume</h3>
              <div className="flex items-center gap-4">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <Slider
                  value={[settings.volume]}
                  onValueChange={([value]) => updateSettings({ volume: value })}
                  max={100}
                  step={1}
                  className="flex-1"
                  data-testid="slider-volume"
                />
                <span className="text-sm w-10 text-right">{settings.volume}%</span>
              </div>
            </div>
          </div>
        );

      case "network":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="font-medium">Wi-Fi</h4>
                  <p className="text-sm text-muted-foreground">Connected to network</p>
                </div>
              </div>
              <Switch
                checked={settings.wifi}
                onCheckedChange={(checked) => updateSettings({ wifi: checked })}
                data-testid="switch-wifi"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">B</span>
                </div>
                <div>
                  <h4 className="font-medium">Bluetooth</h4>
                  <p className="text-sm text-muted-foreground">{settings.bluetooth ? "On" : "Off"}</p>
                </div>
              </div>
              <Switch
                checked={settings.bluetooth}
                onCheckedChange={(checked) => updateSettings({ bluetooth: checked })}
                data-testid="switch-bluetooth"
              />
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="font-medium">Notifications</h4>
                <p className="text-sm text-muted-foreground">Show system notifications</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSettings({ notifications: checked })}
                data-testid="switch-notifications"
              />
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">N</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">NexusOS</h2>
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-muted-foreground">Device</span>
                <span>Web Browser</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-muted-foreground">Platform</span>
                <span>{navigator.platform}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-muted-foreground">Language</span>
                <span>{navigator.language}</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Settings coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-60 border-r border-border bg-muted/30 p-2">
        <div className="space-y-1">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSection === section.id 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-white/5 text-foreground/70"
                }`}
                data-testid={`settings-nav-${section.id}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{section.name}</span>
                <ChevronRight className={`w-4 h-4 ml-auto transition-opacity ${
                  activeSection === section.id ? "opacity-100" : "opacity-0"
                }`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-6 capitalize">{activeSection}</h2>
        {renderContent()}
      </div>
    </div>
  );
}
