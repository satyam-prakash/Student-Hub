import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../hooks/useNotes';
import NoteCard from '../components/NoteCard';
import NotesSearchBar from '../components/NotesSearchBar';
import NoteUploadModal from '../components/NoteUploadModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import { Upload, Loader2, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import './NotesPage.css';

export default function NotesPage() {
    const { user } = useAuth();
    const { notes, loading, fetchNotes, deleteNote, incrementDownloads, createNote, trendingNotes, fetchTrendingNotes } = useNotes();
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [filters, setFilters] = useState({});
    const [viewerNote, setViewerNote] = useState(null);

    const handleViewNote = (note) => {
        setViewerNote(note);
    };

    useEffect(() => {
        fetchNotes();
        fetchTrendingNotes();
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
        <div className="notes-page-container">
            {/* Header Section */}
            <div className="notes-header-section">
                <div>
                    <h1 className="notes-page-title">
                        Community Notes Hub
                    </h1>
                    <p className="notes-page-subtitle max-w-2xl">
                        Share knowledge, find resources, and grow together. Access thousands of peer-reviewed notes and study guides.
                    </p>
                </div>
                {user && (
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="header-upload-btn"
                    >
                        <Upload size={20} />
                        Upload New Resource
                    </button>
                )}
            </div>

            {/* Layout Grid */}
            <div className="notes-layout-grid">

                {/* Main Content Column */}
                <div className="notes-main-content">
                    {/* Search & Filters */}
                    <div className="search-section">
                        <NotesSearchBar onSearch={handleSearch} />
                    </div>

                    {/* Loading & Empty States */}
                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
                            <Loader2 size={48} className="animate-spin text-orange-500" />
                            <p style={{ color: '#9ca3af' }}>Loading resources...</p>
                        </div>
                    )}

                    {!loading && notes.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--surface-dark)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
                            <FileText size={64} style={{ color: '#4b5563', margin: '0 auto 1rem' }} />
                            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No notes found</h3>
                            <p style={{ color: '#9ca3af' }}>Try adjusting your filters or be the first to contribute.</p>
                        </div>
                    )}

                    {/* Notes Grid */}
                    {!loading && notes.length > 0 && (
                        <div className="notes-card-grid">
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

                    {/* Load More Button */}
                    {!loading && notes.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                            <button className="load-more-btn">
                                Load More Resources
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="sidebar-column">
                    {/* Trending Widget */}
                    <div className="sidebar-widget">
                        <div className="sidebar-header-row">
                            <TrendingUp size={24} style={{ color: 'var(--primary-orange)' }} />
                            <h2 className="sidebar-title">Trending This Week</h2>
                        </div>
                        <div className="sidebar-list">
                            {trendingNotes.map((item, index) => (
                                <div key={item.id} className="trending-list-item group">
                                    <div className="trending-number">
                                        {index + 1}
                                    </div>
                                    <div className="trending-text">
                                        <h4>{item.title}</h4>
                                        <span>{item.downloads} downloads</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <a href="#" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                View All Rankings
                                <ArrowRight size={16} />
                            </a>
                        </div>
                    </div>

                    {/* Reputation Banner */}
                    <div className="reputation-banner">
                        <div className="card-bg-pattern"></div>
                        <h3 className="sidebar-title" style={{ color: 'white', position: 'relative', zIndex: 10, marginBottom: '0.5rem' }}>Earn Reputation!</h3>
                        <p>
                            Upload your own notes to help peers and earn badges on your profile.
                        </p>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="white-glass-btn"
                        >
                            Start Uploading
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <NoteUploadModal
                show={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUploadSuccess={handleUploadSuccess}
            />

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
