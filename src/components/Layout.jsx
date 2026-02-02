import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, GraduationCap, Calculator, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useMediaQuery } from '../utils/useMediaQuery';

import ThemeSwitcher from './ThemeSwitcher';

export default function Layout() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const handleSignOut = async () => {
        try {
            await signOut();
            // navigate('/auth', { replace: true }); // Removed to let ProtectedRoute handle redirect
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    // Common Nav Links Component
    const NavLinks = ({ mobile = false }) => (
        <>
            <Link
                to="/"
                onClick={mobile ? closeMenu : undefined}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: location.pathname === '/' ? 'var(--primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    padding: mobile ? '0.75rem 0' : '0',
                    borderBottom: mobile ? '1px solid var(--border)' : 'none',
                    fontSize: mobile ? '1.1rem' : 'inherit'
                }}
            >
                <Calculator size={mobile ? 20 : 18} />
                <span>Attendance</span>
            </Link>
            <Link
                to="/cgpa"
                onClick={mobile ? closeMenu : undefined}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: location.pathname === '/cgpa' ? 'var(--primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    padding: mobile ? '0.75rem 0' : '0',
                    borderBottom: mobile ? '1px solid var(--border)' : 'none',
                    fontSize: mobile ? '1.1rem' : 'inherit'
                }}
            >
                <GraduationCap size={mobile ? 20 : 18} />
                <span>CGPA</span>
            </Link>
        </>
    );

    // Common Action Buttons Component
    const ActionButtons = ({ mobile = false }) => (
        <>
            <button
                onClick={() => {
                    const event = new CustomEvent('globalLoad');
                    window.dispatchEvent(event);
                    if (mobile) closeMenu();
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: mobile ? '100%' : 'auto',
                    justifyContent: mobile ? 'center' : 'flex-start'
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Load</span>
            </button>

            <button
                onClick={() => {
                    const event = new CustomEvent('globalSave');
                    window.dispatchEvent(event);
                    if (mobile) closeMenu();
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#ffffff',
                    background: 'var(--primary)',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: mobile ? '100%' : 'auto',
                    justifyContent: mobile ? 'center' : 'flex-start'
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>Save</span>
            </button>

            <button
                onClick={() => {
                    handleSignOut();
                    if (mobile) closeMenu();
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--error)',
                    background: mobile ? 'rgba(239, 68, 68, 0.1)' : 'none',
                    border: 'none',
                    padding: mobile ? '0.75rem' : '0',
                    borderRadius: mobile ? '0.5rem' : '0',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                    width: mobile ? '100%' : 'auto',
                    justifyContent: mobile ? 'center' : 'flex-start',
                    marginTop: mobile ? '1rem' : '0'
                }}
            >
                <LogOut size={16} />
                <span>Logout</span>
            </button>
        </>
    );

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
                            <NavLinks />
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
                                    <ActionButtons />
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
                    <button onClick={toggleMenu} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}
            </nav>

            {/* Mobile Side Panel (Drawer) */}
            {isMobile && (
                <>
                    {/* Backdrop */}
                    {isMenuOpen && (
                        <div
                            onClick={closeMenu}
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
                            transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
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
                            <button onClick={closeMenu} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
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
                                    {user.user_metadata?.registration_number || user.email?.split('@')[0]}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <NavLinks mobile={true} />
                        </div>

                        <div className="flex justify-between items-center py-2 border-t border-b border-[var(--border)]">
                            <span style={{ color: 'var(--text)' }}>Theme</span>
                            <ThemeSwitcher />
                        </div>

                        <div className="flex flex-col gap-3 mt-auto">
                            <ActionButtons mobile={true} />
                        </div>
                    </div>
                </>
            )}

            <main className="flex-1 p-6 container mx-auto max-w-7xl">
                <Outlet />
            </main>

            <footer className="border-t border-gray-800 py-6 text-center text-gray-600 text-sm">
                <p>© {new Date().getFullYear()} StudentHub. Built for excellence.</p>
            </footer>
        </div>
    );
}
