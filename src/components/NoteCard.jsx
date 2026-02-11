import { FileText, Download, Trash2, User, Calendar, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NoteCard({ note, onDelete, onDownload, onView }) {
    const { user } = useAuth();
    const isOwner = user?.id === note.user_id;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (fileType) => {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('doc')) return '📝';
        return '📎';
    };

    const handleView = () => {
        if (!note.file_url) {
            alert('Error: File URL is missing. Cannot open file.');
            return;
        }

        // Open in-page document viewer
        if (onView) {
            onView(note);
        }

        // Increment download count
        if (onDownload) {
            onDownload(note.id);
        }
    };

    const handleDownload = () => {
        console.log('Download button clicked!');
        console.log('File URL:', note.file_url);

        if (!note.file_url) {
            console.error('ERROR: file_url is missing!');
            alert('Error: File URL is missing. Cannot download file.');
            return;
        }

        const newWindow = window.open(note.file_url, '_blank');
        if (!newWindow) {
            console.error('Pop-up blocked! Please allow pop-ups for this site.');
            alert('Pop-up blocked! Please allow pop-ups and try again.');
        }

        if (onDownload) {
            onDownload(note.id);
        }
    };

    // Since we're not joining with auth.users, just show user_id
    const uploaderName = note.user_id ? `User ${note.user_id.substring(0, 8)}...` : 'Anonymous';

    return (
        <div className="card animate-fade-in" style={{
            position: 'relative',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        }}>
            {/* Course Code Badge */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'linear-gradient(135deg, var(--primary), #ff4500)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600'
            }}>
                {note.course_code}
            </div>

            {/* Thumbnail or File Type Icon */}
            <div style={{
                width: '100%',
                height: '200px',
                marginBottom: '1rem',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                background: 'var(--input-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {note.thumbnail_url ? (
                    <img
                        src={note.thumbnail_url}
                        alt={note.title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        onError={(e) => {
                            // Fallback to icon if thumbnail fails to load
                            console.error('Thumbnail failed to load:', note.thumbnail_url, 'for note:', note.title);
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div style="font-size: 3rem">${getFileIcon(note.file_type)}</div>`;
                        }}
                    />
                ) : (
                    <div style={{ fontSize: '3rem' }}>
                        {getFileIcon(note.file_type)}
                    </div>
                )}
            </div>

            {/* Title */}
            <h3 style={{
                color: 'var(--text)',
                fontSize: '1.25rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                lineHeight: '1.4'
            }}>
                {note.title}
            </h3>

            {/* Semester Tag (if available) */}
            {note.semester && (
                <div style={{
                    display: 'inline-block',
                    background: 'var(--input-bg)',
                    color: 'var(--text-secondary)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    marginBottom: '1rem',
                    border: '1px solid var(--border)'
                }}>
                    Semester {note.semester}
                </div>
            )}

            {/* Description */}
            {note.description && (
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    marginTop: note.semester ? '0.5rem' : '0',
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {note.description}
                </p>
            )}

            {/* Metadata */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={14} />
                    <span>{uploaderName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} />
                    <span>{formatDate(note.created_at)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={14} />
                    <span>{note.downloads || 0} downloads • {formatFileSize(note.file_size)}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '1rem'
            }}>
                <button
                    onClick={handleView}
                    className="btn-primary"
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        padding: '0.625rem 1rem'
                    }}
                >
                    <Eye size={16} />
                    <span>View</span>
                </button>

                <button
                    onClick={handleDownload}
                    className="btn-secondary"
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        padding: '0.625rem 1rem'
                    }}
                >
                    <Download size={16} />
                    <span>Download</span>
                </button>

                {isOwner && (
                    <button
                        onClick={() => onDelete(note.id)}
                        className="btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.625rem 1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            color: 'var(--error)'
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
