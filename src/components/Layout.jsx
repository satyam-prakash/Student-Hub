import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useMediaQuery } from '../utils/useMediaQuery';
import ThemeSwitcher from './ThemeSwitcher';
import NavigationLinks from './NavigationLinks';
import HeaderActions from './HeaderActions';
import MobileDrawer from './MobileDrawer';

export default function Layout() {
    const { user, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleAction = (action) => {
        if (action === 'load') {
            const event = new CustomEvent('globalLoad');
            window.dispatchEvent(event);
        } else if (action === 'save') {
            const event = new CustomEvent('globalSave');
            window.dispatchEvent(event);
        } else if (action === 'logout') {
            handleSignOut();
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <nav style={{
                backgroundColor: 'var(--background)',
                borderBottom: '1px solid var(--border)',
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                backdropFilter: 'blur(8px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <GraduationCap style={{ color: 'var(--primary)', width: '2rem', height: '2rem' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)', letterSpacing: '-0.025em' }}>
                            Student<span style={{ color: 'var(--primary)' }}>Hub</span>
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    {!isMobile && user && (
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <NavigationLinks />
                        </div>
                    )}
                </div>

                {/* Desktop Actions */}
                {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <ThemeSwitcher />
                        {user ? (
                            <>
                                <div style={{ height: '1.5rem', width: '1px', backgroundColor: 'var(--border)' }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                        {user.user_metadata?.registration_number || user.email?.split('@')[0]}
                                    </span>
                                    <HeaderActions onAction={handleAction} />
                                </div>
                            </>
                        ) : (
                            <Link to="/auth" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
                                <User size={18} />
                                <span>Login</span>
                            </Link>
                        )}
                    </div>
                )}

                {/* Mobile Menu Button */}
                {isMobile && user && (
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}
            </nav>

            {/* Mobile Drawer */}
            {isMobile && (
                <MobileDrawer
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    user={user}
                    onAction={handleAction}
                />
            )}

            <main className="flex-1 p-6 w-full">
                <Outlet />
            </main>

            <footer className="border-t border-gray-800 py-6 text-center text-gray-600 text-sm">
                <p>© {new Date().getFullYear()} StudentHub. Built for excellence.</p>
            </footer>
        </div>
    );
}
