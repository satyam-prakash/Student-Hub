import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCourseCodesByDepartment, departmentNames } from '../utils/courseCodeUtils';

export default function NotesSearchBar({ onSearch }) {
    const [searchText, setSearchText] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedCourseCode, setSelectedCourseCode] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');

    // Get course codes grouped by department
    const coursesByDept = getCourseCodesByDepartment();
    const departments = Object.keys(coursesByDept).sort();

    // Get courses for selected department
    const availableCourses = selectedDepartment
        ? coursesByDept[selectedDepartment] || []
        : [];

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch({
                search: searchText,
                courseCode: selectedCourseCode,
                semester: selectedSemester
            });
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText, selectedCourseCode, selectedSemester]);

    const handleClearFilters = () => {
        setSearchText('');
        setSelectedDepartment('');
        setSelectedCourseCode('');
        setSelectedSemester('');
    };

    const hasFilters = searchText || selectedCourseCode || selectedSemester;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '2rem'
        }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
                <Search
                    size={20}
                    style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)'
                    }}
                />
                <input
                    type="text"
                    placeholder="Search notes by title, description, or course code..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                        paddingLeft: '3rem',
                        width: '100%'
                    }}
                />
            </div>

            {/* Filters Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem'
            }}>
                {/* Department Filter */}
                <select
                    value={selectedDepartment}
                    onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setSelectedCourseCode(''); // Reset course when department changes
                    }}
                >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                        <option key={dept} value={dept}>
                            {dept} - {departmentNames[dept] || dept}
                        </option>
                    ))}
                </select>

                {/* Course Code Filter */}
                <select
                    value={selectedCourseCode}
                    onChange={(e) => setSelectedCourseCode(e.target.value)}
                    disabled={!selectedDepartment}
                >
                    <option value="">All Courses</option>
                    {availableCourses.map(code => (
                        <option key={code} value={code}>{code}</option>
                    ))}
                </select>

                {/* Semester Filter */}
                <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                </select>

                {/* Clear Filters Button */}
                {hasFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <X size={16} />
                        <span>Clear Filters</span>
                    </button>
                )}
            </div>
        </div>
    );
}
