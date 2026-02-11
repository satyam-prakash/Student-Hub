import { Trash2 } from 'lucide-react';
import CourseRow from './CourseRow';

export default function TermCard({
    term,
    termIndex,
    stats,
    isMobile,
    loading,
    onCourseChange,
    onDeleteCourse,
    onDeleteTerm,
    onAddCourse
}) {
    return (
        <div className="card animate-fade-in relative border-t-4 border-t-primary/20" style={{ animationDelay: termIndex * 0.1 + 's' }}>
            <div className="flex justify-between items-center mb-6 pl-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="font-bold" style={{ color: 'var(--text)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
                    Term {term.termNumber}
                </h2>

                <div className="flex items-center gap-2" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                    {/* TGPA Display - Actual vs Target */}
                    <div className="flex items-center" style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
                        {/* Actual */}
                        <div className="flex flex-col items-center">
                            <div className="text-[10px] uppercase tracking-wider font-bold mb-0.5" style={{ color: 'var(--text-secondary)' }}>Actual</div>
                            <div className="text-xl font-bold leading-none" style={{ color: '#3B82F6' }}>
                                {stats.termStats && stats.termStats[termIndex]?.tgpa
                                    ? stats.termStats[termIndex].tgpa.toFixed(2)
                                    : '0.00'
                                }
                            </div>
                        </div>

                        {/* Target */}
                        <div className="flex flex-col items-center">
                            <div className="text-[10px] uppercase tracking-wider font-bold mb-0.5 text-green-500/80">Target</div>
                            <div className="text-xl font-bold leading-none" style={{ color: '#34D399' }}>
                                {stats.targetTermStats && stats.targetTermStats[termIndex]?.tgpa
                                    ? stats.targetTermStats[termIndex].tgpa.toFixed(2)
                                    : '0.00'
                                }
                            </div>
                        </div>
                    </div>

                    <div className="h-8 w-px mx-1" style={{ backgroundColor: 'var(--border)' }}></div>

                    <button
                        onClick={() => onDeleteTerm(termIndex)}
                        className="transition-colors hover:bg-red-500/10 rounded-lg p-2"
                        style={{ color: 'var(--error)', border: 'none', background: 'transparent' }}
                        title="Delete Term"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto mb-4">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs uppercase tracking-wider border-b" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                            <th className={`py-2 ${isMobile ? 'px-0.5' : 'px-1'} font-medium`} style={{ width: isMobile ? '35%' : '40%' }}>{isMobile ? 'Subject' : 'Subject / Elective'}</th>
                            <th className={`py-2 ${isMobile ? 'px-0.5' : 'px-1'} font-medium text-center`} style={{ width: isMobile ? '13%' : '13%' }}>Cr</th>
                            <th className={`py-2 ${isMobile ? 'px-0.5' : 'px-1'} font-medium text-center`} style={{ width: isMobile ? '21%' : '19%' }}>{isMobile ? 'Grd' : 'Actual'}</th>
                            <th className={`py-2 ${isMobile ? 'px-0.5' : 'px-1'} font-medium text-center`} style={{ width: isMobile ? '21%' : '19%' }}>{isMobile ? 'Tgt' : 'Target'}</th>
                            <th className={`py-2 ${isMobile ? 'px-0.5' : 'px-1'} font-medium text-center`} style={{ width: isMobile ? '10%' : '9%' }}>{isMobile ? '' : 'Act'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {term.courses.map((course, cIndex) => (
                            <CourseRow
                                key={course.id}
                                course={course}
                                termIndex={termIndex}
                                courseIndex={cIndex}
                                isMobile={isMobile}
                                onCourseChange={onCourseChange}
                                onDeleteCourse={onDeleteCourse}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <button
                onClick={() => onAddCourse(termIndex)}
                className="w-full py-2 rounded-lg transition-colors text-sm font-medium"
                style={{
                    background: 'transparent',
                    border: '1px dashed var(--border)',
                    color: 'var(--text-secondary)'
                }}
            >
                + Add Custom Subject
            </button>
        </div>
    );
}
