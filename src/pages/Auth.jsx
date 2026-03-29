import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Hash, User, AlertCircle } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const { signIn, signUp, googleSignIn, user } = useAuth();
    const navigate = useNavigate();

    // Form States
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [regNo, setRegNo] = useState(''); // Serves as "Email or RegNo" for login
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        setInitialLoad(false);
    }, []);

    useEffect(() => {
        if (user && !initialLoad) {
            navigate('/');
        }
    }, [user, navigate, initialLoad]);

    // Google Sign In Handler
    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            const { error } = await googleSignIn();
            if (error) throw error;
        } catch (err) {
            console.error('Google Sign In Error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

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

        const cleanPassword = password;

        if (isLogin) {
            // LOGIN FLOW
            const loginInput = regNo.trim(); // This can be email or regNo
            if (!loginInput || !cleanPassword) {
                setError('Please fill in all fields.');
                setLoading(false);
                return;
            }

            try {
                let signInEmail = loginInput;

                // Check if input is NOT an email (assuming Reg No doesn't have @)
                if (!loginInput.includes('@')) {
                    // It's a Registration Number
                    // Always use regNo@cgpa.app format for authentication
                    signInEmail = `${loginInput.toLowerCase()}@cgpa.app`;
                }

                const { error } = await signIn({
                    email: signInEmail,
                    password: cleanPassword
                });

                if (error) throw error;
                navigate('/');
            } catch (err) {
                console.error('Login Error:', err);
                setError('Invalid credentials or user not found.');
            } finally {
                setLoading(false);
            }

        } else {
            // SIGN UP FLOW
            const cleanRegNo = regNo.trim();
            const cleanEmail = email.trim();
            const cleanFullName = fullName.trim();

            if (!cleanRegNo || !cleanPassword || !cleanEmail || !cleanFullName) {
                setError('Please fill in all fields.');
                setLoading(false);
                return;
            }

            if (cleanPassword.length < 6) {
                setError('Password must be at least 6 characters');
                setLoading(false);
                return;
            }
            if (cleanPassword !== confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }

            try {
                // 0. Pre-check: Ensure Registration Number is unique
                // Note: This relies on 'profiles' being readable. If RLS blocks this, 
                // we might need a stored procedure or rely on DB unique constraint failure.
                const { supabase } = await import('../lib/supabase');
                const { data: existingUser, error: checkError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('registration_number', cleanRegNo)
                    .maybeSingle();

                if (existingUser) {
                    setError('This Registration Number is already associated with another account.');
                    setLoading(false);
                    return;
                }

                // 1. Sign Up the user
                const { data: authData, error: authError } = await signUp({
                    email: cleanEmail,
                    password: cleanPassword,
                    options: {
                        data: {
                            full_name: cleanFullName,
                            registration_number: cleanRegNo
                        }
                    }
                });

                if (authError) throw authError;

                if (authData?.user) {
                    // 2. Create Profile
                    // Note: If you have a trigger, this might fail or duplicate. 
                    // We will attempt to upsert just in case.
                    const { supabase } = await import('../lib/supabase');

                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: authData.user.id,
                            email: cleanEmail,
                            full_name: cleanFullName,
                            registration_number: cleanRegNo,
                            updated_at: new Date()
                        }, { onConflict: 'id' });

                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                        // Don't block signup success, but maybe warn
                    }
                }

                alert('Account created successfully! You can now sign in.');
                setIsLogin(true);
                setConfirmPassword('');
                setPassword('');
                // Keep regNo/email populated for convenience? Or clear them.
                // clear all for fresh login
                setFullName('');
                setEmail('');
                setRegNo('');
            } catch (err) {
                console.error('Signup Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
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

                {/* Google Sign In Button - Only show on Login or Top */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    type="button"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem',
                        borderRadius: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--text)',
                        marginBottom: '1.5rem',
                        transition: 'all 0.2s',
                        background: 'var(--surface-light)',
                        border: '1px solid var(--border)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                    <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                    </svg>
                    Continue with Google
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem'
                }}>
                    <div style={{ height: '1px', flex: 1, background: 'var(--border)' }}></div>
                    OR
                    <div style={{ height: '1px', flex: 1, background: 'var(--border)' }}></div>
                </div>

                {isLogin ? (
                    <LoginForm
                        regNo={regNo} // Acts as Email/RegNo input
                        password={password}
                        loading={loading}
                        onRegNoChange={setRegNo}
                        onPasswordChange={setPassword}
                        onSubmit={handleSubmit}
                    />
                ) : (
                    <SignupForm
                        fullName={fullName}
                        email={email}
                        regNo={regNo}
                        password={password}
                        confirmPassword={confirmPassword}
                        loading={loading}
                        onFullNameChange={setFullName}
                        onEmailChange={setEmail}
                        onRegNoChange={setRegNo}
                        onPasswordChange={setPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        onSubmit={handleSubmit}
                    />
                )}

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
