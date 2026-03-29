import React, { useState, useEffect } from 'react';

export default function CircularProgress({ value, max = 10, color, size = 80 }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(value), 100);
        return () => clearTimeout(timer);
    }, [value]);

    const radius = 35; // Fixed radius for the SVG coordinate system
    const circumference = 2 * Math.PI * radius;
    // Ensure we don't exceed max or go below 0
    const normalizedProgress = Math.min(Math.max(progress, 0), max);
    const strokeDashoffset = circumference - ((normalizedProgress / max) * circumference);

    return (
        <div className="ring-container" style={{ width: size, height: size }}>
            <svg className="ring-svg" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                    className="ring-bg"
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                />
                {/* Progress Circle */}
                <circle
                    className="ring-progress"
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                />
            </svg>
            <div className="ring-value">
                {typeof value === 'number' ? value.toFixed(2) : '0.00'}
            </div>
        </div>
    );
}
