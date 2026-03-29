import { X, Upload, FileText, CheckCircle, Trash2 } from 'lucide-react';
import './ImageUploadModal.css';

export default function ImageUploadModal({
    show,
    uploading,
    uploadProgress,
    progressText,
    uploadedScreenshots,
    isDragging,
    onClose,
    onDragStateChange,
    onFileSelect,
    onRemoveImage,
    onProcessImages
}) {
    if (!show) return null;

    return (
        <div
            className="modal-overlay"
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDragStateChange(true);
            }}
            onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDragStateChange(true);
            }}
            onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.clientX <= 0 || e.clientY <= 0 || (e.relatedTarget === null && e.target.nodeName !== 'HTML')) {
                    onDragStateChange(false);
                }
            }}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDragStateChange(false);
                onFileSelect({ target: { files: e.dataTransfer.files } });
            }}
        >
            <div className="modal-content">
                {/* Header */}
                <header className="modal-header">
                    <h1 className="modal-title">Upload Grade Sheet</h1>
                    <button className="btn-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </header>

                {/* Body */}
                <main className="modal-body">
                    {/* File Input (Hidden) */}
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        multiple
                        accept="image/*,.pdf"
                        onChange={onFileSelect}
                    />

                    {/* Dropzone */}
                    <section
                        className={`dropzone ${isDragging ? 'drag-active' : ''}`}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        <div className="drop-icon">
                            <Upload size={64} strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                            <p className="drop-text-main">
                                {isDragging ? 'Drop files here' : 'Drag & Drop files here'}
                            </p>
                            <p className="drop-text-sub">
                                Click to <span className="drop-link">upload</span> or browse files from your computer
                            </p>
                        </div>
                        <div className="supported-formats">
                            <span className="format-badge">PDF</span>
                            <span className="format-badge">JPG</span>
                            <span className="format-badge">PNG</span>
                        </div>
                    </section>

                    {/* Recent Uploads */}
                    {uploadedScreenshots.length > 0 && (
                        <section>
                            <h2 className="section-title">Recent Uploads</h2>
                            <div className="uploads-list">
                                {uploadedScreenshots.map((file, index) => (
                                    <div key={index} className="upload-item">
                                        <div className="file-info">
                                            <div className={`file-icon ${!uploading ? 'success' : ''}`}>
                                                {uploading ? <FileText size={20} /> : <CheckCircle size={20} />}
                                            </div>
                                            <div className="file-details">
                                                <span className="file-name">
                                                    {file.name || `Screenshot ${index + 1}`}
                                                </span>
                                                <span className="file-meta">
                                                    {/* We assume ~2MB for screenshots as we don't have exact size in prop currently, 
                                                        or we can omit size. Timestamps also mocked for now or 'Just now' */}
                                                    Ready to process
                                                </span>
                                            </div>
                                        </div>
                                        <div className="status-badge">
                                            {uploading ? (
                                                <>
                                                    <span className="status-dot"></span>
                                                    <span className="status-text processing">Processing {Math.round(uploadProgress)}%...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="status-pill">Analyzed</span>
                                                    <button
                                                        className="btn-remove"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemoveImage(index);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                {/* Footer */}
                <footer className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn-extract"
                        onClick={onProcessImages}
                        disabled={uploading || uploadedScreenshots.length === 0}
                    >
                        {uploading ? 'Processing...' : 'Extract Grades'}
                    </button>
                </footer>
            </div>
        </div>
    );
}
