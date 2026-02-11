import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '../utils/useMediaQuery';
import { useGeminiUpload } from '../hooks/useGeminiUpload';
import { useGradeData } from '../hooks/useGradeData';
import CircularProgress from '../components/CircularProgress';
import TermCard from '../components/TermCard';
import ImageUploadModal from '../components/ImageUploadModal';
import { Calculator, Upload, Plus } from 'lucide-react';

export default function CGPACalculator() {
    const { user } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const {
        terms,
        loading,
        stats,
        handleCourseChange,
        handleDeleteCourse,
        handleDeleteTerm,
        handleAddCourse,
        handleAddTerm,
        calculateStats,
        saveData,
        fillExtractedData
    } = useGradeData(user);

    const {
        uploading,
        uploadProgress,
        progressText,
        uploadedScreenshots,
        handleScreenshotUpload,
        removeUploadedImage,
        processScreenshotsWithGemini
    } = useGeminiUpload();

    return (
        <>
            {/* Fixed Action Buttons */}
            <div
                style={{
                    position: 'fixed',
                    top: isMobile ? 'auto' : '80px',
                    bottom: isMobile ? '20px' : 'auto',
                    right: '20px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '12px'
                }}
            >
                <button
                    onClick={() => {
                        calculateStats();
                        setTimeout(() => saveData(true), 500);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, var(--primary), #ff4500)',
                        border: 'none',
                        padding: '0.7rem 0.7rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 10px 40px rgba(255, 102, 0, 0.3)'
                    }}
                    className="shadow-xl"
                >
                    <Calculator size={16} />
                    <span>Calculate CGPA</span>
                </button>

                <button
                    onClick={() => setShowUploadModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #9333ea 0%, #7928ca 100%)',
                        border: 'none',
                        padding: '0.7rem 0.7rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 10px 40px rgba(147, 51, 234, 0.3)'
                    }}
                    className="shadow-xl"
                >
                    <Upload size={16} />
                    <span>Upload Grades</span>
                </button>
            </div>

            <div className="w-full pb-12 px-4 md:px-8">
                <header className="mb-8 text-center animate-fade-in relative">
                    <h1 className="font-bold mb-4 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--text), var(--text-secondary))', fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
                        CGPA Calculator
                    </h1>
                    <p className="" style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.875rem, 3vw, 1.125rem)' }}>
                        Plan your academic journey term by term
                    </p>
                </header>

                {/* Stats Section */}
                <div className="mb-8 overflow-x-auto pb-4">
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            justifyContent: 'center',
                            width: '100%'
                        }}
                    >
                        <div className="rounded-2xl p-4 flex flex-col items-center" style={{ minWidth: '150px', background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <CircularProgress value={stats.actualCGPA} max={10} color="var(--primary)" size={120} />
                            <h3 className="font-bold mt-4" style={{ color: 'var(--text)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>Actual CGPA</h3>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cumulative</span>
                        </div>

                        <div className="rounded-2xl p-4 flex flex-col items-center" style={{ minWidth: '150px', background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <CircularProgress value={stats.targetCGPA} max={10} color="#22c55e" size={120} />
                            <h3 className="font-bold mt-4" style={{ color: 'var(--text)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>Target CGPA</h3>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Projected</span>
                        </div>

                        {!isMobile && stats.termStats && stats.termStats.map((termStat, idx) => (
                            <div key={idx} className="rounded-2xl p-4 flex flex-col items-center" style={{ minWidth: '150px', background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                                <CircularProgress value={termStat.tgpa || 0} max={10} color="#3b82f6" size={120} />
                                <h3 className="font-bold mt-4" style={{ color: 'var(--text)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>Term {idx + 1} GPA</h3>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{termStat.totalCredits} Credits</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Terms List */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '300px' : '500px'}, 1fr))`, gap: '2rem', marginTop: '3rem', paddingBottom: isMobile ? '100px' : '0' }}>
                    {terms.map((term, tIndex) => (
                        <TermCard
                            key={term.termNumber}
                            term={term}
                            termIndex={tIndex}
                            stats={stats}
                            isMobile={isMobile}
                            loading={loading}
                            onCourseChange={handleCourseChange}
                            onDeleteCourse={handleDeleteCourse}
                            onDeleteTerm={handleDeleteTerm}
                            onAddCourse={handleAddCourse}
                        />
                    ))}

                    {terms.length > 0 && (
                        <div className="card animate-fade-in relative border-dashed border-white/20 hover:border-primary/50 flex items-center justify-center" style={{ minHeight: '300px' }}>
                            <button
                                onClick={handleAddTerm}
                                className="flex flex-col items-center justify-center gap-3 transition-colors"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                            >
                                <Plus size={48} />
                                <span className="text-xl font-semibold">Add Sem</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ImageUploadModal
                show={showUploadModal}
                uploading={uploading}
                uploadProgress={uploadProgress}
                progressText={progressText}
                uploadedScreenshots={uploadedScreenshots}
                isDragging={isDragging}
                onClose={() => setShowUploadModal(false)}
                onDragStateChange={setIsDragging}
                onFileSelect={handleScreenshotUpload}
                onRemoveImage={removeUploadedImage}
                onProcessImages={() => processScreenshotsWithGemini(fillExtractedData)}
            />
        </>
    );
}
