import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OSProvider } from "@/lib/os-context";
import { Desktop } from "@/components/os/Desktop";
import { BannedScreen } from "@/components/os/BannedScreen";

interface BanStatus {
  banned: boolean;
  reason: string | null;
}

function AppContent() {
  const { data: banStatus } = useQuery<BanStatus>({
    queryKey: ["/api/auth/ban-status"],
    refetchInterval: 30000,
  });

  if (banStatus?.banned) {
    return <BannedScreen reason={banStatus.reason} />;
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
