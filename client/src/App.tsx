import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OSProvider } from "@/lib/os-context";
import { Desktop } from "@/components/os/Desktop";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OSProvider>
          <Desktop />
        </OSProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
