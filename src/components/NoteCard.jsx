import { Download, Star, Trash2, FileText, Image as ImageIcon, Binary, Archive, Presentation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/NotesPage.css'; // Ensure styles are available

export default function NoteCard({ note, onDelete, onDownload, onView }) {
    const { user } = useAuth();
    const isOwner = user?.id === note.user_id;
    const rating = (4.0 + Math.random()).toFixed(1);

    const getFileDetails = (fileType) => {
        if (fileType.includes('pdf')) return { icon: <FileText size={64} />, label: 'PDF', color: 'text-red-400' };
        if (fileType.includes('image')) return { icon: <ImageIcon size={64} />, label: 'IMG', color: 'text-blue-400' };
        if (fileType.includes('doc')) return { icon: <FileText size={64} />, label: 'DOCX', color: 'text-blue-600' };
        if (fileType.includes('presentation')) return { icon: <Presentation size={64} />, label: 'PPT', color: 'text-orange-600' };
        if (fileType.includes('zip')) return { icon: <Archive size={64} />, label: 'ZIP', color: 'text-yellow-600' };
        return { icon: <Binary size={64} />, label: 'FILE', color: 'text-gray-400' };
    };

    const { icon, label } = getFileDetails(note.file_type || '');

    const handleView = () => {
        if (!note.file_url) return;
        if (onView) onView(note);
        if (onDownload) onDownload(note.id);
    };

    const uploaderName = note.user_id ? `User ${note.user_id.substring(0, 8)}` : 'Anonymous';

    return (
        <div className="custom-note-card group" onClick={handleView}>
            {/* Top Gradient Section */}
            <div className="card-top-gradient" style={{ position: 'relative' }}>
                {note.thumbnail_url ? (
                    <>
                        <img
                            src={note.thumbnail_url}
                            alt={note.title}
                            className="thumbnail-img"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                position: 'absolute',
                                inset: 0,
                                zIndex: 1
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                // Show fallback icon underneath (which is siblings)
                            }}
                        />
                        {/* Gradient overlay for text readability if needed, or just let thumb shine */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)', zIndex: 2 }}></div>
                    </>
                ) : null}

                {/* Fallback Icon / Background Pattern (Visible if no thumb or thumb fails/loading) */}
                <div className="card-bg-pattern" style={{ zIndex: 0 }}></div>
                <div className="card-main-icon" style={{ zIndex: 0 }}>
                    {icon}
                </div>

                <div className="card-type-badge" style={{ zIndex: 10 }}>
                    {label}
                </div>
            </div>

            {/* Content Section */}
            <div className="card-body-content">
                <div className="card-tags-row">
                    <span className="card-tag-primary">
                        {note.course_code || 'GENERIC'}
                    </span>
                    <span className="card-tag-secondary">
                        {note.semester ? `Semester ${note.semester}` : 'General'}
                    </span>
                </div>

                <h3 className="card-title-text">
                    {note.title}
                </h3>
                <p className="card-desc-text">
                    {note.description || 'No description provided.'}
                </p>

                {/* Footer */}
                <div className="card-footer-row">
                    <div className="card-author-group">
                        <div className="card-author-avatar" style={{ backgroundColor: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>
                            {uploaderName.charAt(0)}
                        </div>
                        <span className="card-author-name">
                            {uploaderName}
                        </span>
                    </div>

                    <div className="card-stats-group">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f97316', fontWeight: 500 }}>
                            <Star size={14} fill="currentColor" /> {rating}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="group-hover:text-orange-500 transition-colors">
                            <Download size={14} /> {note.downloads || 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Hover Actions (Delete for owner) */}
            {isOwner && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(note.id);
                    }}
                    style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', padding: '0.5rem', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', zIndex: 20 }}
                    title="Delete Note"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );
}
