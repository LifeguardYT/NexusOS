import { useState } from "react";
import { useOS } from "@/lib/os-context";
import { 
  Folder, FileText, ChevronRight, Home, HardDrive,
  Image, Music, Download, Grid, List, X, FileCode, FileImage,
  FileVideo, FileAudio, File, Eye, Trash2, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileItem } from "@shared/schema";

const getFileTypeFromName = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  
  const textExtensions = ['txt', 'md', 'log', 'csv', 'json', 'xml', 'yaml', 'yml'];
  const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'sql', 'sh', 'bash'];
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
  const videoExtensions = ['mp4', 'webm', 'mkv', 'avi', 'mov'];
  
  if (textExtensions.includes(ext)) return 'text';
  if (codeExtensions.includes(ext)) return 'code';
  if (imageExtensions.includes(ext)) return 'image';
  if (audioExtensions.includes(ext)) return 'audio';
  if (videoExtensions.includes(ext)) return 'video';
  
  return 'unknown';
};

const getFileIcon = (file: FileItem) => {
  if (file.type === 'folder') return <Folder className="w-12 h-12 text-yellow-500" />;
  
  const fileType = getFileTypeFromName(file.name);
  switch (fileType) {
    case 'text':
      return <FileText className="w-12 h-12 text-blue-400" />;
    case 'code':
      return <FileCode className="w-12 h-12 text-green-400" />;
    case 'image':
      return <FileImage className="w-12 h-12 text-purple-400" />;
    case 'audio':
      return <FileAudio className="w-12 h-12 text-pink-400" />;
    case 'video':
      return <FileVideo className="w-12 h-12 text-red-400" />;
    default:
      return <File className="w-12 h-12 text-gray-400" />;
  }
};

const getFileIconSmall = (file: FileItem) => {
  if (file.type === 'folder') return <Folder className="w-5 h-5 text-yellow-500" />;
  
  const fileType = getFileTypeFromName(file.name);
  switch (fileType) {
    case 'text':
      return <FileText className="w-5 h-5 text-blue-400" />;
    case 'code':
      return <FileCode className="w-5 h-5 text-green-400" />;
    case 'image':
      return <FileImage className="w-5 h-5 text-purple-400" />;
    case 'audio':
      return <FileAudio className="w-5 h-5 text-pink-400" />;
    case 'video':
      return <FileVideo className="w-5 h-5 text-red-400" />;
    default:
      return <File className="w-5 h-5 text-gray-400" />;
  }
};

const systemFolderIds = ['1', '2', '3', '4'];

interface FileViewerProps {
  file: FileItem;
  onClose: () => void;
}

function FileViewer({ file, onClose }: FileViewerProps) {
  const fileType = getFileTypeFromName(file.name);
  
  const renderContent = () => {
    switch (fileType) {
      case 'text':
      case 'code':
        return (
          <ScrollArea className="h-full">
            <pre className={`p-4 text-sm whitespace-pre-wrap break-words ${fileType === 'code' ? 'font-mono bg-black/20' : ''}`}>
              {file.content || '(Empty file)'}
            </pre>
          </ScrollArea>
        );
      
      case 'image':
        if (file.content && (file.content.startsWith('data:') || file.content.startsWith('http'))) {
          return (
            <div className="h-full flex items-center justify-center p-4">
              <img 
                src={file.content} 
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          );
        }
        return (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <FileImage className="w-16 h-16 mb-4 opacity-50" />
            <p>Image preview not available</p>
            <p className="text-xs mt-2">File: {file.name}</p>
          </div>
        );
      
      case 'audio':
        if (file.content && (file.content.startsWith('data:') || file.content.startsWith('http'))) {
          return (
            <div className="h-full flex flex-col items-center justify-center p-4">
              <FileAudio className="w-24 h-24 text-pink-400 mb-6" />
              <p className="text-lg font-medium mb-4">{file.name}</p>
              <audio controls className="w-full max-w-md">
                <source src={file.content} />
                Your browser does not support the audio element.
              </audio>
            </div>
          );
        }
        return (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <FileAudio className="w-16 h-16 mb-4 opacity-50" />
            <p>Audio preview not available</p>
            <p className="text-xs mt-2">File: {file.name}</p>
          </div>
        );
      
      case 'video':
        if (file.content && (file.content.startsWith('data:') || file.content.startsWith('http'))) {
          return (
            <div className="h-full flex items-center justify-center p-4">
              <video controls className="max-w-full max-h-full rounded-lg">
                <source src={file.content} />
                Your browser does not support the video element.
              </video>
            </div>
          );
        }
        return (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <FileVideo className="w-16 h-16 mb-4 opacity-50" />
            <p>Video preview not available</p>
            <p className="text-xs mt-2">File: {file.name}</p>
          </div>
        );
      
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <File className="w-16 h-16 mb-4 opacity-50" />
            <p>Preview not available for this file type</p>
            <p className="text-xs mt-2">File: {file.name}</p>
            {file.content && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg max-w-md">
                <p className="text-xs text-center">This file has content but no viewer is available for its format.</p>
              </div>
            )}
          </div>
        );
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-card border border-border rounded-lg w-[700px] h-[500px] flex flex-col shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{file.name}</span>
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
              {fileType.toUpperCase()}
            </span>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="btn-close-viewer">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

interface RenameDialogProps {
  file: FileItem;
  onClose: () => void;
  onRename: (newName: string) => void;
}

function RenameDialog({ file, onClose, onRename }: RenameDialogProps) {
  const [newName, setNewName] = useState(file.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName !== file.name) {
      onRename(newName.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-card border border-border rounded-lg w-[400px] p-4 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium mb-4">Rename {file.type === 'folder' ? 'Folder' : 'File'}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary mb-4"
            autoFocus
            data-testid="input-rename"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!newName.trim()}>
              Rename
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ContextMenuState {
  x: number;
  y: number;
  file: FileItem;
}

export function FilesApp() {
  const { files, deleteFile, updateFile } = useOS();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);

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
    } else {
      setViewingFile(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
    setSelectedFile(file.id);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleDelete = (file: FileItem) => {
    if (systemFolderIds.includes(file.id)) {
      return;
    }
    deleteFile(file.id);
    closeContextMenu();
  };

  const handleRename = (file: FileItem) => {
    if (systemFolderIds.includes(file.id)) {
      return;
    }
    setRenamingFile(file);
    closeContextMenu();
  };

  const handleRenameSubmit = (newName: string) => {
    if (renamingFile) {
      updateFile(renamingFile.id, { name: newName });
    }
  };

  const sidebarItems = [
    { id: null, name: "Home", icon: Home },
    { id: "1", name: "Documents", icon: Folder },
    { id: "2", name: "Pictures", icon: Image },
    { id: "3", name: "Music", icon: Music },
    { id: "4", name: "Downloads", icon: Download },
  ];

  const isSystemFolder = (file: FileItem) => systemFolderIds.includes(file.id);

  return (
    <div className="h-full flex" onClick={closeContextMenu}>
      {viewingFile && (
        <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />
      )}

      {renamingFile && (
        <RenameDialog 
          file={renamingFile} 
          onClose={() => setRenamingFile(null)} 
          onRename={handleRenameSubmit}
        />
      )}

      {contextMenu && (
        <div 
          className="fixed bg-card border border-border rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setViewingFile(contextMenu.file)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            data-testid="ctx-open"
          >
            <Eye className="w-4 h-4" />
            Open
          </button>
          {!isSystemFolder(contextMenu.file) && (
            <>
              <button
                onClick={() => handleRename(contextMenu.file)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                data-testid="ctx-rename"
              >
                <Pencil className="w-4 h-4" />
                Rename
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => handleDelete(contextMenu.file)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                data-testid="ctx-delete"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
          {isSystemFolder(contextMenu.file) && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              System folder (protected)
            </div>
          )}
        </div>
      )}
      
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
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                    selectedFile === file.id ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  data-testid={`file-${file.id}`}
                >
                  {getFileIcon(file)}
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
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedFile === file.id ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  data-testid={`file-${file.id}`}
                >
                  {getFileIconSmall(file)}
                  <span className="text-sm flex-1 text-left">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {file.type === "folder" ? "Folder" : getFileTypeFromName(file.name).toUpperCase()}
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
