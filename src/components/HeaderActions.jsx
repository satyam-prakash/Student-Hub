import { LogOut } from 'lucide-react';

export default function HeaderActions({ mobile = false, onAction }) {
    const buttonStyle = (variant) => {
        const base = {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            padding: mobile ? '0.75rem' : '0.5rem 1rem',
            borderRadius: mobile ? '0.5rem' : '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            width: mobile ? '100%' : 'auto',
            justifyContent: mobile ? 'center' : 'flex-start'
        };

        if (variant === 'load') {
            return {
                ...base,
                color: 'var(--text-secondary)',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)'
            };
        } else if (variant === 'save') {
            return {
                ...base,
                color: '#ffffff',
                background: 'var(--primary)',
                border: 'none'
            };
        } else if (variant === 'logout') {
            return {
                ...base,
                color: 'var(--error)',
                background: mobile ? 'rgba(239, 68, 68, 0.1)' : 'none',
                border: 'none',
                padding: mobile ? '0.75rem' : '0',
                marginTop: mobile ? '1rem' : '0'
            };
        }
    };

    return (
        <>
            <button
                onClick={() => onAction('load')}
                style={buttonStyle('load')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Load</span>
            </button>

            <button
                onClick={() => onAction('save')}
                style={buttonStyle('save')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>Save</span>
            </button>

            <button
                onClick={() => onAction('logout')}
                style={buttonStyle('logout')}
            >
                <LogOut size={16} />
                <span>Logout</span>
            </button>
        </>
    );
}
