import { useState, useEffect, useCallback } from "react";
import { Note, NoteCategory } from "@/types/note";
import { getNotes, createNote, updateNote as updateNoteAPI, deleteNote as deleteNoteAPI, loadCategories } from "@/lib/api";

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories and notes from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        // First load categories to build the mapping
        await loadCategories();
        
        // Then load notes
        const data = await getNotes();
        const notesArray = Array.isArray(data) ? data : [];
        setNotes(notesArray.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        })));
      } catch (e) {
        console.error("Error loading notes from backend:", e);
        setNotes([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addNote = useCallback(async (title: string, content: string, category: string = "ideas") => {
    try {
      const newNote = await createNote(title || "Sin título", content, category);
      const note: Note = {
        id: newNote.id,
        title: newNote.title || "Sin título",
        content: newNote.content,
        category: newNote.category,
        createdAt: new Date(newNote.createdAt),
        updatedAt: new Date(newNote.updatedAt),
        isPinned: newNote.isPinned || false,
      };
      setNotes((prev) => [note, ...prev]);
      return note;
    } catch (e) {
      console.error("Error creating note:", e);
      throw e;
    }
  }, []);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return;
      
      await updateNoteAPI(id, updates.title || note.title, updates.content || note.content, updates.category || note.category);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, ...updates, updatedAt: new Date() }
            : n
        )
      );
    } catch (e) {
      console.error("Error updating note:", e);
      throw e;
    }
  }, [notes]);

  const deleteNote = useCallback(async (id: string) => {
    try {
      await deleteNoteAPI(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (e) {
      console.error("Error deleting note:", e);
      throw e;
    }
  }, []);

  const togglePin = useCallback(async (id: string) => {
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return;
      
      await updateNoteAPI(id, note.title, note.content, note.category);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isPinned: !n.isPinned } : n
        )
      );
    } catch (e) {
      console.error("Error toggling pin:", e);
      throw e;
    }
  }, [notes]);

  const filterNotes = useCallback(
    (category: NoteCategory, searchQuery: string) => {
      return notes
        .filter((note) => {
          const matchesCategory = category === "all" || note.category === category;
          const matchesSearch =
            !searchQuery ||
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
        })
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
    },
    [notes]
  );

  return {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    filterNotes,
  };
}
