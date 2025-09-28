import React, { useState, useEffect, useCallback, useContext } from 'react';
import type { Note } from '../types';
import { api } from '../services/api';
import { AuthContext } from '../App';
import { Button, FloatingActionButton, Spinner } from './ui';

// --- NoteCard Component ---
interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit }) => {
  return (
    <div
      onClick={() => onEdit(note)}
      className="bg-yellow-200 p-4 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-in-out"
    >
      <h3 className="font-bold text-lg text-gray-800 truncate">{note.title}</h3>
      <p className="text-gray-600 mt-2 break-words line-clamp-4">{note.content}</p>
      <p className="text-xs text-gray-500 mt-4 text-right">
        Last Modified: {new Date(note.last_update).toLocaleDateString()}
      </p>
    </div>
  );
};


// --- NoteModal Component ---
interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, content: string) => Promise<void>;
    onDelete?: () => Promise<void>;
    note: Note | null;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSave, onDelete, note }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(note?.title || '');
            setContent(note?.content || '');
            setIsSaving(false);
            setIsDeleting(false);
        }
    }, [isOpen, note]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(title, content);
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (onDelete && window.confirm(`Are you sure you want to delete "${note?.title}"?`)) {
            setIsDeleting(true);
            try {
                await onDelete();
            } finally {
                setIsDeleting(false);
            }
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">{note ? 'Edit Note' : 'Add Note'}</h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Note title"
                    />
                </div>
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Hello world..."
                    />
                </div>
                <div className="flex justify-end space-x-4 pt-2">
                    {note && onDelete && (
                        <Button onClick={handleDelete} variant="danger" isLoading={isDeleting}>Delete</Button>
                    )}
                     <Button onClick={onClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleSave} variant="primary" isLoading={isSaving}>{note ? 'Save' : 'Add'}</Button>
                </div>
            </div>
        </div>
    );
};


// --- HomePage Component ---
const HomePage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const auth = useContext(AuthContext);
  const user = auth.user;

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userNotes = await api.getNotesForUser();
      setNotes(userNotes.sort((a,b) => new Date(b.last_update).getTime() - new Date(a.last_update).getTime()));
    } catch (err) {
      setError('Failed to fetch notes.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const openAddModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSaveNote = async (title: string, content: string) => {
    if (!user) return;
    try {
        if (editingNote) {
            await api.updateNote(editingNote.id, title, content);
        } else {
            await api.createNote(title, content);
        }
        await fetchNotes();
        closeModal();
    } catch (err) {
        alert('Failed to save note.');
    }
  };

  const handleDeleteNote = async () => {
    if (!editingNote) return;
    
    // Double confirmation - one in modal, one here for extra safety
    const confirmDelete = window.confirm(`Are you sure you want to delete "${editingNote.title}"? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    try {
        await api.deleteNote(editingNote.id);
        await fetchNotes();
        closeModal();
    } catch (err) {
        alert('Failed to delete note. Please try again.');
        console.error('Delete error:', err);
    }
  };

  return (
    <main className="container mx-auto p-6">
      <h2 className="text-4xl font-bold text-gray-700">Good Morning {user?.username}!</h2>
      
      {isLoading && (
        <div className="flex justify-center items-center mt-20">
            <Spinner size="lg"/>
        </div>
      )}
      
      {error && <p className="text-red-500 text-center mt-8">{error}</p>}
      
      {!isLoading && !error && notes.length === 0 && (
          <div className="text-center mt-20">
              <p className="text-xl text-gray-500">You don't have any notes yet.</p>
              <p className="text-gray-400">Click the '+' button to add your first note!</p>
          </div>
      )}

      {!isLoading && notes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {notes.map(note => (
            <NoteCard key={note.id} note={note} onEdit={openEditModal} />
          ))}
        </div>
      )}

      <FloatingActionButton onClick={openAddModal} />

      <NoteModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveNote}
        onDelete={editingNote ? handleDeleteNote : undefined}
        note={editingNote}
      />
    </main>
  );
};

export default HomePage;