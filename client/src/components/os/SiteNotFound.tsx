import { Ban } from "lucide-react";

interface SiteNotFoundProps {
  reason?: string | null;
}

export function SiteNotFound({ reason }: SiteNotFoundProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-950 via-black to-black flex items-center justify-center z-[99999]">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
            <Ban className="w-12 h-12 text-red-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Banned</h1>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-gray-300">{reason || "No reason provided"}</p>
        </div>
        <p className="text-gray-500 text-sm">
          If you believe this is a mistake, please contact an administrator.
        </p>
      </div>
    </div>
  );
}
