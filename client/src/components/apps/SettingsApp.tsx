import { useState } from "react";
import { useOS } from "@/lib/os-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Palette, Monitor, Volume2, Wifi, Bell, User, Lock, Info, 
  Sun, Moon, ChevronRight, Check, Shield, Code, Users, Activity,
  Cpu, HardDrive, Clock, RefreshCw
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type SettingsSection = "appearance" | "display" | "sound" | "network" | "notifications" | "accounts" | "about" | "admin" | "developer";

interface SectionItem {
  id: SettingsSection;
  name: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
}

const sections: SectionItem[] = [
  { id: "appearance", name: "Appearance", icon: Palette },
  { id: "display", name: "Display", icon: Monitor },
  { id: "sound", name: "Sound", icon: Volume2 },
  { id: "network", name: "Network", icon: Wifi },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "accounts", name: "Accounts", icon: User },
  { id: "about", name: "About", icon: Info },
  { id: "admin", name: "Admin", icon: Shield, adminOnly: true },
  { id: "developer", name: "Developer", icon: Code, adminOnly: true },
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

interface AdminStatus {
  isAdmin: boolean;
  userId?: string;
}

interface SystemDiagnostics {
  system: {
    platform: string;
    arch: string;
    hostname: string;
    uptime: number;
    nodeVersion: string;
  };
  memory: {
    total: number;
    free: number;
    used: number;
  };
  cpu: {
    cores: number;
    model: string;
  };
  process: {
    pid: number;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    uptime: number;
  };
}

interface UserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  profileImageUrl?: string | null;
}

interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

export function SettingsApp() {
  const { settings, updateSettings } = useOS();
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");

  const { data: currentUser } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
  });

  const { data: adminStatus } = useQuery<AdminStatus>({
    queryKey: ["/api/admin/status"],
  });

  const { data: users, refetch: refetchUsers } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
    enabled: adminStatus?.isAdmin === true,
  });

  const { data: diagnostics, refetch: refetchDiagnostics } = useQuery<SystemDiagnostics>({
    queryKey: ["/api/admin/diagnostics"],
    enabled: adminStatus?.isAdmin === true,
  });

  const isAdmin = adminStatus?.isAdmin === true;

  const devModeMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("POST", "/api/admin/dev-mode", { enabled });
      if (!res.ok) {
        throw new Error("Failed to update developer mode");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: () => {
      // Revert on error - refetch settings to get correct state
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  const handleDevModeToggle = (checked: boolean) => {
    devModeMutation.mutate(checked);
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

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

      case "accounts":
        const displayName = currentUser 
          ? `${currentUser.firstName || ''}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`.trim() || currentUser.email
          : "Guest User";
        const userInitial = currentUser 
          ? (currentUser.firstName?.[0] || currentUser.email[0]).toUpperCase()
          : "G";
        
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              {currentUser?.profileImageUrl ? (
                <img 
                  src={currentUser.profileImageUrl} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover"
                  data-testid="img-profile"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{userInitial}</span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold" data-testid="text-username">{displayName}</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-signin-status">
                  {currentUser ? "Signed in" : "Not signed in"}
                </p>
                {currentUser && (
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wider">Account Settings</h4>
              
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Profile</h4>
                    <p className="text-sm text-muted-foreground">Manage your profile information</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Sign-in Options</h4>
                    <p className="text-sm text-muted-foreground">Password, PIN, and security keys</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Family & Other Users</h4>
                    <p className="text-sm text-muted-foreground">Add or manage other accounts</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Sync Settings</h4>
                    <p className="text-sm text-muted-foreground">Sync your settings across devices</p>
                  </div>
                </div>
                <Switch
                  checked={false}
                  disabled
                  data-testid="switch-sync"
                />
              </div>
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

      case "admin":
        if (!isAdmin) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Admin access required</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold">User Management</h3>
              </div>
              <button
                onClick={() => refetchUsers()}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                data-testid="btn-refresh-users"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {users?.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                        {user.id === adminStatus?.userId && (
                          <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>ID: {user.id}</p>
                    <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {(!users || users.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="font-medium mb-3">Admin Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-2xl font-bold text-blue-400">{users?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-2xl font-bold text-green-400">Active</p>
                  <p className="text-sm text-muted-foreground">System Status</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "developer":
        if (!isAdmin) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Admin access required</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <h4 className="font-medium">Developer Mode</h4>
                <p className="text-sm text-muted-foreground">Enable advanced debugging features</p>
              </div>
              <Switch
                checked={settings.developerMode}
                onCheckedChange={handleDevModeToggle}
                disabled={devModeMutation.isPending}
                data-testid="switch-developer-mode"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold">System Diagnostics</h3>
              </div>
              <button
                onClick={() => refetchDiagnostics()}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                data-testid="btn-refresh-diagnostics"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {diagnostics && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Cpu className="w-5 h-5" />
                    <h4 className="font-medium">System Info</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform</span>
                      <span>{diagnostics.system.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Architecture</span>
                      <span>{diagnostics.system.arch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Node Version</span>
                      <span>{diagnostics.system.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">System Uptime</span>
                      <span>{formatUptime(diagnostics.system.uptime)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400">
                    <HardDrive className="w-5 h-5" />
                    <h4 className="font-medium">Memory</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span>{formatBytes(diagnostics.memory.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Used</span>
                      <span>{formatBytes(diagnostics.memory.used)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Free</span>
                      <span>{formatBytes(diagnostics.memory.free)}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(diagnostics.memory.used / diagnostics.memory.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-orange-400">
                    <Clock className="w-5 h-5" />
                    <h4 className="font-medium">Process Info</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PID</span>
                      <span>{diagnostics.process.pid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPU Cores</span>
                      <span>{diagnostics.cpu.cores}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Process Uptime</span>
                      <span>{formatUptime(diagnostics.process.uptime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heap Used</span>
                      <span>{(diagnostics.process.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

  const visibleSections = sections.filter(s => !s.adminOnly || isAdmin);

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-60 border-r border-border bg-muted/30 p-2">
        <div className="space-y-1">
          {visibleSections.map(section => {
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
                {section.adminOnly && (
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">Admin</Badge>
                )}
                <ChevronRight className={`w-4 h-4 ${section.adminOnly ? "" : "ml-auto"} transition-opacity ${
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
