import { useState, useEffect } from "react";
import { useOS } from "@/lib/os-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Palette, Monitor, Volume2, Wifi, Bell, User, Lock, Info, 
  Sun, Moon, ChevronRight, Check, Shield, Code, Activity, Users,
  Cpu, HardDrive, Clock, RefreshCw, ArrowLeft, Key, Mail, Ban, UserCheck, Crown, ShieldCheck, ShieldOff,
  Download, Upload, Trash2, Terminal, Send, Tag, X, Plus
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type SettingsSection = "appearance" | "display" | "sound" | "network" | "notifications" | "accounts" | "about" | "admin" | "developer" | "owner";

interface SectionItem {
  id: SettingsSection;
  name: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  developerOnly?: boolean;
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
  { id: "developer", name: "Developer", icon: Code, developerOnly: true },
  { id: "owner", name: "Owner", icon: Crown, ownerOnly: true },
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
  isOwner: boolean;
  userId?: string;
  ownerId?: string;
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
  banned?: boolean | null;
  isAdmin?: boolean | null;
}

interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

type AccountSubSection = "main" | "profile" | "signin";

function ThemeProfilesSection() {
  const { themeProfiles, saveThemeProfile, loadThemeProfile, deleteThemeProfile, exportThemeCode, importThemeCode, addNotification } = useOS();
  const [newProfileName, setNewProfileName] = useState("");
  const [importCode, setImportCode] = useState("");
  const [showExportCode, setShowExportCode] = useState(false);
  
  const handleSaveProfile = () => {
    if (newProfileName.trim()) {
      saveThemeProfile(newProfileName.trim());
      setNewProfileName("");
      addNotification("Theme Saved", `Profile "${newProfileName}" saved successfully`, "success");
    }
  };
  
  const handleImport = () => {
    if (importThemeCode(importCode.trim())) {
      setImportCode("");
      addNotification("Theme Imported", "Theme applied successfully", "success");
    } else {
      addNotification("Import Failed", "Invalid theme code", "error");
    }
  };
  
  return (
    <div className="border-t border-white/10 pt-4">
      <h3 className="text-lg font-semibold mb-4">Theme Profiles</h3>
      
      <div className="space-y-3 mb-4">
        {themeProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved profiles yet</p>
        ) : (
          themeProfiles.map(profile => (
            <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div>
                <span className="font-medium">{profile.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => loadThemeProfile(profile.id)} data-testid={`load-profile-${profile.id}`}>
                  Apply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteThemeProfile(profile.id)} data-testid={`delete-profile-${profile.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Profile name..."
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          className="flex-1"
          data-testid="input-profile-name"
        />
        <Button onClick={handleSaveProfile} disabled={!newProfileName.trim()} data-testid="btn-save-profile">
          <Download className="w-4 h-4 mr-1" /> Save
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowExportCode(!showExportCode)} data-testid="btn-export-theme">
          <Upload className="w-4 h-4 mr-1" /> Export
        </Button>
      </div>
      
      {showExportCode && (
        <div className="mt-3 p-3 rounded-lg bg-black/30">
          <p className="text-xs text-muted-foreground mb-2">Share this code:</p>
          <code className="text-xs break-all select-all">{exportThemeCode()}</code>
        </div>
      )}
      
      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-2">Import theme code:</p>
        <div className="flex gap-2">
          <Input
            placeholder="Paste theme code..."
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            className="flex-1 text-xs"
            data-testid="input-import-code"
          />
          <Button size="sm" onClick={handleImport} disabled={!importCode.trim()} data-testid="btn-import-theme">
            Import
          </Button>
        </div>
      </div>
    </div>
  );
}

function DesktopLoginSection() {
  const [desktopCode, setDesktopCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const generateCode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/desktop-auth/code");
      if (res.ok) {
        const data = await res.json();
        setDesktopCode(data.code);
        setCountdown(data.expiresIn);
      }
    } catch (error) {
      console.error("Failed to generate desktop code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setDesktopCode(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 border-t border-white/10 pt-6">
      <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wider">Desktop App Login</h4>
      
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Monitor className="w-5 h-5 text-blue-400" />
          <div>
            <h4 className="font-medium">Login Code</h4>
            <p className="text-sm text-muted-foreground">Use this code to sign in on the NexusOS Desktop app</p>
          </div>
        </div>
        
        {desktopCode ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] text-blue-400" data-testid="text-desktop-code">
                {desktopCode}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expires in: {formatTime(countdown)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(desktopCode);
                }}
                data-testid="btn-copy-code"
              >
                Copy Code
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter this code in the NexusOS Desktop app to sign in. The code can only be used once.
            </p>
          </div>
        ) : (
          <Button
            onClick={generateCode}
            disabled={isLoading}
            className="w-full"
            data-testid="btn-generate-code"
          >
            {isLoading ? "Generating..." : "Generate Login Code"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function SettingsApp() {
  const { settings, updateSettings, security, updateSecurity, debugLogs, clearDebugLogs, soundEnabled, setSoundEnabled } = useOS();
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");
  const [accountSubSection, setAccountSubSection] = useState<AccountSubSection>("main");
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setupError, setSetupError] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [grantAdminError, setGrantAdminError] = useState("");
  const [grantAdminSuccess, setGrantAdminSuccess] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"info" | "success" | "warning" | "error">("info");
  const [notifSuccess, setNotifSuccess] = useState("");
  const [versionClickCount, setVersionClickCount] = useState(0);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTargetUser, setBanTargetUser] = useState<{id: string; name: string} | null>(null);
  const [banReason, setBanReason] = useState("");
  const [tagTargetUser, setTagTargetUser] = useState<{id: string; name: string} | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#3b82f6");
  const [tagSuccess, setTagSuccess] = useState("");

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

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, banned, reason }: { userId: string; banned: boolean; reason?: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/ban`, { banned, reason });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update ban status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setBanModalOpen(false);
      setBanTargetUser(null);
      setBanReason("");
    },
  });

  const handleBanUser = (userId: string, currentlyBanned: boolean, userName: string) => {
    if (currentlyBanned) {
      // Unbanning - no reason needed
      banUserMutation.mutate({ userId, banned: false });
    } else {
      // Banning - open modal to get reason
      setBanTargetUser({ id: userId, name: userName });
      setBanModalOpen(true);
    }
  };
  
  const confirmBan = () => {
    if (banTargetUser && banReason.trim()) {
      banUserMutation.mutate({ userId: banTargetUser.id, banned: true, reason: banReason.trim() });
    }
  };

  const grantAdminMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", "/api/owner/grant-admin", { username });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to grant admin");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setGrantAdminSuccess(`Successfully granted admin to ${data.user?.firstName || data.user?.email}`);
      setGrantAdminError("");
      setAdminUsername("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setTimeout(() => setGrantAdminSuccess(""), 3000);
    },
    onError: (error: Error) => {
      setGrantAdminError(error.message);
      setGrantAdminSuccess("");
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { title: string; message: string; type: string }) => {
      const res = await apiRequest("POST", "/api/notifications", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send notification");
      }
      return res.json();
    },
    onSuccess: () => {
      setNotifSuccess("Notification sent to all users!");
      setNotifTitle("");
      setNotifMessage("");
      setNotifType("info");
      setTimeout(() => setNotifSuccess(""), 3000);
    },
    onError: (error: Error) => {
      setNotifSuccess("");
    },
  });

  const revokeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/owner/users/${userId}/admin`, { isAdmin: false });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to revoke admin");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const { data: userTagsData, refetch: refetchUserTags } = useQuery<{id: string; userId: string; name: string; color: string}[]>({
    queryKey: ["/api/users", tagTargetUser?.id, "tags"],
    queryFn: async () => {
      if (!tagTargetUser?.id) return [];
      const res = await fetch(`/api/users/${tagTargetUser.id}/tags`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch user tags");
      }
      return res.json();
    },
    enabled: !!tagTargetUser?.id,
  });

  const addTagMutation = useMutation({
    mutationFn: async ({ userId, name, color }: { userId: string; name: string; color: string }) => {
      const res = await apiRequest("POST", `/api/owner/users/${userId}/tags`, { name, color });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add tag");
      }
      return res.json();
    },
    onSuccess: () => {
      refetchUserTags();
      setTagName("");
      setTagSuccess("Tag added successfully!");
      setTimeout(() => setTagSuccess(""), 3000);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const res = await apiRequest("DELETE", `/api/owner/tags/${tagId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete tag");
      }
      return res.json();
    },
    onSuccess: () => {
      refetchUserTags();
    },
  });

  const handleDevModeToggle = (checked: boolean) => {
    // Update local state immediately for responsive UI
    updateSettings({ developerMode: checked });
    // Also update on server
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

  const handleExportData = () => {
    const exportData = {
      version: "2.2.1",
      exportedAt: new Date().toISOString(),
      settings: settings,
      security: {
        requireSignInOnWake: security.requireSignInOnWake,
        hasPassword: !!security.password,
        hasPin: !!security.pin,
      },
      notes: localStorage.getItem("nexus-notes") || "[]",
      files: localStorage.getItem("nexus-files") || "{}",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.settings) {
          updateSettings(data.settings);
        }
        
        if (data.security) {
          updateSecurity({ requireSignInOnWake: data.security.requireSignInOnWake });
        }
        
        if (data.notes) {
          localStorage.setItem("nexus-notes", typeof data.notes === "string" ? data.notes : JSON.stringify(data.notes));
        }
        
        if (data.files) {
          localStorage.setItem("nexus-files", typeof data.files === "string" ? data.files : JSON.stringify(data.files));
        }

        alert("Data imported successfully! Some changes may require a refresh to take effect.");
      } catch (err) {
        alert("Failed to import data. Please ensure the file is a valid NexusOS export.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleDeleteData = () => {
    if (confirm("Are you sure you want to delete all your data? This action cannot be undone.")) {
      localStorage.removeItem("nexus-notes");
      localStorage.removeItem("nexus-files");
      localStorage.removeItem("nexus-settings");
      localStorage.removeItem("nexus-security");
      updateSettings({
        theme: "dark",
        wallpaper: "gradient-1",
        accentColor: "blue",
        brightness: 100,
        volume: 50,
        wifi: true,
        notifications: true,
        syncEnabled: false,
        developerMode: false,
      });
      updateSecurity({
        password: null,
        pin: null,
        requireSignInOnWake: false,
      });
      alert("All data has been deleted.");
    }
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

            <ThemeProfilesSection />

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
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <h4 className="font-medium">System Sounds</h4>
                <p className="text-sm text-muted-foreground">Play sounds for notifications and actions</p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                data-testid="switch-sound-enabled"
              />
            </div>
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
        const defaultDisplayName = currentUser 
          ? `${currentUser.firstName || ''}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`.trim() || currentUser.email
          : "Guest User";
        const displayName = settings.displayName || defaultDisplayName;
        const userInitial = settings.displayName 
          ? settings.displayName[0].toUpperCase()
          : currentUser 
            ? (currentUser.firstName?.[0] || currentUser.email[0]).toUpperCase()
            : "G";
        
        // Profile sub-section
        if (accountSubSection === "profile") {
          return (
            <div className="space-y-6">
              <button
                onClick={() => setAccountSubSection("main")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="btn-back-accounts"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Accounts</span>
              </button>

              <h3 className="text-lg font-semibold">Profile</h3>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                {currentUser?.profileImageUrl ? (
                  <img 
                    src={currentUser.profileImageUrl} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{userInitial}</span>
                  </div>
                )}
                <div>
                  <button className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors" data-testid="btn-change-photo">
                    Change Photo
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Display Name</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={settings.displayName}
                        onChange={(e) => updateSettings({ displayName: e.target.value })}
                        placeholder={defaultDisplayName}
                        className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground"
                        data-testid="input-display-name"
                      />
                    </div>
                    {settings.displayName && (
                      <button
                        onClick={() => updateSettings({ displayName: "" })}
                        className="px-3 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors"
                        data-testid="btn-reset-name"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Leave empty to use your account name</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Email Address</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{currentUser?.email || "Not set"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Account Created</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : "Unknown"}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Sign-in Options sub-section
        if (accountSubSection === "signin") {
          const handlePasswordSetup = () => {
            setSetupError("");
            if (newPassword.length < 4) {
              setSetupError("Password must be at least 4 characters");
              return;
            }
            if (newPassword !== confirmPassword) {
              setSetupError("Passwords do not match");
              return;
            }
            updateSecurity({ password: newPassword });
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswordSetup(false);
          };

          const handlePinSetup = () => {
            setSetupError("");
            if (newPin.length < 4) {
              setSetupError("PIN must be at least 4 digits");
              return;
            }
            if (newPin !== confirmPin) {
              setSetupError("PINs do not match");
              return;
            }
            updateSecurity({ pin: newPin });
            setNewPin("");
            setConfirmPin("");
            setShowPinSetup(false);
          };

          const handleRemovePassword = () => {
            updateSecurity({ password: null });
          };

          const handleRemovePin = () => {
            updateSecurity({ pin: null });
          };

          return (
            <div className="space-y-6">
              <button
                onClick={() => setAccountSubSection("main")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="btn-back-accounts"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Accounts</span>
              </button>

              <h3 className="text-lg font-semibold">Sign-in Options</h3>

              <div className="space-y-3">
                {/* Password Setup */}
                {showPasswordSetup ? (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-blue-400" />
                      <h4 className="font-medium">Set up Password</h4>
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500"
                      data-testid="input-new-password"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500"
                      data-testid="input-confirm-password"
                    />
                    {setupError && <p className="text-red-400 text-sm">{setupError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={handlePasswordSetup}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
                        data-testid="btn-save-password"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setShowPasswordSetup(false); setNewPassword(""); setConfirmPassword(""); setSetupError(""); }}
                        className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors"
                        data-testid="btn-cancel-password"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-blue-400" />
                      <div>
                        <h4 className="font-medium">Password</h4>
                        <p className="text-sm text-muted-foreground">
                          {security.password ? "Password is set" : "Use a password to sign in"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowPasswordSetup(true)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors" 
                        data-testid="btn-setup-password"
                      >
                        {security.password ? "Change" : "Set up"}
                      </button>
                      {security.password && (
                        <button 
                          onClick={handleRemovePassword}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors" 
                          data-testid="btn-remove-password"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* PIN Setup */}
                {showPinSetup ? (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-yellow-400" />
                      <h4 className="font-medium">Set up PIN</h4>
                    </div>
                    <input
                      type="text"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter new PIN (numbers only)"
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500"
                      data-testid="input-new-pin"
                      maxLength={8}
                    />
                    <input
                      type="text"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Confirm PIN"
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500"
                      data-testid="input-confirm-pin"
                      maxLength={8}
                    />
                    {setupError && <p className="text-red-400 text-sm">{setupError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={handlePinSetup}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
                        data-testid="btn-save-pin"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setShowPinSetup(false); setNewPin(""); setConfirmPin(""); setSetupError(""); }}
                        className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors"
                        data-testid="btn-cancel-pin"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-yellow-400" />
                      <div>
                        <h4 className="font-medium">PIN</h4>
                        <p className="text-sm text-muted-foreground">
                          {security.pin ? "PIN is set" : "Use a numeric PIN to sign in"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowPinSetup(true)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors" 
                        data-testid="btn-setup-pin"
                      >
                        {security.pin ? "Change" : "Set up"}
                      </button>
                      {security.pin && (
                        <button 
                          onClick={handleRemovePin}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors" 
                          data-testid="btn-remove-pin"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <h4 className="font-medium mb-3">Additional Settings</h4>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h5 className="font-medium">Require sign-in on wake</h5>
                    <p className="text-sm text-muted-foreground">
                      {security.password || security.pin 
                        ? "Require sign-in after startup" 
                        : "Set up a password or PIN first"}
                    </p>
                  </div>
                  <Switch 
                    checked={security.requireSignInOnWake} 
                    onCheckedChange={(checked) => updateSecurity({ requireSignInOnWake: checked })}
                    disabled={!security.password && !security.pin}
                    data-testid="switch-signin-wake" 
                  />
                </div>
              </div>
            </div>
          );
        }

        
        // Main accounts view
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
              
              <button
                onClick={() => setAccountSubSection("profile")}
                className="w-full flex items-center justify-between py-3 border-b border-white/10 hover:bg-white/5 transition-colors rounded-lg px-2 -mx-2"
                data-testid="btn-profile"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <h4 className="font-medium">Profile</h4>
                    <p className="text-sm text-muted-foreground">Manage your profile information</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => setAccountSubSection("signin")}
                className="w-full flex items-center justify-between py-3 border-b border-white/10 hover:bg-white/5 transition-colors rounded-lg px-2 -mx-2"
                data-testid="btn-signin-options"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <h4 className="font-medium">Sign-in Options</h4>
                    <p className="text-sm text-muted-foreground">Password, PIN, and security keys</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Sync Settings</h4>
                    <p className="text-sm text-muted-foreground">Sync your settings across devices</p>
                  </div>
                </div>
                <Switch
                  checked={settings.syncEnabled}
                  onCheckedChange={(checked) => updateSettings({ syncEnabled: checked })}
                  data-testid="switch-sync"
                />
              </div>
            </div>

            <DesktopLoginSection />

            <div className="space-y-3">
              <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wider">Data Management</h4>
              
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">Download all your settings and data</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  data-testid="btn-export-data"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Import Data</h4>
                    <p className="text-sm text-muted-foreground">Restore from a backup file</p>
                  </div>
                </div>
                <label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                    data-testid="input-import-data"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid="btn-import-data"
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDeleteData}
                data-testid="btn-delete-data"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Data
              </Button>
            </div>
          </div>
        );

      case "about":
        const isDeveloperModeEnabled = settings.developerMode === true;
        const handleVersionClick = () => {
          if (isDeveloperModeEnabled) return;
          const newCount = versionClickCount + 1;
          setVersionClickCount(newCount);
          if (newCount >= 5) {
            updateSettings({ developerMode: true });
            setVersionClickCount(0);
          }
        };
        
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">N</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">NexusOS</h2>
                <p 
                  className={`text-sm text-muted-foreground cursor-pointer select-none transition-colors ${
                    versionClickCount > 0 && versionClickCount < 5 ? 'text-blue-400' : ''
                  } ${isDeveloperModeEnabled ? 'text-green-400' : ''}`}
                  onClick={handleVersionClick}
                  data-testid="text-version"
                >
                  Version 2.2.1 - IS THAT A GEOMETRY DASH REFERENCE?!
                  {versionClickCount > 0 && versionClickCount < 5 && (
                    <span className="ml-2 text-xs">({5 - versionClickCount} more...)</span>
                  )}
                  {isDeveloperModeEnabled && (
                    <span className="ml-2 text-xs text-green-400">(Developer Mode Active)</span>
                  )}
                </p>
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
                  className={`flex items-center justify-between p-3 rounded-lg ${user.banned ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.banned ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                      <span className="text-white font-medium">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2 flex-wrap">
                        {user.firstName} {user.lastName}
                        {user.id === adminStatus?.userId && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                        {user.banned && (
                          <Badge variant="destructive" className="text-xs">Banned</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    {user.id !== adminStatus?.userId && user.id !== adminStatus?.ownerId && (
                      <Button
                        size="sm"
                        variant={user.banned ? "outline" : "destructive"}
                        onClick={() => handleBanUser(user.id, user.banned === true, `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User')}
                        disabled={banUserMutation.isPending}
                        data-testid={`btn-ban-user-${user.id}`}
                        className="min-w-[80px]"
                      >
                        {user.banned ? (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Unban
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4 mr-1" />
                            Ban
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {(!users || users.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="font-medium mb-3">Admin Stats</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-2xl font-bold text-blue-400">{users?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-2xl font-bold text-red-400">{users?.filter(u => u.banned).length || 0}</p>
                  <p className="text-sm text-muted-foreground">Banned Users</p>
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
        if (!isAdmin && settings.developerMode !== true) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Developer mode not enabled</p>
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

            {settings.developerMode && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-400">
                    <Terminal className="w-5 h-5" />
                    <h4 className="font-medium">Debug Console</h4>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => clearDebugLogs()}
                    data-testid="btn-clear-debug-logs"
                  >
                    Clear Logs
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-black/50 font-mono text-xs h-48 overflow-auto">
                  {debugLogs.length === 0 ? (
                    <p className="text-muted-foreground">No debug logs yet. System events will appear here.</p>
                  ) : (
                    debugLogs.map(log => (
                      <div key={log.id} className="flex gap-2 py-0.5">
                        <span className="text-muted-foreground shrink-0">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span className={`shrink-0 ${
                          log.type === "error" ? "text-red-400" :
                          log.type === "warn" ? "text-yellow-400" :
                          log.type === "event" ? "text-blue-400" :
                          "text-gray-400"
                        }`}>
                          [{log.type.toUpperCase()}]
                        </span>
                        <span className="text-purple-400 shrink-0">[{log.category}]</span>
                        <span className="text-foreground">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Developer mode enables: Debug console, additional terminal commands (debug, sysinfo, logs), and performance monitoring.
                </p>
              </div>
            )}
          </div>
        );

      case "owner":
        if (!adminStatus?.isOwner) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Owner access required</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold">Owner Controls</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              As the owner, you can grant or revoke admin privileges to other users.
            </p>

            <div className="p-4 rounded-lg bg-white/5 space-y-4">
              <h4 className="font-medium">Grant Admin by Username</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter username or email..."
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="flex-1"
                  data-testid="input-admin-username"
                />
                <Button
                  onClick={() => grantAdminMutation.mutate(adminUsername)}
                  disabled={!adminUsername.trim() || grantAdminMutation.isPending}
                  data-testid="btn-grant-admin"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Grant Admin
                </Button>
              </div>
              {grantAdminError && (
                <p className="text-sm text-red-400">{grantAdminError}</p>
              )}
              {grantAdminSuccess && (
                <p className="text-sm text-green-400">{grantAdminSuccess}</p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Current Admins</h4>
              {users?.filter(u => u.isAdmin || u.id === adminStatus?.userId).map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2 flex-wrap">
                        {user.firstName} {user.lastName}
                        {user.id === adminStatus?.userId && (
                          <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Owner</Badge>
                        )}
                        {user.isAdmin && user.id !== adminStatus?.userId && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {user.id !== adminStatus?.userId && user.isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeAdminMutation.mutate(user.id)}
                      disabled={revokeAdminMutation.isPending}
                      data-testid={`btn-revoke-admin-${user.id}`}
                    >
                      <ShieldOff className="w-4 h-4 mr-1" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-white/5 space-y-4 mt-6">
              <h4 className="font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Broadcast Notification
              </h4>
              <p className="text-sm text-muted-foreground">
                Send a notification to all NexusOS users.
              </p>
              <Input
                placeholder="Notification title..."
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                data-testid="input-notif-title"
              />
              <Textarea
                placeholder="Notification message..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-notif-message"
              />
              <div className="flex gap-2">
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as any)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  data-testid="select-notif-type"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
                <Button
                  onClick={() => sendNotificationMutation.mutate({ 
                    title: notifTitle, 
                    message: notifMessage, 
                    type: notifType 
                  })}
                  disabled={!notifTitle.trim() || !notifMessage.trim() || sendNotificationMutation.isPending}
                  data-testid="btn-send-notification"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
              {notifSuccess && (
                <p className="text-sm text-green-400">{notifSuccess}</p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-white/5 space-y-4 mt-6">
              <h4 className="font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Manage User Tags
              </h4>
              <p className="text-sm text-muted-foreground">
                Add custom tags to user accounts that appear in chat.
              </p>
              
              <div className="space-y-3">
                <p className="text-sm font-medium">Select a user:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {users?.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setTagTargetUser({ id: user.id, name: user.firstName || user.email || "User" });
                        setTagSuccess("");
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                        tagTargetUser?.id === user.id ? "bg-blue-500/20 border border-blue-500/30" : "bg-white/5 hover:bg-white/10"
                      }`}
                      data-testid={`btn-select-user-tag-${user.id}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {tagTargetUser && (
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <p className="text-sm font-medium">Tags for {tagTargetUser.name}:</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {userTagsData?.map((tag) => (
                      <span 
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
                        style={{ backgroundColor: `${tag.color}30`, color: tag.color, border: `1px solid ${tag.color}50` }}
                      >
                        {tag.name}
                        <button 
                          onClick={() => deleteTagMutation.mutate(tag.id)}
                          className="hover:opacity-70"
                          data-testid={`btn-delete-tag-${tag.id}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {(!userTagsData || userTagsData.length === 0) && (
                      <p className="text-sm text-muted-foreground">No tags yet</p>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Tag name..."
                      value={tagName}
                      onChange={(e) => setTagName(e.target.value)}
                      className="flex-1"
                      data-testid="input-tag-name"
                    />
                    <input
                      type="color"
                      value={tagColor}
                      onChange={(e) => setTagColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                      title="Tag color"
                      data-testid="input-tag-color"
                    />
                    <Button
                      onClick={() => addTagMutation.mutate({ userId: tagTargetUser.id, name: tagName, color: tagColor })}
                      disabled={!tagName.trim() || addTagMutation.isPending}
                      size="icon"
                      data-testid="btn-add-tag"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {tagSuccess && (
                    <p className="text-sm text-green-400">{tagSuccess}</p>
                  )}
                </div>
              )}
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

  const isOwner = adminStatus?.isOwner === true;
  const isDeveloperMode = settings.developerMode === true;
  const visibleSections = sections.filter(s => {
    if (s.ownerOnly) return isOwner;
    if (s.adminOnly) return isAdmin;
    if (s.developerOnly) return isDeveloperMode || isAdmin;
    return true;
  });

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
                {section.ownerOnly && (
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 border-yellow-500/50 text-yellow-400">Owner</Badge>
                )}
                {section.adminOnly && !section.ownerOnly && (
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">Admin</Badge>
                )}
                <ChevronRight className={`w-4 h-4 ${section.adminOnly || section.ownerOnly ? "" : "ml-auto"} transition-opacity ${
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
      
      {/* Ban Reason Modal */}
      <Dialog open={banModalOpen} onOpenChange={(open) => {
        setBanModalOpen(open);
        if (!open) {
          setBanTargetUser(null);
          setBanReason("");
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              Ban User
            </DialogTitle>
            <DialogDescription>
              You are about to ban <strong>{banTargetUser?.name}</strong>. Please provide a reason for this action.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter the reason for banning this user..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="min-h-[100px] bg-zinc-800 border-zinc-600"
              data-testid="input-ban-reason"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setBanModalOpen(false)}
              data-testid="btn-cancel-ban"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBan}
              disabled={!banReason.trim() || banUserMutation.isPending}
              data-testid="btn-confirm-ban"
            >
              {banUserMutation.isPending ? "Banning..." : "Confirm Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
