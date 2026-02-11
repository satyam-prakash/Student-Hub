import { useState, useEffect } from 'react';

export default function CircularProgress({ value, max, color, size = 100 }) {
    const [progress, setProgress] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(value), 50);
        return () => clearTimeout(timer);
    }, [value]);

    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - ((progress / max) * circumference);

    // Hover effects
    const currentStrokeWidth = isHovered ? 4 : 8;
    const textScale = isHovered ? 1.2 : 1;

    return (
        <div
            style={{ position: 'relative', width: size, height: size, cursor: 'default' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <svg
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transform: 'rotate(-90deg)',
                    overflow: 'visible'
                }}
            >
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    stroke="var(--border)"
                    strokeWidth={currentStrokeWidth}
                    fill="transparent"
                    style={{ transition: 'stroke-width 0.3s ease-in-out' }}
                />
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    stroke={color}
                    strokeWidth={currentStrokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                        transition: 'stroke-dashoffset 1s ease-out, stroke-width 0.3s ease-in-out'
                    }}
                />
            </svg>
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    pointerEvents: 'none'
                }}
            >
                <span
                    style={{
                        fontSize: 'clamp(1rem, 4vw, 1.5rem)',
                        fontWeight: 'bold',
                        color: 'var(--text)',
                        textAlign: 'center',
                        transform: `scale(${textScale})`,
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                >
                    {typeof value === 'number' ? value.toFixed(2) : '0.00'}
                </span>
            </div>
        </div>
    );
}
