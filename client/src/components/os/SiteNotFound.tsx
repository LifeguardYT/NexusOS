export function SiteNotFound() {
  return (
    <div className="fixed inset-0 bg-[#1a1a1a] flex items-center justify-center z-[99999] font-sans">
      <div className="text-center max-w-lg p-8">
        <div className="text-[120px] leading-none text-gray-600 mb-4">:(</div>
        
        <h1 className="text-2xl font-normal text-gray-300 mb-4">
          This site can't be reached
        </h1>
        
        <p className="text-gray-500 mb-6">
          <span className="text-gray-400">nexusos.replit.app</span>'s server IP address could not be found.
        </p>
        
        <div className="text-left text-sm text-gray-500 mb-6 space-y-2">
          <p>Try:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Checking the connection</li>
            <li>Checking the proxy and the firewall</li>
            <li>Running Windows Network Diagnostics</li>
          </ul>
        </div>
        
        <p className="text-xs text-gray-600">
          ERR_NAME_NOT_RESOLVED
        </p>
      </div>
    </div>
  );
}
