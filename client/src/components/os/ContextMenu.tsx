import { useOS } from "@/lib/os-context";
import { useEffect, useRef } from "react";

export function ContextMenu() {
  const { contextMenu, hideContextMenu } = useOS();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [contextMenu, hideContextMenu]);

  if (!contextMenu) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] py-1 rounded-lg shadow-2xl border border-white/10 overflow-hidden"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        backgroundColor: "rgba(30, 30, 35, 0.95)",
        backdropFilter: "blur(20px)",
      }}
    >
      {contextMenu.items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.action();
            hideContextMenu();
          }}
          className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
