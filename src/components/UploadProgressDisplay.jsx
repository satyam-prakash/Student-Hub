import { Loader2 } from 'lucide-react';

export default function UploadProgressDisplay({ uploadProgress, progressText }) {
    return (
        <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="mb-6">
                <div
                    className="text-6xl font-bold mb-2"
                    style={{
                        color: 'var(--primary)',
                        textShadow: '0 0 20px rgba(255, 102, 0, 0.5)'
                    }}
                >
                    {Math.round(uploadProgress)}%
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Processing</p>
            </div>

            <div style={{ width: '100%', maxWidth: '500px', marginBottom: '32px' }}>
                <div
                    style={{
                        height: '8px',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        width: '100%',
                        position: 'relative'
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            borderRadius: '999px',
                            transition: 'width 0.3s ease-out',
                            width: `${uploadProgress}%`,
                            background: 'linear-gradient(90deg, #ff6600 0%, #ff8533 50%, #ff6600 100%)',
                            boxShadow: '0 0 20px rgba(255, 102, 0, 0.6)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                animation: 'shine 2s infinite'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                    {progressText}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Please wait while we process your grade sheets...
                </p>
            </div>

            <div className="mt-6">
                <Loader2
                    className="animate-spin"
                    size={32}
                    style={{ color: 'var(--primary)', opacity: 0.6 }}
                />
            </div>
        </div>
    );
}
