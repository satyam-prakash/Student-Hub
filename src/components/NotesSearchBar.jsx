import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCourseCodesByDepartment, departmentNames } from '../utils/courseCodeUtils';
import '../pages/NotesPage.css';

export default function NotesSearchBar({ onSearch }) {
    const [searchText, setSearchText] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedCourseCode, setSelectedCourseCode] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');

    const coursesByDept = getCourseCodesByDepartment();
    const departments = Object.keys(coursesByDept).sort();
    const availableCourses = selectedDepartment ? coursesByDept[selectedDepartment] || [] : [];

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

    return (
        <div className="search-filter-container">
            {/* Search Input */}
            <div className="search-input-group">
                <div className="search-icon-absolute">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Search by title, topic, or author..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="notes-search-input"
                />
            </div>

            {/* Filters */}
            <div className="filters-scroll-container">
                <select
                    value={selectedDepartment}
                    onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setSelectedCourseCode('');
                    }}
                    className="notes-select"
                >
                    <option value="">Department</option>
                    {departments.map(dept => (
                        <option key={dept} value={dept}>
                            {dept} - {departmentNames[dept] || dept}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedCourseCode}
                    onChange={(e) => setSelectedCourseCode(e.target.value)}
                    disabled={!selectedDepartment}
                    className="notes-select"
                    style={!selectedDepartment ? { opacity: 0.6 } : {}}
                >
                    <option value="">Subject</option>
                    {availableCourses.map(code => (
                        <option key={code} value={code}>{code}</option>
                    ))}
                </select>

                <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="notes-select"
                >
                    <option value="">Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
