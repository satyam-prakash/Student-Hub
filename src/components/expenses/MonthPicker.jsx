import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

/**
 * MonthPicker - Select year and month to view historical dashboard/analytics
 */
export default function MonthPicker({ selectedDate, onDateChange, isMobile }) {
    const currentDate = new Date();
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const goToPreviousMonth = () => {
        const newDate = new Date(selectedYear, selectedMonth - 1, 1);
        onDateChange(newDate);
    };

    const goToNextMonth = () => {
        const newDate = new Date(selectedYear, selectedMonth + 1, 1);
        onDateChange(newDate);
    };

    const goToCurrentMonth = () => {
        onDateChange(new Date());
    };

    const isCurrentMonth = 
        selectedYear === currentDate.getFullYear() && 
        selectedMonth === currentDate.getMonth();

    const isFutureMonth = 
        selectedYear > currentDate.getFullYear() || 
        (selectedYear === currentDate.getFullYear() && selectedMonth > currentDate.getMonth());

    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: isMobile ? '0.5rem' : '0.75rem 1rem',
        background: 'var(--surface)',
        borderRadius: '0.875rem',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    };

    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
        background: 'var(--input-bg)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: 'var(--text)',
    };

    const disabledButtonStyle = {
        ...buttonStyle,
        opacity: 0.4,
        cursor: 'not-allowed',
    };

    return (
        <div style={containerStyle}>
            {/* Previous Month */}
            <button
                onClick={goToPreviousMonth}
                aria-label="Previous month"
                style={buttonStyle}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary)';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--input-bg)';
                    e.currentTarget.style.color = 'var(--text)';
                }}
            >
                <ChevronLeft size={18} />
            </button>

            {/* Current Month Display */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                minWidth: isMobile ? '120px' : '160px',
                textAlign: 'center',
            }}>
                <div style={{ 
                    fontSize: isMobile ? '0.9rem' : '1rem', 
                    fontWeight: 700,
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                }}>
                    <Calendar size={16} style={{ color: 'var(--primary)' }} />
                    {monthNames[selectedMonth]} {selectedYear}
                </div>
                {!isCurrentMonth && (
                    <div style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--text-secondary)',
                        marginTop: '0.15rem',
                    }}>
                        Historical View
                    </div>
                )}
            </div>

            {/* Next Month */}
            <button
                onClick={goToNextMonth}
                disabled={isFutureMonth}
                aria-label="Next month"
                style={isFutureMonth ? disabledButtonStyle : buttonStyle}
                onMouseEnter={(e) => {
                    if (!isFutureMonth) {
                        e.currentTarget.style.background = 'var(--primary)';
                        e.currentTarget.style.color = '#fff';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isFutureMonth) {
                        e.currentTarget.style.background = 'var(--input-bg)';
                        e.currentTarget.style.color = 'var(--text)';
                    }
                }}
            >
                <ChevronRight size={18} />
            </button>

            {/* Today/Current Month Quick Button */}
            {!isCurrentMonth && (
                <button
                    onClick={goToCurrentMonth}
                    aria-label="Go to current month"
                    style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--primary)',
                        background: 'rgba(var(--primary-rgb), 0.1)',
                        color: 'var(--primary)',
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        marginLeft: '0.25rem',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)';
                        e.currentTarget.style.color = 'var(--primary)';
                    }}
                >
                    {isMobile ? 'Today' : 'Current Month'}
                </button>
            )}
        </div>
    );
}
