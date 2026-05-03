import { Plus } from 'lucide-react';

/**
 * ResponsiveNavigation - Desktop sidebar + Mobile bottom bar
 * Desktop: Left sidebar with vertical nav items
 * Mobile: Bottom bar with FAB in center for adding expense
 */
export default function ResponsiveNavigation({ 
    tabs, 
    activeTab, 
    onTabChange, 
    onAddExpense, 
    isMobile 
}) {
    
    // Desktop Sidebar
    if (!isMobile) {
        return (
            <aside 
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: '220px',
                    height: '100vh',
                    background: 'var(--surface)',
                    borderRight: '1px solid var(--border)',
                    padding: '1.5rem 0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    zIndex: 100,
                    backdropFilter: 'blur(12px)',
                    backgroundColor: 'rgba(var(--surface-rgb), 0.95)',
                }}
                aria-label="Main navigation"
            >
                {/* Logo/Brand */}
                <div style={{ 
                    padding: '0.75rem 1rem', 
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--border)'
                }}>
                    <h1 style={{ 
                        fontSize: '1.4rem', 
                        margin: 0,
                        background: 'linear-gradient(135deg, var(--primary), #cc4400)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 800
                    }}>
                        StudentHub
                    </h1>
                    <p style={{ 
                        margin: 0, 
                        fontSize: '0.7rem', 
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem'
                    }}>
                        Expense Tracker
                    </p>
                </div>

                {/* Navigation Items */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => onTabChange(tab.key)}
                                aria-label={`Navigate to ${tab.label}`}
                                aria-current={isActive ? 'page' : undefined}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: isActive ? 700 : 600,
                                    transition: 'all 0.2s ease',
                                    background: isActive 
                                        ? 'linear-gradient(135deg, var(--primary), #cc4400)' 
                                        : 'transparent',
                                    color: isActive ? '#fff' : 'var(--text-secondary)',
                                    boxShadow: isActive ? '0 4px 12px rgba(255,102,0,0.25)' : 'none',
                                    textAlign: 'left',
                                    width: '100%',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'var(--input-bg)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                    {tab.icon}
                                </span>
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Add Expense Button (Desktop) */}
                <button
                    onClick={onAddExpense}
                    aria-label="Add new expense"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.875rem 1rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                        transition: 'all 0.2s ease',
                        marginTop: 'auto',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';
                    }}
                >
                    <Plus size={18} />
                    Add Expense
                </button>
            </aside>
        );
    }

    // Mobile Bottom Bar
    return (
        <>
            {/* Mobile Bottom Navigation */}
            <nav 
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '70px',
                    background: 'var(--surface)',
                    borderTop: '1px solid var(--border)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 80px 1fr 1fr',
                    alignItems: 'center',
                    padding: '0 0.5rem',
                    zIndex: 100,
                    backdropFilter: 'blur(16px)',
                    backgroundColor: 'rgba(var(--surface-rgb), 0.95)',
                    boxShadow: '0 -2px 12px rgba(0,0,0,0.1)',
                }}
                aria-label="Main navigation"
            >
                {/* First 2 tabs */}
                {tabs.slice(0, 2).map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            aria-label={`Navigate to ${tab.label}`}
                            aria-current={isActive ? 'page' : undefined}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.5rem',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <span style={{ 
                                display: 'flex', 
                                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.2s ease'
                            }}>
                                {tab.icon}
                            </span>
                            <span style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: isActive ? 700 : 600,
                                whiteSpace: 'nowrap'
                            }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}

                {/* Center FAB (Floating Action Button) */}
                <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    <button
                        onClick={onAddExpense}
                        aria-label="Add new expense"
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
                            position: 'absolute',
                            bottom: '20px',
                            transition: 'all 0.2s ease',
                        }}
                        onTouchStart={(e) => {
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onTouchEnd={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>

                {/* Last 2 tabs */}
                {tabs.slice(2, 4).map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            aria-label={`Navigate to ${tab.label}`}
                            aria-current={isActive ? 'page' : undefined}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.5rem',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <span style={{ 
                                display: 'flex', 
                                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.2s ease'
                            }}>
                                {tab.icon}
                            </span>
                            <span style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: isActive ? 700 : 600,
                                whiteSpace: 'nowrap'
                            }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Mobile Spacer */}
            <div style={{ height: '80px' }} aria-hidden="true" />
        </>
    );
}
