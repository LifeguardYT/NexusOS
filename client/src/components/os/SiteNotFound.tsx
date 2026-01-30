import { useEffect } from "react";

export function SiteNotFound() {
  useEffect(() => {
    // Redirect to a domain guaranteed to not exist (.invalid is reserved by IANA)
    // This causes a real DNS error in the browser
    window.location.href = "https://nexusos-access-revoked.invalid/";
  }, []);

  // Show a brief loading state before redirect happens
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[99999]">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
