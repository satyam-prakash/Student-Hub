import { Hash, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function LoginForm({ regNo, password, loading, onRegNoChange, onPasswordChange, onSubmit }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', marginLeft: '0.25rem', color: 'var(--text-secondary)' }}>
                    Email or Registration Number
                </label>
                <div style={{ position: 'relative' }}>
                    <Hash
                        size={18}
                        style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                    />
                    <input
                        type="text"
                        value={regNo}
                        onChange={(e) => onRegNoChange(e.target.value)}
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
                        placeholder="e.g. 12345678 or email@example.com"
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
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        style={{
                            width: '100%',
                            paddingLeft: '3rem',
                            paddingRight: '3rem',
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
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.25rem',
                            borderRadius: '0.375rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--primary)';
                            e.currentTarget.style.background = 'rgba(255, 102, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.background = 'none';
                        }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

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
                        Sign In
                        <ArrowRight size={20} />
                    </>
                )}
            </button>
        </form>
    );
}
