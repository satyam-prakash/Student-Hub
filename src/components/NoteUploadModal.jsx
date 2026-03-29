import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCourseCodesByDepartment, departmentNames, getSemesterForCourse } from '../utils/courseCodeUtils';
import { ArrowLeft, CloudUpload, Upload, X, BookOpen, Calendar, Lock, Globe, Loader2 } from 'lucide-react';
import '../pages/NotesPage.css'; // Ensure proper styles

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export default function NoteUploadModal({ show, onClose, onUploadSuccess }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseCode: '',
        semester: '',
        visibility: 'community' // 'private' or 'community'
    });
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    const coursesByDept = getCourseCodesByDepartment();
    const departments = Object.keys(coursesByDept).sort();
    const availableCourses = selectedDepartment ? coursesByDept[selectedDepartment] || [] : [];

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/msword' // DOC
    ];

    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) return;
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('File size must be less than 10MB');
            return;
        }
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError('Invalid file type. Please upload only PDF or DOCX files.');
            return;
        }
        setFile(selectedFile);
        setError('');
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleCourseCodeChange = (code) => {
        setFormData(prev => {
            const semester = getSemesterForCourse(code);
            return {
                ...prev,
                courseCode: code,
                semester: semester || prev.semester
            };
        });
    };

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'notes_upload');
        formData.append('folder', 'student-hub/notes');

        const xhr = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(progress);
                }
            });
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Upload failed'));
                }
            });
            xhr.addEventListener('error', () => reject(new Error('Network error')));
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
            xhr.send(formData);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title || !formData.courseCode || !file) {
            setError('Please fill in all required fields');
            return;
        }
        if (!user) {
            setError('You must be logged in to upload notes');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);

            const cloudinaryResponse = await uploadToCloudinary(file);

            // Generate Thumbnail for PDF
            let thumbnailUrl = null;
            if (file.type.includes('pdf')) {
                // Ensure .jpg extension is present for image transformation to work correctly
                thumbnailUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_300,c_fill,pg_1,f_jpg/${cloudinaryResponse.public_id}.jpg`;
            }

            const noteData = {
                user_id: user.id,
                title: formData.title,
                description: formData.description,
                course_code: formData.courseCode,
                semester: formData.semester || null,
                file_url: cloudinaryResponse.secure_url,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                thumbnail_url: thumbnailUrl
                // removed is_public as it is acceptable to not send it if column missing
            };

            await onUploadSuccess(noteData);

            // Reset
            setFormData({ title: '', description: '', courseCode: '', semester: '', visibility: 'community' });
            setSelectedDepartment('');
            setFile(null);
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to upload. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="upload-modal-overlay" onClick={onClose}>
            <div className="upload-modal-card" onClick={e => e.stopPropagation()}>
                <div className="upload-card-content">
                    {/* Header */}
                    <div className="upload-header">
                        <div className="back-link" onClick={onClose}>
                            <ArrowLeft size={16} className="mr-1" />
                            Back to Library
                        </div>
                        <h2 className="upload-title">Upload Study Resource</h2>
                        <p className="upload-subtitle">Share your knowledge with the community.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Drag & Drop Zone */}
                        <div
                            className={`drag-drop-zone ${dragActive ? 'bg-orange-100/50' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                className="drag-drop-input"
                                onChange={handleFileChange}
                                accept=".pdf,.docx,.doc"
                                disabled={uploading}
                            />
                            {file ? (
                                <div className="text-center">
                                    <div className="icon-circle bg-green-100 text-green-600">
                                        <Upload size={32} />
                                    </div>
                                    <h3 className="drop-text-main text-green-600">{file.name}</h3>
                                    <p className="drop-text-sub">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <>
                                    <div className="icon-circle">
                                        <CloudUpload size={32} />
                                    </div>
                                    <h3 className="drop-text-main">Drag & Drop files here</h3>
                                    <p className="drop-text-sub">
                                        or <span style={{ color: 'var(--primary-orange)', textDecoration: 'underline' }}>browse files</span> from your computer
                                    </p>
                                    <div className="file-types-row">
                                        <span className="file-type-pill">PDF</span>
                                        <span className="file-type-pill">DOCX</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {uploading && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--primary-orange)', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', textAlign: 'right' }}>{uploadProgress}% Uploaded</p>
                            </div>
                        )}

                        {error && (
                            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                {error}
                            </div>
                        )}

                        {/* Form Fields */}
                        <div className="upload-form-grid">
                            {/* Title */}
                            <div className="col-span-full form-group">
                                <label>Resource Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Calculus II Midterm Summary"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Department (Additional Helper Field) */}
                            <div className="form-group">
                                <label>Department</label>
                                <select
                                    className="form-input"
                                    value={selectedDepartment}
                                    onChange={e => {
                                        setSelectedDepartment(e.target.value);
                                        setFormData(prev => ({ ...prev, courseCode: '' }));
                                    }}
                                >
                                    <option value="">Select Dept</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            {/* Course Code */}
                            <div className="form-group">
                                <label>Subject / Course Code</label>
                                <div className="input-with-icon">
                                    <BookOpen size={18} className="input-icon" />
                                    <select
                                        className="form-input has-icon"
                                        value={formData.courseCode}
                                        onChange={e => handleCourseCodeChange(e.target.value)}
                                        disabled={!selectedDepartment}
                                        required
                                    >
                                        <option value="">Select Course</option>
                                        {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Semester */}
                            <div className="form-group">
                                <label>Semester</label>
                                <div className="input-with-icon">
                                    <Calendar size={18} className="input-icon" />
                                    <select
                                        className="form-input has-icon"
                                        value={formData.semester}
                                        onChange={e => setFormData({ ...formData, semester: e.target.value })}
                                    >
                                        <option value="">Select Semester</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Tags (Decorative) */}
                            <div className="col-span-full form-group">
                                <label>Tags</label>
                                <div className="tags-input-container">
                                    <span className="tag-chip">
                                        #Exam <X size={12} className="tag-remove" />
                                    </span>
                                    <span className="tag-chip">
                                        #Handwritten <X size={12} className="tag-remove" />
                                    </span>
                                    <input type="text" className="tags-input-field" placeholder="Type to add tags..." />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="col-span-full form-group">
                                <label>Description <span style={{ fontWeight: 400, color: '#9ca3af' }}>(Optional)</span></label>
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    placeholder="Briefly describe what this resource covers..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Footer Visibility & Action */}
                        <div className="upload-footer">
                            {/* Visibility Toggle */}
                            <div className="visibility-toggle-group">
                                <div
                                    className={`visibility-option ${formData.visibility === 'private' ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, visibility: 'private' })}
                                >
                                    <Lock size={16} /> Private
                                </div>
                                <div
                                    className={`visibility-option ${formData.visibility === 'community' ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, visibility: 'community' })}
                                >
                                    <Globe size={16} /> Community
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="action-buttons">
                                <button type="button" className="btn-cancel" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-publish" disabled={uploading}>
                                    {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                    Publish Resource
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Disclaimers */}
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', padding: '1rem', borderTop: '1px solid var(--border-color)', margin: 0 }}>
                    By uploading, you confirm that you have the right to share these materials and they adhere to the Community Guidelines.
                </p>
            </div>
        </div>
    );
}
