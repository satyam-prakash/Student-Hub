import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../hooks/useNotes';
import NoteCard from '../components/NoteCard';
import NotesSearchBar from '../components/NotesSearchBar';
import NoteUploadModal from '../components/NoteUploadModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import { Upload, Loader2, FileText } from 'lucide-react';

export default function NotesPage() {
    const { user } = useAuth();
    const { notes, loading, fetchNotes, deleteNote, incrementDownloads, createNote } = useNotes();
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [filters, setFilters] = useState({});
    const [viewerNote, setViewerNote] = useState(null);

    const handleViewNote = (note) => {
        setViewerNote(note);
    };

    useEffect(() => {
        fetchNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (newFilters) => {
        setFilters(newFilters);
        fetchNotes(newFilters);
    };

    const handleDelete = async (noteId) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            await deleteNote(noteId);
        }
    };

    const handleUploadSuccess = async (noteData) => {
        await createNote(noteData);
    };

    return (
        <div className="w-full pb-12 px-4 md:px-8">
            {/* Header */}
            <header className="mb-8 text-center animate-fade-in">
                <h1 className="font-bold mb-4" style={{
                    background: 'linear-gradient(to right, var(--text), var(--text-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 'clamp(2rem, 8vw, 3rem)'
                }}>
                    📚 Notes Community
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.875rem, 3vw, 1.125rem)' }}>
                    Share and discover study materials by course code
                </p>
            </header>

            {/* Upload Button */}
            {user && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Upload size={20} />
                        <span>Upload Note</span>
                    </button>
                </div>
            )}

            {/* Search Bar */}
            <NotesSearchBar onSearch={handleSearch} />

            {/* Loading State */}
            {loading && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem',
                    gap: '1rem'
                }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading notes...</p>
                </div>
            )}

            {/* Notes Grid */}
            {!loading && notes.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    {notes.map(note => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onDelete={handleDelete}
                            onDownload={incrementDownloads}
                            onView={handleViewNote}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && notes.length === 0 && (
                <div className="card" style={{
                    textAlign: 'center',
                    padding: '4rem 2rem'
                }}>
                    <FileText size={64} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: 'var(--text)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        No notes found
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        {filters.search || filters.courseCode || filters.semester
                            ? 'Try adjusting your filters'
                            : 'Be the first to share notes with the community!'}
                    </p>
                    {user && !filters.search && !filters.courseCode && !filters.semester && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="btn-primary"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Upload size={20} />
                            <span>Upload First Note</span>
                        </button>
                    )}
                </div>
            )}

            {/* Upload Modal */}
            <NoteUploadModal
                show={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUploadSuccess={handleUploadSuccess}
            />

            {/* Document Viewer Modal */}
            <DocumentViewerModal
                show={!!viewerNote}
                onClose={() => setViewerNote(null)}
                fileUrl={viewerNote?.file_url}
                fileName={viewerNote?.title}
                fileType={viewerNote?.file_type || ''}
            />
        </div>
    );
}
