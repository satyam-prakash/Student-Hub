import { Trash2 } from 'lucide-react';
import { gradeMap } from '../utils/cgpaLogic';

export default function CourseRow({
    course,
    termIndex,
    courseIndex,
    isMobile,
    onCourseChange,
    onDeleteCourse
}) {
    return (
        <tr className="transition-colors group hover:bg-white/5" style={{ borderBottom: '1px solid var(--border)' }}>
            <td className="py-2 px-1 align-middle">
                {course.isElective ? (
                    <select
                        value={course.code}
                        onChange={(e) => onCourseChange(termIndex, courseIndex, 'code', e.target.value)}
                        className="rounded px-2 py-1 text-xs w-full focus:border-primary outline-none"
                        style={{
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)'
                        }}
                    >
                        <option value="">{course.name}</option>
                        {course.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={course.name}
                        onChange={(e) => onCourseChange(termIndex, courseIndex, 'name', e.target.value)}
                        placeholder="Subject Name"
                        className="bg-transparent border-none p-0 font-medium focus:ring-0 w-full"
                        style={{ color: 'var(--text)' }}
                    />
                )}
            </td>

            <td className="py-2 px-1 align-middle text-center">
                <input
                    type="number"
                    value={course.credits}
                    onChange={(e) => onCourseChange(termIndex, courseIndex, 'credits', parseInt(e.target.value) || 0)}
                    className={`rounded px-0.5 py-1 text-xs text-center focus:border-primary outline-none ${isMobile ? 'w-full' : 'w-12'}`}
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: '0' }}
                />
            </td>

            <td className="py-2 px-1 align-middle">
                <select
                    value={course.actualGrade}
                    onChange={(e) => onCourseChange(termIndex, courseIndex, 'actualGrade', e.target.value)}
                    className={`rounded ${isMobile ? 'px-0' : 'px-1'} py-1 w-full text-xs focus:border-primary outline-none text-center ${isMobile ? 'appearance-none' : ''}`}
                    style={{
                        color: course.actualGrade ? 'var(--text)' : 'var(--text-secondary)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        paddingRight: isMobile ? '0' : undefined
                    }}
                >
                    <option value="">{isMobile ? '-' : '-'}</option>
                    {Object.keys(gradeMap).map(g => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
            </td>

            <td className="py-2 px-1 align-middle">
                <select
                    value={course.targetGrade}
                    onChange={(e) => onCourseChange(termIndex, courseIndex, 'targetGrade', e.target.value)}
                    className={`rounded ${isMobile ? 'px-0' : 'px-1'} py-1 w-full text-xs focus:border-green-500/50 outline-none text-center ${isMobile ? 'appearance-none' : ''}`}
                    style={{
                        color: course.targetGrade ? '#4ade80' : 'var(--text-secondary)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        paddingRight: isMobile ? '0' : undefined
                    }}
                >
                    <option value="">{isMobile ? '-' : '-'}</option>
                    {Object.keys(gradeMap).map(g => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
            </td>

            <td className="py-2 px-1 align-middle text-center">
                <button
                    onClick={() => onDeleteCourse(termIndex, courseIndex)}
                    className="w-8 h-8 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    style={{ color: '#ef4444', background: 'transparent', border: 'none' }}
                    title="Remove Subject"
                >
                    <Trash2 size={16} />
                </button>
            </td>
        </tr>
    );
}
