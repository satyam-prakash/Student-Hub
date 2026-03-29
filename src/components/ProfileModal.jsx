import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Hash, Lock, X, Loader2, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import './ProfileModal.css';

export default function ProfileModal({ show, onClose }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'security'
    const [profile, setProfile] = useState(null);

    // Form States
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    // Password States
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Messages
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show && user) {
            setLoading(true);
            fetchProfile();
            resetForms();
        }
    }, [show, user]);

    const resetForms = () => {
        setError(null);
        setMessage(null);
        setPassword('');
        setConfirmPassword('');
        setActiveTab('personal');
    };

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setProfile(data);
            setFullName(data.full_name || '');
            setEmail(user.email || '');
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);
        setMessage(null);

        try {
            // Build updates object
            const updates = { full_name: fullName };

            // Update email in profiles table (real email for display/contact)
            if (email !== user.email) {
                updates.email = email;
            }

            // Update Profiles Table
            const { error: profileError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (profileError) throw profileError;

            setMessage('Profile updated successfully.');

            // Refresh local profile data
            setProfile(prev => ({ ...prev, full_name: fullName, email: email }));

        } catch (err) {
            console.error('Error updating profile:', err);
            if (err.message && err.message.includes('already been registered')) {
                setError('This email is already linked to another account. Please sign out and log in with this email.');
            } else {
                setError(err.message);
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setUpdating(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setUpdating(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;

            setMessage("Password updated successfully.");
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Error updating password:', err);
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (!show) return null;

    return (
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal-content" onClick={e => e.stopPropagation()}>

                {/* Header / Banner */}
                <div className="profile-header">
                    <div className="profile-banner"></div>
                    <button className="profile-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>

                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            <User size={40} />
                        </div>
                    </div>

                    <div className="profile-title-section">
                        {loading ? (
                            <div className="loading-placeholder">Loading...</div>
                        ) : (
                            <>
                                <h2 className="profile-name">{profile?.full_name || 'Student'}</h2>
                                <div className="profile-reg-no">
                                    <Hash size={14} />
                                    <span>{profile?.registration_number}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('personal')}
                    >
                        Personal Details
                    </button>
                    <button
                        className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        Security
                    </button>
                </div>

                {/* Body */}
                <div className="profile-body">

                    {/* Notifications */}
                    {error && (
                        <div className="notification-box error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {message && (
                        <div className="notification-box success">
                            <CheckCircle size={18} />
                            <span>{message}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-container">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : (
                        <>
                            {/* Personal Details Tab */}
                            {activeTab === 'personal' && (
                                <form onSubmit={handleUpdateProfile} className="profile-form">
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <div className="form-input-wrapper">
                                            <User className="form-icon" size={18} />
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <div className="form-input-wrapper">
                                            <Mail className="form-icon" size={18} />
                                            <input
                                                type="email"
                                                className="form-input"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                        {user.email && user.email.includes('@cgpa.app') && (
                                            <div className="warning-box">
                                                <AlertCircle size={16} />
                                                <span>You are using a placeholder email. Please update to your real email to secure your account.</span>
                                            </div>
                                        )}

                                        {/* Show Pending Email Change */}
                                        {user.new_email && (
                                            <div className="notification-box info mt-2">
                                                <Mail size={16} />
                                                <span>
                                                    <strong>Pending Change:</strong> Check your inbox at <u>{user.new_email}</u> to confirm.
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Registration Number</label>
                                        <div className="form-input-wrapper">
                                            <Hash className="form-icon" size={18} />
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={profile?.registration_number || ''}
                                                disabled
                                                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                            />
                                        </div>
                                        <span className="helper-text">Registration number cannot be changed.</span>
                                    </div>

                                    <div className="action-row">
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={updating}
                                        >
                                            {updating ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <form onSubmit={handleUpdatePassword} className="profile-form">

                                    <div className="security-banner">
                                        <div className="security-icon-wrapper">
                                            <Shield size={20} />
                                        </div>
                                        <div className="security-text">
                                            <h4>Secure your account</h4>
                                            <p>Use a strong password to keep your academic data safe.</p>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <div className="form-input-wrapper">
                                            <Lock className="form-icon" size={18} />
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Confirm Password</label>
                                        <div className="form-input-wrapper">
                                            <Lock className="form-icon" size={18} />
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div className="action-row">
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={updating || !password || !confirmPassword}
                                        >
                                            {updating ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
