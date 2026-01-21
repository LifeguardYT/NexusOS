import { Ban, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannedScreenProps {
  reason: string | null;
}

export function BannedScreen({ reason }: BannedScreenProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-950 to-black flex items-center justify-center z-[9999]">
      <div className="text-center max-w-md p-8">
        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <Ban className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">Account Banned</h1>
        
        <p className="text-gray-300 mb-6">
          Your account has been suspended from NexusOS.
        </p>
        
        {reason && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Reason:</p>
            <p className="text-white">{reason}</p>
          </div>
        )}
        
        <p className="text-sm text-gray-500 mb-8">
          If you believe this was a mistake, please contact an administrator.
        </p>
        
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          data-testid="btn-banned-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
