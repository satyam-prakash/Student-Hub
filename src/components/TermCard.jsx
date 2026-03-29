import { Trash2, Plus } from 'lucide-react';

export default function TermCard({
    term,
    termIndex,
    stats,
    isMobile,
    onCourseChange,
    onDeleteCourse,
    onDeleteTerm,
    onAddCourse
}) {
    return (
        <div className="term-card">
            {/* Header */}
            <div className="term-header">
                <h2 className="term-title">Term {term.termNumber}</h2>
                <div className="term-stats-mini">
                    <div className="mini-stat">
                        <span className="mini-label">Actual</span>
                        <span className="mini-value val-actual">
                            {stats.termStats && stats.termStats[termIndex]?.tgpa
                                ? stats.termStats[termIndex].tgpa.toFixed(2)
                                : '0.00'
                            }
                        </span>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-label">Target</span>
                        <span className="mini-value val-target">
                            {stats.targetTermStats && stats.targetTermStats[termIndex]?.tgpa
                                ? stats.targetTermStats[termIndex].tgpa.toFixed(2)
                                : '0.00'
                            }
                        </span>
                    </div>
                    <button
                        className="btn-icon"
                        onClick={() => onDeleteTerm(termIndex)}
                        title="Delete Term"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="course-grid-header">
                <div className="col-span-1">Subject / Elective</div>
                <div className="col-span-1 text-center">Cr</div>
                <div className="col-span-1 text-center">Actual</div>
                <div className="col-span-1 text-center">Target</div>
                <div className="col-span-1 text-right">Act</div>
            </div>

            {/* Courses List */}
            <div className="mb-2">
                {term.courses.map((course, cIndex) => (
                    <div key={course.id} className="course-row">
                        {/* Subject Name / Elective Select */}
                        <div>
                            {course.isElective && course.options && course.options.length > 0 ? (
                                <select
                                    className="cgpa-select w-full"
                                    value={course.code || ''}
                                    onChange={(e) => {
                                        const selectedCode = e.target.value;
                                        // Update both code and name to the selected value
                                        onCourseChange(termIndex, cIndex, 'code', selectedCode);
                                        onCourseChange(termIndex, cIndex, 'name', selectedCode);
                                    }}
                                >
                                    <option value="">Select {course.name.split('SLOT')[0] || 'Elective'}</option>
                                    {course.options.map((optCode) => (
                                        <option key={optCode} value={optCode}>
                                            {optCode}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    className="cgpa-input"
                                    type="text"
                                    value={course.name}
                                    onChange={(e) => onCourseChange(termIndex, cIndex, 'name', e.target.value)}
                                    placeholder="e.g. CSE101"
                                />
                            )}
                        </div>
                        {/* Credits */}
                        <div>
                            <input
                                className="cgpa-input text-center"
                                type="number"
                                value={course.credits}
                                onChange={(e) => onCourseChange(termIndex, cIndex, 'credits', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                            />
                        </div>
                        {/* Actual Grade */}
                        <div>
                            <select
                                className="cgpa-select"
                                value={course.actualGrade}
                                onChange={(e) => onCourseChange(termIndex, cIndex, 'actualGrade', e.target.value)}
                            >
                                <option value="">-</option>
                                <option value="O">O</option>
                                <option value="A+">A+</option>
                                <option value="A">A</option>
                                <option value="B+">B+</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                                <option value="F">F</option>
                            </select>
                        </div>
                        {/* Target Grade */}
                        <div>
                            <select
                                className="cgpa-select"
                                value={course.targetGrade || ''}
                                onChange={(e) => onCourseChange(termIndex, cIndex, 'targetGrade', e.target.value)}
                            >
                                <option value="">-</option>
                                <option value="O">O</option>
                                <option value="A+">A+</option>
                                <option value="A">A</option>
                                <option value="B+">B+</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                                <option value="F">F</option>
                            </select>
                        </div>
                        {/* Delete Action */}
                        <div className="text-right">
                            <button
                                className="btn-icon"
                                onClick={() => onDeleteCourse(termIndex, cIndex)}
                                title="Delete Subject"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Subject Button */}
            <button className="btn-add-subject" onClick={() => onAddCourse(termIndex)}>
                <Plus size={14} />
                <span>Add Custom Subject</span>
            </button>
        </div>
    );
}
