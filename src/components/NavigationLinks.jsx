import { Link, useLocation } from 'react-router-dom';
import { Calculator, GraduationCap, FileText, Wallet } from 'lucide-react';

export default function NavigationLinks({ mobile = false, onNavigate }) {
    const location = useLocation();

    const linkStyle = (isActive) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
        textDecoration: 'none',
        transition: 'color 0.2s',
        padding: mobile ? '0.75rem 0' : '0',
        borderBottom: mobile ? '1px solid var(--border)' : 'none',
        fontSize: mobile ? '1.1rem' : 'inherit'
    });

    return (
        <>
            <Link
                to="/"
                onClick={onNavigate}
                style={linkStyle(location.pathname === '/')}
            >
                <Calculator size={mobile ? 20 : 18} />
                <span>Attendance</span>
            </Link>
            <Link
                to="/cgpa"
                onClick={onNavigate}
                style={linkStyle(location.pathname === '/cgpa')}
            >
                <GraduationCap size={mobile ? 20 : 18} />
                <span>CGPA</span>
            </Link>
            <Link
                to="/notes"
                onClick={onNavigate}
                style={linkStyle(location.pathname === '/notes')}
            >
                <FileText size={mobile ? 20 : 18} />
                <span>Notes</span>
            </Link>
            <Link
                to="/expenses"
                onClick={onNavigate}
                style={linkStyle(location.pathname === '/expenses')}
            >
                <Wallet size={mobile ? 20 : 18} />
                <span>Expenses</span>
            </Link>
        </>
    );
}
