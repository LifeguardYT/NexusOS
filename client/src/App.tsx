import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OSProvider } from "@/lib/os-context";
import { Desktop } from "@/components/os/Desktop";
import { SiteNotFound } from "@/components/os/SiteNotFound";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const BAN_STORAGE_KEY = "nexusos_access_revoked";
const BAN_USER_ID_KEY = "nexusos_revoked_id";

function checkBanMarker(): boolean {
  try {
    return localStorage.getItem(BAN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getBannedUserId(): string | null {
  try {
    return localStorage.getItem(BAN_USER_ID_KEY);
  } catch {
    return null;
  }
}

function setBanMarker(userId: string) {
  try {
    localStorage.setItem(BAN_STORAGE_KEY, "true");
    localStorage.setItem(BAN_USER_ID_KEY, userId);
  } catch {}
}

function clearBanMarker() {
  try {
    localStorage.removeItem(BAN_STORAGE_KEY);
    localStorage.removeItem(BAN_USER_ID_KEY);
  } catch {}
}

interface BanStatus {
  banned: boolean;
  reason: string | null;
}

interface UnbanCheck {
  stillBanned: boolean;
}

interface AuthUser {
  id: string;
  firstName?: string | null;
  email?: string;
}

function LoginScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
          <span className="text-4xl font-bold text-white">N</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">NexusOS</h1>
        <p className="text-gray-400 mb-8">Sign in to access your desktop</p>
        <Button 
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
          onClick={() => window.location.href = "/api/login"}
          data-testid="button-login"
        >
          Sign in with Replit
        </Button>
        <p className="text-gray-500 text-sm mt-6">
          A web-based operating system experience
        </p>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <span className="text-2xl font-bold text-white">N</span>
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
      </div>
    </div>
  );
}

function AppContent() {
  const [isBannedLocally, setIsBannedLocally] = useState(checkBanMarker);
  const bannedUserId = getBannedUserId();

  // If locally banned, check with server if user has been unbanned
  const { data: unbanCheck } = useQuery<UnbanCheck>({
    queryKey: ["/api/auth/unban-check", bannedUserId],
    queryFn: async () => {
      if (!bannedUserId) return { stillBanned: true };
      const res = await fetch(`/api/auth/unban-check/${bannedUserId}`);
      return res.json();
    },
    enabled: isBannedLocally && !!bannedUserId,
    refetchInterval: 60000,
  });

  // Get current user info
  const { data: authUser, isLoading: isLoadingUser } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !isBannedLocally,
    retry: false,
  });

  // Check user ban status (requires authentication)
  const { data: banStatus } = useQuery<BanStatus>({
    queryKey: ["/api/auth/ban-status"],
    enabled: !isBannedLocally && !!authUser,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (banStatus?.banned && authUser?.id) {
      setBanMarker(authUser.id);
      setIsBannedLocally(true);
    }
  }, [banStatus?.banned, authUser?.id]);

  useEffect(() => {
    if (unbanCheck && !unbanCheck.stillBanned) {
      clearBanMarker();
      setIsBannedLocally(false);
    }
  }, [unbanCheck]);

  // If banned (either from server or localStorage), show site not found
  if (isBannedLocally || banStatus?.banned) {
    return <SiteNotFound />;
  }

  // Show loading while checking auth
  if (isLoadingUser) {
    return <LoadingScreen />;
  }

  // If not logged in, show login screen - users MUST authenticate
  if (!authUser) {
    return <LoginScreen />;
  }

  return (
    <OSProvider>
      <Desktop />
    </OSProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
