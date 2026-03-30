import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useMediaQuery } from '../utils/useMediaQuery';
import ThemeSwitcher from './ThemeSwitcher';
import NavigationLinks from './NavigationLinks';
import HeaderActions from './HeaderActions';
import MobileDrawer from './MobileDrawer';
import OnboardingModal from './OnboardingModal';
import ProfileModal from './ProfileModal';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

export default function Layout() {
    const { user, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [profile, setProfile] = useState(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Fetch profile to check for PENDING status
    useEffect(() => {
        if (user) {
            supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()
                .then(({ data }) => {
                    if (data) {
                        setProfile(data);
                        if (data.registration_number?.startsWith('PENDING_')) {
                            setShowOnboarding(true);
                        }
                    }
                });
        }
    }, [user]);

    const handleOnboardingComplete = (newRegNo) => {
        setProfile(prev => ({ ...prev, registration_number: newRegNo }));
        setShowOnboarding(false);
        // Dispatch global event to update other components if needed
        window.dispatchEvent(new CustomEvent('profileUpdated'));
    };

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
        } else if (action === 'profile') {
            setShowProfileModal(true);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* ... Navbar code ... */}
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
                        <img src="/studenthub_logo.svg" alt="StudentHub Logo" style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />
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
                                    <button
                                        onClick={() => setShowProfileModal(true)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.875rem',
                                            color: 'var(--text-secondary)',
                                            fontWeight: '500',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                        title="View Profile"
                                    >
                                        <User size={16} />
                                        <span>{profile?.registration_number || user.user_metadata?.registration_number || user.email?.split('@')[0]}</span>
                                    </button>
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

            <ProfileModal
                show={showProfileModal}
                onClose={() => setShowProfileModal(false)}
            />

            <OnboardingModal
                show={showOnboarding}
                onComplete={handleOnboardingComplete}
            />
        </div>
    );
}
