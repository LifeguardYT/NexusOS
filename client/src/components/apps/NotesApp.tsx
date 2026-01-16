import { useState } from "react";
import { useOS } from "@/lib/os-context";
import { Plus, Search, Trash2, FileText, Save, Check } from "lucide-react";
import type { Note } from "@shared/schema";

export function NotesApp() {
  const { notes, addNote, updateNote, deleteNote, addFile } = useOS();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addNote(newNote);
    setSelectedNoteId(newNote.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const saveNoteToFiles = (note: Note) => {
    const fileName = `${note.title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Untitled'}.txt`;
    const fileContent = `${note.title}\n${'='.repeat(note.title.length)}\n\n${note.content}\n\n---\nCreated: ${formatDate(note.createdAt)}\nLast Updated: ${formatDate(note.updatedAt)}`;
    
    const fileId = `note-${note.id}-${Date.now()}`;
    addFile({
      id: fileId,
      name: fileName,
      type: "file",
      content: fileContent,
      parentId: "1"
    });

    setSavedNote(note.id);
    setTimeout(() => setSavedNote(null), 2000);
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-muted/30 flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
              data-testid="input-search-notes"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-auto">
          {filteredNotes.map(note => (
            <button
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={`w-full text-left p-3 border-b border-border/50 transition-colors ${
                selectedNoteId === note.id ? "bg-primary/10" : "hover:bg-muted/50"
              }`}
              data-testid={`note-item-${note.id}`}
            >
              <h4 className="font-medium text-sm truncate">{note.title}</h4>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{note.content || "No content"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{formatDate(note.updatedAt)}</p>
            </button>
          ))}
          {filteredNotes.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notes found
            </div>
          )}
        </div>

        {/* New Note Button */}
        <div className="p-3 border-t border-border">
          <button
            onClick={createNewNote}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            data-testid="btn-new-note"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Note</span>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                className="text-xl font-semibold bg-transparent border-none focus:outline-none flex-1"
                placeholder="Note title..."
                data-testid="input-note-title"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => saveNoteToFiles(selectedNote)}
                  className={`p-2 rounded-lg transition-colors ${
                    savedNote === selectedNote.id 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'hover:bg-primary/10 text-primary'
                  }`}
                  title="Save to Documents"
                  data-testid="btn-save-note"
                >
                  {savedNote === selectedNote.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    deleteNote(selectedNote.id);
                    setSelectedNoteId(notes.find(n => n.id !== selectedNote.id)?.id || null);
                  }}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  data-testid="btn-delete-note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              value={selectedNote.content}
              onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
              className="flex-1 p-4 bg-transparent resize-none focus:outline-none text-sm leading-relaxed"
              placeholder="Start writing..."
              data-testid="textarea-note-content"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <FileText className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">No note selected</p>
            <p className="text-sm">Select a note or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
