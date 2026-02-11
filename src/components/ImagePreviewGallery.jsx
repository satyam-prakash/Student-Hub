import { X, Image as ImageIcon } from 'lucide-react';

export default function ImagePreviewGallery({
    uploadedScreenshots,
    uploading,
    onRemoveImage,
    onProcessImages
}) {
    if (uploadedScreenshots.length === 0) return null;

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Uploaded Images ({uploadedScreenshots.length})
                </h3>
                {!uploading && (
                    <button
                        onClick={onProcessImages}
                        className="btn-primary py-2 px-6 text-sm flex items-center gap-2"
                    >
                        <ImageIcon size={16} />
                        Process Images
                    </button>
                )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '384px', overflowY: 'auto', paddingRight: '8px' }}>
                {uploadedScreenshots.map((img, idx) => (
                    <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border bg-black/50"
                        style={{
                            border: '1px solid var(--border)',
                            width: '100px',
                            minWidth: '100px',
                            height: '100px',
                            position: 'relative'
                        }}
                    >
                        <img
                            src={img.data}
                            alt={`Screenshot ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        {!uploading && (
                            <div
                                role="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onRemoveImage(idx);
                                }}
                                className="absolute z-50 hover:scale-110 transition-transform"
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: 'transparent',
                                    color: '#dc2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    zIndex: 99999,
                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                                }}
                                title="Remove image"
                            >
                                <X size={20} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
