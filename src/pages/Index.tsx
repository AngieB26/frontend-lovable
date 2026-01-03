import { useState, useMemo } from "react";
import { useNotes } from "@/hooks/useNotes";
import { NoteCategory, CATEGORIES, Note } from "@/types/note";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { NoteCard } from "@/components/NoteCard";
import { NoteEditor } from "@/components/NoteEditor";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { notes, addNote, updateNote, deleteNote, togglePin, filterNotes } = useNotes();
  const [activeCategory, setActiveCategory] = useState<NoteCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Filter notes based on category and search
  const filteredNotes = useMemo(
    () => filterNotes(activeCategory, searchQuery),
    [filterNotes, activeCategory, searchQuery]
  );

  // Calculate note counts per category
  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      if (cat.value !== "all") {
        counts[cat.value] = notes.filter((n) => n.category === cat.value).length;
      }
    });
    return counts;
  }, [notes]);

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (title: string, content: string, category: string) => {
    try {
      await addNote(title, content, category);
      toast.success("Nota creada correctamente");
    } catch (e: any) {
      toast.error(e?.message || "Error al crear nota");
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    try {
      await updateNote(id, updates);
      toast.success("Nota actualizada");
    } catch (e: any) {
      toast.error(e?.message || "Error al actualizar nota");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      toast.success("Nota eliminada", {
        description: "La nota fue eliminada correctamente.",
      });
    } catch (e: any) {
      // Si el error es 404, mostrar mensaje especial
      if (e?.message?.includes("404")) {
        toast.error("Nota no encontrada", {
          description: "La nota ya no existe o ya fue eliminada.",
        });
      } else {
        toast.error("Error al eliminar nota", {
          description: e?.message || "Ocurrió un error inesperado al eliminar la nota.",
        });
      }
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await togglePin(id);
      const note = notes.find((n) => n.id === id);
      toast.success(note?.isPinned ? "Nota anclada" : "Nota desanclada");
    } catch (e: any) {
      toast.error(e?.message || "Error al anclar nota");
    }
  };

  const currentCategory = CATEGORIES.find((c) => c.value === activeCategory);

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      {/* Sidebar */}
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        noteCounts={noteCounts}
      />

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="pl-12 lg:pl-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                  {currentCategory?.emoji} {currentCategory?.label}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {filteredNotes.length} {filteredNotes.length === 1 ? "nota" : "notas"}
                </p>
              </div>
              <Button variant="glow" size="lg" onClick={handleCreateNote} className="shrink-0">
                <Plus className="w-5 h-5" />
                Nueva nota
              </Button>
            </div>

            {/* Search */}
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </header>

          {/* Notes grid */}
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note, index) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  index={index}
                  onEdit={handleEditNote}
                  onDelete={handleDeleteNote}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              onCreateNote={handleCreateNote}
              isFiltered={searchQuery.length > 0 || activeCategory !== "all"}
            />
          )}

          {/* Empty state message */}
          {notes.length > 0 && filteredNotes.length === 0 && searchQuery && (
            <EmptyState isFiltered={true} onCreateNote={handleCreateNote} />
          )}
        </div>
      </main>

      {/* Editor modal */}
      {isEditorOpen && (
        <NoteEditor
          note={editingNote}
          onSave={handleSaveNote}
          onUpdate={handleUpdateNote}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;
