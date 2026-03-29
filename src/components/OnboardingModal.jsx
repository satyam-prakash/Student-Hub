import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Hash, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import './ProfileModal.css'; // Reuse existing styles

export default function OnboardingModal({ show, onComplete }) {
    const { user } = useAuth();
    const [regNo, setRegNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!regNo.trim()) {
            setError('Please enter your Registration Number.');
            return;
        }

        setLoading(true);

        try {
            // Check if Reg No is already taken
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('registration_number', regNo)
                .maybeSingle();

            if (existingUser) {
                throw new Error('This Registration Number is already associated with another account.');
            }

            // Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ registration_number: regNo })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Notify parent to refresh/close
            onComplete(regNo);

        } catch (err) {
            console.error('Onboarding error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="profile-modal-overlay"> {/* Reuse overlay style */}
            <div className="profile-modal-content max-w-md"> {/* Reuse content style */}

                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <Hash size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
                        <p className="text-zinc-400">Please enter your Registration Number to complete your profile setup.</p>
                    </div>

                    {error && (
                        <div className="notification-box error mb-4">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-group">
                            <label className="form-label">Registration Number</label>
                            <div className="form-input-wrapper">
                                <Hash className="form-icon" size={18} />
                                <input
                                    type="text"
                                    className="form-input"
                                    value={regNo}
                                    onChange={(e) => setRegNo(e.target.value)}
                                    placeholder="e.g., 12345678"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    <span>Complete Setup</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
