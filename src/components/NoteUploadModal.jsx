import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCourseCodesByDepartment, departmentNames, getSemesterForCourse } from '../utils/courseCodeUtils';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = 'notes_upload';

export default function NoteUploadModal({ show, onClose, onUploadSuccess }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseCode: '',
        semester: ''
    });
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    const coursesByDept = getCourseCodesByDepartment();
    const departments = Object.keys(coursesByDept).sort();
    const availableCourses = selectedDepartment ? coursesByDept[selectedDepartment] || [] : [];

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX only
    ];

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Validate file size
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('File size must be less than 10MB');
            return;
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError('Invalid file type. Please upload only PDF or DOCX files.');
            return;
        }

        setFile(selectedFile);
        setError('');
    };

    const handleCourseCodeChange = (code) => {
        setFormData({ ...formData, courseCode: code });

        // Auto-detect semester if possible
        const semester = getSemesterForCourse(code);
        if (semester) {
            setFormData(prev => ({ ...prev, courseCode: code, semester }));
        } else {
            setFormData(prev => ({ ...prev, courseCode: code }));
        }
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
                    const response = JSON.parse(xhr.responseText);
                    console.log('Cloudinary upload response:', response);
                    resolve(response);
                } else {
                    const errorResponse = JSON.parse(xhr.responseText);
                    reject(new Error(errorResponse.error?.message || 'Upload failed'));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Network error during upload')));

            // Use /raw/upload for documents - raw files are always public
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`);
            xhr.send(formData);
        });
    };

    const generateThumbnailUrl = (cloudinaryResponse, fileType) => {
        const publicId = cloudinaryResponse.public_id;
        const cloudName = CLOUDINARY_CLOUD_NAME;

        console.log('Generating thumbnail for:', { publicId, fileType, cloudinaryResponse });

        // For PDFs, extract first page and create thumbnail
        if (fileType.includes('pdf')) {
            const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/pg_1,w_400,h_300,c_fill,f_jpg/${publicId}`;
            console.log('PDF Thumbnail URL:', thumbnailUrl);
            return thumbnailUrl;
        }

        // For DOCX files, try to generate thumbnail (may not work on free tier)
        if (fileType.includes('document') || fileType.includes('word') || fileType.includes('wordprocessingml')) {
            const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/pg_1,w_400,h_300,c_fill,f_jpg/${publicId}`;
            console.log('DOCX Thumbnail URL:', thumbnailUrl);
            return thumbnailUrl;
        }

        // Fallback for any other file types
        console.log('Using fallback icon for file type:', fileType);
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
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

            // Upload file to Cloudinary
            const cloudinaryResponse = await uploadToCloudinary(file);

            // Generate thumbnail URL
            const thumbnailUrl = generateThumbnailUrl(cloudinaryResponse, file.type);

            // Prepare note data
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
            };

            // Save to database
            await onUploadSuccess(noteData);

            // Reset form
            setFormData({ title: '', description: '', courseCode: '', semester: '' });
            setSelectedDepartment('');
            setFile(null);
            setUploadProgress(0);
            onClose();
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload note. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }} onClick={onClose}>
            <div className="card" style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ color: 'var(--text)', fontSize: '1.5rem', fontWeight: '700' }}>
                        Upload Note
                    </h2>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{ padding: '0.5rem' }}
                        disabled={uploading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Title */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Data Structures Lecture Notes"
                            required
                            disabled={uploading}
                        />
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the notes..."
                            rows={3}
                            disabled={uploading}
                        />
                    </div>

                    {/* Department */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
                            Department *
                        </label>
                        <select
                            value={selectedDepartment}
                            onChange={(e) => {
                                setSelectedDepartment(e.target.value);
                                setFormData({ ...formData, courseCode: '', semester: '' });
                            }}
                            required
                            disabled={uploading}
                        >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>
                                    {dept} - {departmentNames[dept] || dept}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Course Code */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
                            Course Code *
                        </label>
                        <select
                            value={formData.courseCode}
                            onChange={(e) => handleCourseCodeChange(e.target.value)}
                            required
                            disabled={!selectedDepartment || uploading}
                        >
                            <option value="">Select Course Code</option>
                            {availableCourses.map(code => (
                                <option key={code} value={code}>{code}</option>
                            ))}
                        </select>
                    </div>

                    {/* Semester */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
                            Semester {formData.semester && '(Auto-detected)'}
                        </label>
                        <select
                            value={formData.semester}
                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                            disabled={uploading}
                        >
                            <option value="">Not specified</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                        </select>
                    </div>

                    {/* File Upload */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
                            File * (Max 10MB)
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.docx"
                            required
                            disabled={uploading}
                        />
                        {file && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                        )}
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{
                                background: 'var(--input-bg)',
                                borderRadius: '0.5rem',
                                height: '0.5rem',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(to right, var(--primary), #ff4500)',
                                    height: '100%',
                                    width: `${uploadProgress}%`,
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                Uploading... {uploadProgress}%
                            </p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            color: 'var(--error)'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                <span>Upload Note</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
