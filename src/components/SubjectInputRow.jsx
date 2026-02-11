import { X } from 'lucide-react';

export default function SubjectInputRow({ subject, index, onUpdate, onDelete }) {
    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1rem',
            borderRadius: '0.75rem',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            position: 'relative'
        }}>
            <input
                placeholder="Subject Name"
                value={subject.name}
                onChange={e => onUpdate(index, 'name', e.target.value)}
                style={{
                    flex: '2 1 200px',
                    minWidth: '0',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text)'
                }}
            />
            <div style={{ display: 'flex', flex: '1 1 300px', gap: '1rem' }}>
                <input
                    type="number"
                    placeholder="Attended"
                    value={subject.attended === 0 ? '' : subject.attended}
                    onChange={e => onUpdate(index, 'attended', e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text)'
                    }}
                />
                <input
                    type="number"
                    placeholder="Duty Leave"
                    value={subject.dutyLeave === 0 ? '' : subject.dutyLeave}
                    onChange={e => onUpdate(index, 'dutyLeave', e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text)'
                    }}
                />
                <input
                    type="number"
                    placeholder="Total Classes"
                    value={subject.total === 0 ? '' : subject.total}
                    onChange={e => onUpdate(index, 'total', e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text)'
                    }}
                />
            </div>
            <button
                onClick={() => onDelete(index)}
                style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    right: '-0.5rem',
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: 'white',
                    border: '2px solid var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#dc2626';
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Delete subject"
            >
                <X size={16} />
            </button>
        </div>
    );
}
