import { useState } from 'react';
import { Loader2, Download, ArrowLeft, Maximize2, Minimize2, FileText } from 'lucide-react';

export default function DocumentViewerModal({ show, onClose, fileUrl, fileName, fileType }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    if (!show) return null;

    // Determine viewer URL based on file type
    const getViewerUrl = () => {
        if (fileType.includes('pdf')) {
            return fileUrl;
        }

        if (fileType.includes('document') || fileType.includes('word') || fileType.includes('wordprocessingml')) {
            return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
        }

        if (fileType.includes('image')) {
            return null; // Handle images separately
        }

        return fileUrl;
    };

    const viewerUrl = getViewerUrl();
    const isImage = fileType.includes('image');

    const handleDownload = () => {
        window.open(fileUrl, '_blank');
    };

    const handleIframeLoad = () => {
        setLoading(false);
    };

    const handleIframeError = () => {
        setLoading(false);
        setError(true);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 45,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--background)',
                animation: 'fadeSlideIn 0.3s ease-out'
            }}
        >
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* In-App Toolbar — styled to blend with the app */}
            <div
                style={{
                    background: 'var(--card-bg)',
                    borderBottom: '1px solid var(--border)',
                    padding: '0.75rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                    marginTop: '60px', // Offset for the sticky navbar
                    gap: '1rem'
                }}
            >
                {/* Left side — Back + File info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 0.875rem',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            flexShrink: 0
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--primary)';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'var(--input-bg)';
                            e.currentTarget.style.color = 'var(--text)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Notes</span>
                    </button>

                    {/* Breadcrumb / File info */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: 0,
                        flex: 1
                    }}>
                        <div style={{
                            width: '1px',
                            height: '1.25rem',
                            background: 'var(--border)',
                            flexShrink: 0
                        }} />
                        <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{
                            color: 'var(--text)',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {fileName}
                        </span>
                    </div>
                </div>

                {/* Right side — Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                        onClick={handleDownload}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 0.875rem',
                            background: 'linear-gradient(135deg, var(--primary), #ff4500)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(255, 69, 0, 0.3)'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 69, 0, 0.4)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 69, 0, 0.3)';
                        }}
                    >
                        <Download size={16} />
                        <span>Download</span>
                    </button>
                </div>
            </div>

            {/* Document Content Area */}
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'var(--input-bg)',
                    margin: '0',
                }}
            >
                {/* Loading State */}
                {loading && !isImage && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--background)',
                        gap: '1rem',
                        zIndex: 1
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: 'var(--card-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                        }}>
                            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading document...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--background)',
                        gap: '1rem',
                        padding: '2rem'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '1rem',
                            background: 'var(--card-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                        }}>
                            📄
                        </div>
                        <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', margin: 0, fontWeight: '600' }}>
                            Unable to preview
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem', maxWidth: '400px' }}>
                            This document type can't be previewed in the browser. Download it to view the full content.
                        </p>
                        <button
                            onClick={handleDownload}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.625rem 1.25rem',
                                background: 'linear-gradient(135deg, var(--primary), #ff4500)',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                marginTop: '0.5rem'
                            }}
                        >
                            <Download size={18} />
                            <span>Download File</span>
                        </button>
                    </div>
                )}

                {/* Image Viewer */}
                {isImage && (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'auto',
                        padding: '2rem'
                    }}>
                        <img
                            src={fileUrl}
                            alt={fileName}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '0.5rem',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                            }}
                        />
                    </div>
                )}

                {/* Iframe Viewer (PDF / DOCX) */}
                {!isImage && viewerUrl && (
                    <iframe
                        src={viewerUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            display: error ? 'none' : 'block'
                        }}
                        title={fileName}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        allow="fullscreen"
                    />
                )}
            </div>
        </div>
    );
}
