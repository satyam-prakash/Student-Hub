import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Hash, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [regNo, setRegNo] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);
    const { signIn, signUp, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setInitialLoad(false);
    }, []);

    useEffect(() => {
        if (user && !initialLoad) {
            navigate('/');
        }
    }, [user, navigate, initialLoad]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
            setError('Supabase is not configured. Please check your .env file.');
            setLoading(false);
            return;
        }

        const cleanRegNo = regNo.trim();
        const cleanPassword = password;
        const cleanConfirmPassword = confirmPassword;

        if (!cleanRegNo || !cleanPassword) {
            setError('Please fill in all fields.');
            setLoading(false);
            return;
        }

        if (!isLogin) {
            if (cleanPassword.length < 6) {
                setError('Password must be at least 6 characters');
                setLoading(false);
                return;
            }
            if (cleanPassword !== cleanConfirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }
        }

        const email = `${cleanRegNo.toLowerCase()}@cgpa.app`;

        try {
            if (isLogin) {
                const { error } = await signIn({
                    email: email,
                    password: cleanPassword
                });
                if (error) throw error;
                navigate('/');
            } else {
                const { error } = await signUp({
                    email: email,
                    password: cleanPassword,
                    options: {
                        data: {
                            registration_number: cleanRegNo
                        },
                        emailRedirectTo: null
                    }
                });

                if (error) throw error;

                alert('Account created successfully! You can now sign in.');
                setIsLogin(true);
                setConfirmPassword('');
                setPassword('');
            }
        } catch (err) {
            console.error('Auth Error:', err);
            let msg = err.message;
            if (msg.includes('Invalid login credentials')) {
                msg = 'Invalid credentials.';
            } else if (msg.includes('Email not confirmed')) {
                msg = 'Email not confirmed.';
            } else if (msg.includes('User already registered')) {
                msg = 'User already registered.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background ambient glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '500px',
                height: '500px',
                background: 'rgba(255, 102, 0, 0.1)',
                borderRadius: '50%',
                filter: 'blur(100px)',
                pointerEvents: 'none'
            }}></div>

            <div
                className="card animate-fade-in"
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    position: 'relative',
                    zIndex: 10,
                    padding: '2.5rem',
                    borderRadius: '1.5rem',
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(20px)'
                }}
            >
                {/* Decorative background element inside card */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    background: 'linear-gradient(to right, #ff6600, #ef4444)'
                }}></div>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '4rem',
                            height: '4rem',
                            borderRadius: '1rem',
                            marginBottom: '1.5rem',
                            background: 'var(--primary)',
                            color: 'white',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            transform: 'rotate(3deg)'
                        }}
                    >
                        {isLogin ? <User size={32} /> : <Hash size={32} />}
                    </div>
                    <h2
                        style={{
                            fontSize: '1.875rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                            background: 'linear-gradient(to right, var(--text), var(--text-secondary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            color: 'transparent'
                        }}
                    >
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isLogin ? 'Sign in to access your dashboard' : 'Join to track your progress'}
                    </p>
                </div>

                {error && (
                    <div
                        className="animate-shake"
                        style={{
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            fontSize: '0.875rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444'
                        }}
                    >
                        <AlertCircle size={18} style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', marginLeft: '0.25rem', color: 'var(--text-secondary)' }}>
                            Registration Number
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Hash
                                size={18}
                                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                            />
                            <input
                                type="text"
                                value={regNo}
                                onChange={(e) => setRegNo(e.target.value)}
                                style={{
                                    width: '100%',
                                    paddingLeft: '3rem',
                                    paddingRight: '1rem',
                                    paddingTop: '0.875rem',
                                    paddingBottom: '0.875rem',
                                    borderRadius: '0.75rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)'
                                }}
                                placeholder="e.g. 12345678"
                                required
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', marginLeft: '0.25rem', color: 'var(--text-secondary)' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock
                                size={18}
                                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    paddingLeft: '3rem',
                                    paddingRight: '1rem',
                                    paddingTop: '0.875rem',
                                    paddingBottom: '0.875rem',
                                    borderRadius: '0.75rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)'
                                }}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="animate-fade-in-up">
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', marginLeft: '0.25rem', color: 'var(--text-secondary)' }}>
                                Confirm Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock
                                    size={18}
                                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                                />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        paddingLeft: '3rem',
                                        paddingRight: '1rem',
                                        paddingTop: '0.875rem',
                                        paddingBottom: '0.875rem',
                                        borderRadius: '0.75rem',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text)'
                                    }}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.875rem',
                            borderRadius: '0.75rem',
                            fontWeight: 'bold',
                            color: 'white',
                            marginTop: '1rem',
                            transition: 'all 0.2s',
                            background: 'var(--primary)',
                            boxShadow: '0 10px 25px -5px rgba(255, 102, 0, 0.4)',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" size={20} /> Processing...</>
                        ) : (
                            <>
                                {isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                            setConfirmPassword('');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: '1px solid transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            paddingBottom: '0.125rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.color = 'var(--text)';
                            e.target.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.color = 'var(--text-secondary)';
                            e.target.style.borderColor = 'transparent';
                        }}
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}
