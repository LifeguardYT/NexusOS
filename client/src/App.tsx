import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OSProvider } from "@/lib/os-context";
import { Desktop } from "@/components/os/Desktop";
import { SiteNotFound } from "@/components/os/SiteNotFound";

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

  // Get current user info to save their ID if banned
  const { data: authUser } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    enabled: !isBannedLocally,
  });

  // Check user ban status (requires authentication)
  const { data: banStatus } = useQuery<BanStatus>({
    queryKey: ["/api/auth/ban-status"],
    enabled: !isBannedLocally,
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
