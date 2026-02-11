import { X, User } from 'lucide-react';
import NavigationLinks from './NavigationLinks';
import HeaderActions from './HeaderActions';
import ThemeSwitcher from './ThemeSwitcher';

export default function MobileDrawer({ isOpen, onClose, user, onAction }) {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 90
                    }}
                />
            )}

            {/* Drawer */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '280px',
                    backgroundColor: 'var(--surface)',
                    borderLeft: '1px solid var(--border)',
                    padding: '2rem 1.5rem',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                    boxShadow: '-4px 0 24px rgba(0,0,0,0.5)'
                }}
            >
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Menu</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* User Info Mobile */}
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--input-bg)' }}>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <User size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-secondary uppercase font-bold">Logged in as</span>
                        <span className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                            {user?.user_metadata?.registration_number || user?.email?.split('@')[0]}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <NavigationLinks mobile={true} onNavigate={onClose} />
                </div>

                <div className="flex justify-between items-center py-2 border-t border-b border-[var(--border)]">
                    <span style={{ color: 'var(--text)' }}>Theme</span>
                    <ThemeSwitcher />
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                    <HeaderActions mobile={true} onAction={(action) => { onAction(action); onClose(); }} />
                </div>
            </div>
        </>
    );
}
