import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { expenseApi } from '../lib/expenseApi';
import {
  LayoutDashboard, Calculator, GraduationCap, FileText, Wallet,
  ArrowRight, Calendar, TrendingUp, AlertTriangle, CheckCircle,
  BookOpen, Download, BarChart2, Target, Zap, Clock
} from 'lucide-react';
import './Dashboard.css';

/* ─── tiny helpers ─── */
const fmt = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n));

const EXPENSE_COLORS = ['#ff6600', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

function DonutChart({ data, size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;

  const cx = size / 2, cy = size / 2, r = size * 0.38, stroke = size * 0.16;
  const circ = 2 * Math.PI * r;
  let cum = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const seg = { pct, offset: circ * (1 - cum), color: EXPENSE_COLORS[i % EXPENSE_COLORS.length] };
    cum += pct;
    return seg;
  });

  return (
    <svg width={size} height={size} className="donut-svg" viewBox={`0 0 ${size} ${size}`}>
      {segments.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={stroke}
          strokeDasharray={`${circ * s.pct} ${circ * (1 - s.pct)}`}
          strokeDashoffset={s.offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      ))}
      <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="var(--surface)" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text)" fontSize={size * 0.12} fontWeight="800">
        ₹{fmt(total)}
      </text>
      <text x={cx} y={cy + size * 0.12} textAnchor="middle" fill="var(--text-secondary)" fontSize={size * 0.085}>
        total
      </text>
    </svg>
  );
}

function SmallCircle({ value, max = 10, color, size = 72 }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${circ * pct} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.34,1.56,.64,1)' }}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="var(--text)" fontSize={size * 0.2} fontWeight="800">
        {value.toFixed(1)}
      </text>
    </svg>
  );
}

/* ─── Skeleton row ─── */
function SkeletonRow({ count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
      <div className="skeleton" style={{ width: '40%', height: 10 }} />
      <div className="skeleton" style={{ flex: 1, height: 7, borderRadius: 999 }} />
      <div className="skeleton" style={{ width: '2.5rem', height: 10 }} />
    </div>
  ));
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  /* ── data state ── */
  const [attendanceData, setAttendanceData] = useState(null);
  const [cgpaData, setCgpaData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expenseSettings, setExpenseSettings] = useState(null);
  const [categoriesData, setCategoriesData] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [totalNotes, setTotalNotes] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [attRes, cgpaRes, expRes, catRes, setRes, notesRes, notesCountRes] = await Promise.allSettled([
        // Attendance
        supabase.from('attendance_data').select('*').eq('user_id', user.id).single(),
        // CGPA
        supabase.from('student_cgpa_data').select('*').eq('user_id', user.id).single(),
        // Expenses (current month)
        expenseApi.getExpenses(user.id, {
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          endDate:   new Date().toISOString().split('T')[0],
        }),
        // Category totals
        expenseApi.getExpensesByCategory(user.id,
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ),
        // Expense settings
        expenseApi.getSettings(user.id),
        // Recent notes (5)
        supabase.from('notes').select('id,title,course_code,semester,file_type,downloads,created_at')
          .order('created_at', { ascending: false }).limit(5),
        // Total notes count
        supabase.from('notes').select('id', { count: 'exact', head: true }),
      ]);

      if (attRes.status === 'fulfilled' && attRes.value?.data)   setAttendanceData(attRes.value.data);
      if (cgpaRes.status === 'fulfilled' && cgpaRes.value?.data) setCgpaData(cgpaRes.value.data);
      if (expRes.status === 'fulfilled')  setExpenses(expRes.value);
      if (catRes.status === 'fulfilled')  setCategoriesData(catRes.value.slice(0, 5));
      if (setRes.status === 'fulfilled')  setExpenseSettings(setRes.value);
      if (notesRes.status === 'fulfilled' && notesRes.value?.data)
        setRecentNotes(notesRes.value.data);
      if (notesCountRes.status === 'fulfilled')
        setTotalNotes(notesCountRes.value?.count || 0);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── derived values ─── */
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.registration_number?.split('_')[0]
    || 'Student';

  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  /* Attendance summary — results is { subjectWise, overall, weekWise } */
  const attResults = attendanceData?.results || null;
  const subjects = attResults?.subjectWise || [];
  const overallAttPct = attResults?.overall?.percentage != null
    ? parseFloat(attResults.overall.percentage)
    : subjects.length
      ? subjects.reduce((s, sub) => s + parseFloat(sub.currentPercentage || sub.percentage || 0), 0) / subjects.length
      : null;
  const atRiskCount = subjects.filter(s => parseFloat(s.currentPercentage || s.percentage || 0) < 75).length;

  /* CGPA summary */
  const cgpa = cgpaData?.cgpa ? parseFloat(cgpaData.cgpa) : null;
  // terms_data stores course arrays; we'll compute a simple tgpa from saved cgpa per term if available
  const termStats = cgpaData?.terms_data || [];

  /* Expense summary */
  const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const budget = expenseSettings?.monthly_budget > 0 ? parseFloat(expenseSettings.monthly_budget) : 9000;
  const budgetPct = Math.min((totalSpent / budget) * 100, 100);

  /* ─── render ─── */
  return (
    <div className="dashboard-page">

      {/* ── Hero ── */}
      <div className="dashboard-hero">
        <div className="dashboard-greeting">
          <h1>{greeting}, {displayName} 👋</h1>
          <p>Here's your academic snapshot for today</p>
        </div>
        <div className="dashboard-date">
          <Calendar size={14} />
          {dateStr}
        </div>
      </div>

      {/* ── Top stat cards ── */}
      <div className="dashboard-stats-row">

        {/* CGPA */}
        <Link to="/cgpa" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(255,102,0,0.12)' }}>
            <GraduationCap size={22} color="var(--primary)" />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-label">CGPA</div>
            <div className="stat-card-value">
              {loading ? <span className="skeleton" style={{ display: 'block', width: 50, height: 28 }} /> : cgpa ? cgpa.toFixed(2) : '—'}
            </div>
            <div className="stat-card-sub">{cgpa ? `${termStats.length} term(s) tracked` : 'No data yet'}</div>
          </div>
        </Link>

        {/* Attendance */}
        <Link to="/" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <BarChart2 size={22} color="#10b981" />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-label">Avg. Attendance</div>
            <div className="stat-card-value" style={{ color: overallAttPct !== null && overallAttPct < 75 ? '#ef4444' : overallAttPct !== null && overallAttPct >= 85 ? '#10b981' : 'var(--text)' }}>
              {loading ? <span className="skeleton" style={{ display: 'block', width: 50, height: 28 }} /> : overallAttPct !== null ? `${overallAttPct.toFixed(1)}%` : '—'}
            </div>
            <div className="stat-card-sub">
              {atRiskCount > 0 ? <span style={{ color: '#ef4444' }}>{atRiskCount} subject{atRiskCount > 1 ? 's' : ''} at risk</span> : subjects.length ? 'All on track ✓' : 'No data yet'}
            </div>
          </div>
        </Link>

        {/* Expenses */}
        <Link to="/expenses" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Wallet size={22} color="#6366f1" />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-label">Month Spent</div>
            <div className="stat-card-value">
              {loading ? <span className="skeleton" style={{ display: 'block', width: 70, height: 28 }} /> : `₹${fmt(totalSpent)}`}
            </div>
            <div className="stat-card-sub">of ₹{fmt(budget)} budget ({budgetPct.toFixed(0)}%)</div>
          </div>
        </Link>

        {/* Notes */}
        <Link to="/notes" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <FileText size={22} color="#f59e0b" />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-label">Community Notes</div>
            <div className="stat-card-value">
              {loading ? <span className="skeleton" style={{ display: 'block', width: 40, height: 28 }} /> : totalNotes.toLocaleString()}
            </div>
            <div className="stat-card-sub">resources shared</div>
          </div>
        </Link>
      </div>

      {/* ── Main grid ── */}
      <div className="dashboard-main-grid">

        {/* ─ Attendance Widget ─ */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title-group">
              <div className="widget-icon-wrap" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <BarChart2 size={18} color="#10b981" />
              </div>
              <span className="widget-title">Attendance Detail</span>
            </div>
            <Link to="/" className="widget-link">
              Open <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <SkeletonRow count={4} />
          ) : subjects.length === 0 ? (
            <div className="widget-empty">
              <Calculator size={36} />
              <span>No attendance data calculated yet</span>
            </div>
          ) : (
            <div className="attendance-subject-list">
              {subjects.slice(0, 6).map((sub, i) => {
                const rawPct = parseFloat(sub.currentPercentage ?? sub.percentage ?? 0);
                const pct = isNaN(rawPct) ? 0 : rawPct;
                const color = pct < 75 ? '#ef4444' : pct < 85 ? '#f59e0b' : '#10b981';
                const subName = sub.name || sub.subject || `Subject ${i + 1}`;
                return (
                  <div key={i} className="attendance-subject-row">
                    <span className="attendance-subject-name" title={subName}>{subName}</span>
                    <div className="attendance-bar-wrap">
                      <div className="attendance-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                    </div>
                    <span className="attendance-pct" style={{ color }}>{pct.toFixed(1)}%</span>
                    {pct < 75 && (
                      <span className="attendance-status-badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                        Risk
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && subjects.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#10b981' }}>
                <CheckCircle size={13} /> Safe: {subjects.filter(s => (s.currentPercentage || 0) >= 75).length}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#ef4444' }}>
                <AlertTriangle size={13} /> At risk: {atRiskCount}
              </div>
            </div>
          )}
        </div>

        {/* ─ CGPA Widget ─ */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title-group">
              <div className="widget-icon-wrap" style={{ background: 'rgba(255,102,0,0.12)' }}>
                <GraduationCap size={18} color="var(--primary)" />
              </div>
              <span className="widget-title">CGPA Overview</span>
            </div>
            <Link to="/cgpa" className="widget-link">
              Open <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}><SkeletonRow count={3} /></div>
            </div>
          ) : !cgpa ? (
            <div className="widget-empty">
              <GraduationCap size={36} />
              <span>No CGPA data yet. Head to CGPA page to add your grades.</span>
            </div>
          ) : (
            <>
              <div className="cgpa-widget-body">
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                  <div className="cgpa-circular-wrap">
                    <SmallCircle value={cgpa} max={10} color="var(--primary)" size={80} />
                    <span className="cgpa-circular-label">Actual</span>
                  </div>
                </div>

                {termStats.length > 0 && (
                  <div className="cgpa-term-list">
                    {termStats.slice(-4).map((t, i) => {
                      const courses = t.courses || [];
                      const gradeValues = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0 };
                      let totalPts = 0, totalCr = 0;
                      courses.forEach(c => {
                        const pts = gradeValues[c.actualGrade] ?? null;
                        if (pts !== null) {
                          const cr = parseFloat(c.credits) || 3;
                          totalPts += pts * cr;
                          totalCr  += cr;
                        }
                      });
                      const tgpa = totalCr > 0 ? totalPts / totalCr : 0;
                      return (
                        <div key={i} className="cgpa-term-row">
                          <span className="cgpa-term-label">Term {t.termNumber}</span>
                          <div className="cgpa-term-bar-wrap">
                            <div className="cgpa-term-bar-fill" style={{ width: `${(tgpa / 10) * 100}%` }} />
                          </div>
                          <span className="cgpa-term-value">{tgpa > 0 ? tgpa.toFixed(2) : '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Semesters</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{termStats.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Grade</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: cgpa >= 8.5 ? '#10b981' : cgpa >= 7 ? '#f59e0b' : '#ef4444' }}>
                    {cgpa >= 9 ? 'O' : cgpa >= 8 ? 'A+' : cgpa >= 7 ? 'A' : cgpa >= 6 ? 'B+' : cgpa >= 5.5 ? 'B' : 'C'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Status</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: cgpa >= 7.5 ? '#10b981' : '#f59e0b' }}>
                    {cgpa >= 8.5 ? '🏆 Distinction' : cgpa >= 7.5 ? '✓ First Class' : cgpa >= 6 ? 'Second Class' : 'Keep pushing!'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Side grid ── */}
      <div className="dashboard-side-grid">

        {/* ─ Expense Widget ─ */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title-group">
              <div className="widget-icon-wrap" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <Wallet size={18} color="#6366f1" />
              </div>
              <span className="widget-title">This Month's Expenses</span>
            </div>
            <Link to="/expenses" className="widget-link">
              Open <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}><SkeletonRow count={3} /></div>
            </div>
          ) : categoriesData.length === 0 ? (
            <div className="widget-empty">
              <Wallet size={36} />
              <span>No expenses recorded this month</span>
            </div>
          ) : (
            <>
              <div className="expense-donut-row">
                <DonutChart data={categoriesData} size={130} />
                <div className="expense-legend">
                  {categoriesData.map((cat, i) => (
                    <div key={i} className="expense-legend-item">
                      <div className="expense-legend-dot" style={{ background: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                      <span className="expense-legend-name">{cat.name}</span>
                      <span className="expense-legend-val">₹{fmt(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="expense-budget-bar-section">
                <div className="expense-budget-header">
                  <span style={{ color: 'var(--text-secondary)' }}>Budget used</span>
                  <span style={{ fontWeight: 700, color: budgetPct >= 90 ? '#ef4444' : budgetPct >= 70 ? '#f59e0b' : '#10b981' }}>
                    {budgetPct.toFixed(0)}% — ₹{fmt(budget - totalSpent)} left
                  </span>
                </div>
                <div className="expense-budget-bar-bg">
                  <div
                    className="expense-budget-bar-fill"
                    style={{
                      width: `${budgetPct}%`,
                      background: budgetPct >= 90 ? '#ef4444' : budgetPct >= 70 ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─ Notes Widget ─ */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title-group">
              <div className="widget-icon-wrap" style={{ background: 'rgba(245,158,11,0.12)' }}>
                <FileText size={18} color="#f59e0b" />
              </div>
              <span className="widget-title">Recent Notes</span>
            </div>
            <Link to="/notes" className="widget-link">
              Open <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.65rem', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '70%', height: 10, marginBottom: 4 }} />
                  <div className="skeleton" style={{ width: '40%', height: 8 }} />
                </div>
              </div>
            ))
          ) : recentNotes.length === 0 ? (
            <div className="widget-empty">
              <BookOpen size={36} />
              <span>No community notes available yet</span>
            </div>
          ) : (
            <div className="notes-recent-list">
              {recentNotes.map((note) => (
                <div key={note.id} className="notes-recent-item">
                  <div className="notes-recent-icon">
                    <FileText size={16} />
                  </div>
                  <div className="notes-recent-body">
                    <div className="notes-recent-title">{note.title}</div>
                    <div className="notes-recent-meta">
                      {note.course_code && <span className="notes-recent-badge">{note.course_code}</span>}
                      {note.semester && <span className="notes-recent-badge">Sem {note.semester}</span>}
                      <Download size={10} />
                      <span>{note.downloads || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && totalNotes > 5 && (
            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
              <Link to="/notes" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                View all {totalNotes} resources <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="quick-actions-section">
        <div className="quick-actions-title">Quick Actions</div>
        <div className="quick-actions-grid">
          <Link to="/" className="quick-action-btn">
            <div className="quick-action-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <Calculator size={20} color="#10b981" />
            </div>
            Calculate Attendance
          </Link>
          <Link to="/cgpa" className="quick-action-btn">
            <div className="quick-action-icon" style={{ background: 'rgba(255,102,0,0.12)' }}>
              <Target size={20} color="var(--primary)" />
            </div>
            Update CGPA
          </Link>
          <Link to="/notes" className="quick-action-btn">
            <div className="quick-action-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <TrendingUp size={20} color="#f59e0b" />
            </div>
            Browse Notes
          </Link>
          <Link to="/expenses" className="quick-action-btn">
            <div className="quick-action-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <Zap size={20} color="#6366f1" />
            </div>
            Add Expense
          </Link>
        </div>
      </div>
    </div>
  );
}
