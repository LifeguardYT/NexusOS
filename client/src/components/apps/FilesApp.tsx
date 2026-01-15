import { useState } from "react";
import { useOS } from "@/lib/os-context";
import { 
  Folder, FileText, ChevronRight, ChevronDown, Home, HardDrive,
  Image, Music, Download, Grid, List, Search, Plus, Trash2
} from "lucide-react";
import type { FileItem } from "@shared/schema";

const iconMap: Record<string, React.ComponentType<any>> = {
  folder: Folder,
  file: FileText,
  image: Image,
  music: Music,
  download: Download,
};

export function FilesApp() {
  const { files } = useOS();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const currentFiles = files.filter(f => f.parentId === currentFolderId);

  const getBreadcrumbs = (): { id: string | null; name: string }[] => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: "Home" }];
    let folderId = currentFolderId;
    
    while (folderId) {
      const folder = files.find(f => f.id === folderId);
      if (folder) {
        crumbs.splice(1, 0, { id: folder.id, name: folder.name });
        folderId = folder.parentId;
      } else {
        break;
      }
    }
    
    return crumbs;
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedFile(null);
  };

  const handleDoubleClick = (file: FileItem) => {
    if (file.type === "folder") {
      navigateToFolder(file.id);
    }
  };

  const sidebarItems = [
    { id: null, name: "Home", icon: Home },
    { id: "1", name: "Documents", icon: Folder },
    { id: "2", name: "Pictures", icon: Image },
    { id: "3", name: "Music", icon: Music },
    { id: "4", name: "Downloads", icon: Download },
  ];

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-52 border-r border-border bg-muted/30 p-2">
        <div className="space-y-1">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = currentFolderId === item.id;
            return (
              <button
                key={item.id || "home"}
                onClick={() => navigateToFolder(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-white/5"
                }`}
                data-testid={`sidebar-${item.name.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
            <HardDrive className="w-4 h-4" />
            <span className="text-sm">This PC</span>
          </div>
          <div className="ml-4 mt-1 space-y-1">
            <div className="text-xs text-muted-foreground px-3 py-1">
              Storage: 128 GB / 256 GB
            </div>
            <div className="mx-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-primary rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm">
            {getBreadcrumbs().map((crumb, index) => (
              <div key={crumb.id || "home"} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
                <button
                  onClick={() => navigateToFolder(crumb.id)}
                  className="px-2 py-1 rounded hover:bg-muted transition-colors"
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid" ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
              data-testid="btn-view-grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "list" ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
              data-testid="btn-view-list"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Files */}
        <div className="flex-1 p-4 overflow-auto">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-6 gap-4">
              {currentFiles.map(file => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file.id)}
                  onDoubleClick={() => handleDoubleClick(file)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                    selectedFile === file.id ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  data-testid={`file-${file.id}`}
                >
                  {file.type === "folder" ? (
                    <Folder className="w-12 h-12 text-yellow-500" />
                  ) : (
                    <FileText className="w-12 h-12 text-blue-400" />
                  )}
                  <span className="text-xs text-center truncate w-full">{file.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {currentFiles.map(file => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file.id)}
                  onDoubleClick={() => handleDoubleClick(file)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedFile === file.id ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  data-testid={`file-${file.id}`}
                >
                  {file.type === "folder" ? (
                    <Folder className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-400" />
                  )}
                  <span className="text-sm flex-1 text-left">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {file.type === "folder" ? "Folder" : "File"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {currentFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Folder className="w-16 h-16 mb-4 opacity-30" />
              <p>This folder is empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
