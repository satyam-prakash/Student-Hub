import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '../utils/useMediaQuery';
import { useGeminiUpload } from '../hooks/useGeminiUpload';
import { useGradeData } from '../hooks/useGradeData';
import CircularProgress from '../components/CircularProgress';
import TermCard from '../components/TermCard';
import ImageUploadModal from '../components/ImageUploadModal';
import { Calculator, Upload, Plus } from 'lucide-react';
import './CGPACalculator.css'; // New Custom CSS

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
        <div className="cgpa-page">
            <div className="cgpa-container">
                {/* Header */}
                <header className="cgpa-header">
                    <div className="cgpa-title">
                        <h1>CGPA Calculator</h1>
                        <p>Plan your academic journey term by term</p>
                    </div>
                    <div className="cgpa-actions">
                        <button
                            className="btn-primary"
                            onClick={() => {
                                calculateStats();
                                setTimeout(() => saveData(true), 500);
                            }}
                        >
                            <Calculator size={18} />
                            <span>Calculate CGPA</span>
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => setShowUploadModal(true)}
                        >
                            <Upload size={18} />
                            <span>Upload Grades</span>
                        </button>
                    </div>
                </header>

                {/* Stats Row */}
                <div className="stats-scroll-container">
                    <div className="stat-item">
                        <CircularProgress value={stats.actualCGPA} max={10} color="var(--primary-orange)" size={120} />
                        <div className="stat-label">
                            <h3>Actual CGPA</h3>
                            <p>Cumulative</p>
                        </div>
                    </div>
                    <div className="stat-item">
                        <CircularProgress value={stats.targetCGPA} max={10} color="var(--success-green)" size={120} />
                        <div className="stat-label">
                            <h3>Target CGPA</h3>
                            <p>Projected</p>
                        </div>
                    </div>

                    {!isMobile && stats.termStats && stats.termStats.map((termStat, idx) => (
                        <div key={idx} className="stat-item">
                            <CircularProgress value={termStat.tgpa || 0} max={10} color="var(--blue-info)" size={120} />
                            <div className="stat-label">
                                <h3>Term {idx + 1} GPA</h3>
                                <p>{termStat.totalCredits} Credits</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Term Grid */}
                <div className="term-grid">
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

                    {/* Add Semester Card */}
                    <button className="add-semester-card" onClick={handleAddTerm}>
                        <div className="add-sem-content">
                            <div className="add-icon-circle">
                                <Plus size={32} />
                            </div>
                            <span className="add-sem-text">Add Semester</span>
                        </div>
                    </button>
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
        </div>
    );
}
