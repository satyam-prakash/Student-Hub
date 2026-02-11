import { X, Upload } from 'lucide-react';
import UploadProgressDisplay from './UploadProgressDisplay';
import ImagePreviewGallery from './ImagePreviewGallery';

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
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)'
            }}
        >
            {/* Global Drag Overlay */}
            {isDragging && !uploading && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300 pointer-events-none"
                    style={{
                        background: 'rgba(255, 102, 0, 0.4)',
                        zIndex: 99999,
                    }}
                >
                    <div className="text-center transform scale-110">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary text-white shadow-2xl animate-bounce" style={{ background: 'var(--primary)' }}>
                            <Upload size={48} />
                        </div>
                        <h3 className="text-4xl font-bold" style={{ color: 'var(--primary)', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                            Drop Anywhere!
                        </h3>
                    </div>
                </div>
            )}

            <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl max-w-4xl w-full mx-4 shadow-2xl relative animate-fade-in flex flex-col" style={{ maxHeight: '90vh', background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}>
                {/* Header */}
                <div className="p-8 pb-4 border-b border-white/10 flex justify-between items-start" style={{ borderColor: 'var(--border)' }}>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Upload Grade Sheet</h2>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Upload screenshots of your grade history. AI will extract your grades automatically.</p>
                    </div>
                    <button
                        onClick={() => !uploading && onClose()}
                        className="transition-colors hover:scale-110 p-2 -mr-2 -mt-2 rounded-full"
                        style={{
                            backgroundColor: 'transparent',
                            color: '#dc2626',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-8 pt-6 overflow-y-auto custom-scrollbar relative">
                    <input
                        type="file"
                        id="screenshot-input"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={onFileSelect}
                    />

                    {!uploading ? (
                        <div
                            className="border-2 border-dashed rounded-xl py-20 px-16 text-center transition-all duration-300 cursor-pointer hover:border-primary/50"
                            style={{
                                borderColor: 'var(--border)',
                                background: 'var(--input-bg)',
                            }}
                            onClick={() => document.getElementById('screenshot-input').click()}
                        >
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300"
                                style={{
                                    background: 'rgba(255, 102, 0, 0.2)',
                                    pointerEvents: 'none'
                                }}
                            >
                                <Upload
                                    size={32}
                                    style={{
                                        color: isDragging ? '#ffffff' : 'var(--primary)',
                                        transition: 'all 0.3s'
                                    }}
                                />
                            </div>

                            <h3 className="text-lg font-semibold mb-2" style={{ color: isDragging ? 'var(--primary)' : 'var(--text)', pointerEvents: 'none' }}>
                                {isDragging ? 'Drop your images here!' : 'Click to upload or drag and drop'}
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                                Supports PNG, JPG (Max 5MB)
                            </p>
                        </div>
                    ) : (
                        <UploadProgressDisplay
                            uploadProgress={uploadProgress}
                            progressText={progressText}
                        />
                    )}

                    <ImagePreviewGallery
                        uploadedScreenshots={uploadedScreenshots}
                        uploading={uploading}
                        onRemoveImage={onRemoveImage}
                        onProcessImages={onProcessImages}
                    />
                </div>
            </div>
        </div>
    );
}
