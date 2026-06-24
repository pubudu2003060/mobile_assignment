import { useLocalStorage } from '../hooks/useLocalStorage';
import { getGreeting, getTodayFormatted, getTodayName, formatTime, isCurrentlyOngoing, getTimeRemaining } from '../utils/dateUtils';

export default function Dashboard() {
  const [schedule] = useLocalStorage('smartcampus_schedule', []);
  const [assignments] = useLocalStorage('smartcampus_assignments', []);
  const [courses] = useLocalStorage('smartcampus_courses', []);
  const [profile] = useLocalStorage('smartcampus_profile', { name: '', studentId: '', department: '', semester: '' });

  const todayName = getTodayName();
  const todayLectures = schedule
    .filter((l) => l.day === todayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const pendingAssignmentsCount = assignments.filter((a) => a.status !== 'Completed').length;
  const overdueAssignmentsCount = assignments.filter((a) => {
    const { isOverdue } = getTimeRemaining(a.deadline);
    return isOverdue && a.status !== 'Completed';
  }).length;

  const completedCredits = courses.filter((c) => c.completed).reduce((sum, c) => sum + Number(c.credits), 0);
  const totalCredits = courses.reduce((sum, c) => sum + Number(c.credits), 0);

  const upcomingDeadlines = assignments
    .filter((a) => a.status !== 'Completed')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">{getGreeting()}, {profile.name || 'Student'}</h1>
        <p className="page-subtitle">{getTodayFormatted()}</p>
      </header>

      <div className="stats-grid stagger">
        <div className="stat-card animate-slide-up">
          <div className="stat-value">{todayLectures.length}</div>
          <div className="stat-label">Today's Lectures</div>
        </div>
        <div className="stat-card animate-slide-up">
          <div className="stat-value">{pendingAssignmentsCount}</div>
          <div className="stat-label">Pending Tasks</div>
        </div>
        <div className="stat-card animate-slide-up">
          <div className="stat-value">{completedCredits}/{totalCredits || 0}</div>
          <div className="stat-label">Credits Completed</div>
        </div>
        <div className="stat-card animate-slide-up">
          <div className="stat-value" style={{ color: overdueAssignmentsCount > 0 ? 'var(--color-danger)' : '' }}>
            {overdueAssignmentsCount}
          </div>
          <div className="stat-label">Overdue Tasks</div>
        </div>
      </div>

      <section className="section stagger">
        <div className="section-header animate-slide-up">
          <h2 className="section-title">Today's Schedule</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {todayLectures.length === 0 ? (
            <div className="empty-state animate-slide-up">
              <span className="empty-state-icon">🏖️</span>
              <h3 className="empty-state-title">No lectures today</h3>
              <p className="empty-state-text">Enjoy your free time!</p>
            </div>
          ) : (
            todayLectures.map((lecture) => {
              const isOngoing = isCurrentlyOngoing(lecture.startTime, lecture.endTime);
              return (
                <div key={lecture.id} className="card animate-slide-up">
                  <div className="flex-between mb-sm" style={{ marginBottom: 'var(--space-sm)' }}>
                    <span className="text-sm" style={{ fontWeight: 500 }}>{formatTime(lecture.startTime)} - {formatTime(lecture.endTime)}</span>
                    {isOngoing && <span className="badge badge-progress">NOW</span>}
                  </div>
                  <h3 className="text-lg" style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>{lecture.course}</h3>
                  <div className="flex-between text-muted text-sm">
                    <span>{lecture.room}</span>
                    <span>{lecture.lecturer}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="section stagger">
        <div className="section-header animate-slide-up">
          <h2 className="section-title">Upcoming Deadlines</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {upcomingDeadlines.length === 0 ? (
            <div className="empty-state animate-slide-up">
              <span className="empty-state-icon">🎉</span>
              <h3 className="empty-state-title">All caught up!</h3>
              <p className="empty-state-text">No upcoming deadlines.</p>
            </div>
          ) : (
            upcomingDeadlines.map((assignment) => {
              const { text, isOverdue, isDueSoon } = getTimeRemaining(assignment.deadline);
              let badgeClass = 'badge-progress';
              if (isOverdue) badgeClass = 'badge-overdue';
              else if (isDueSoon) badgeClass = 'badge-pending';
              
              return (
                <div key={assignment.id} className="card animate-slide-up">
                  <div className="flex-between mb-xs" style={{ marginBottom: 'var(--space-xs)' }}>
                    <span className="text-xs text-muted">{assignment.course}</span>
                    <span className={`badge ${badgeClass}`}>{text}</span>
                  </div>
                  <h3 className="text-md" style={{ fontWeight: 500 }}>{assignment.title}</h3>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
