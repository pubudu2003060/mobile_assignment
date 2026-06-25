import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { generateId, formatTime } from "../utils/dateUtils";
import Modal from "../components/Modal";

export default function Profile() {
  const [profile, setProfile] = useLocalStorage("smartcampus_profile", {
    name: "",
    studentId: "",
    department: "",
    semester: "",
  });
  const [courses, setCourses] = useLocalStorage("smartcampus_courses", []);
  const [schedule, setSchedule] = useLocalStorage("smartcampus_schedule", []);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);

  const [profName, setProfName] = useState("");
  const [profId, setProfId] = useState("");
  const [profDept, setProfDept] = useState("");
  const [profSem, setProfSem] = useState("");

  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCredits, setCourseCredits] = useState("3");
  const [courseErrors, setCourseErrors] = useState({});

  const [lecDay, setLecDay] = useState("Monday");
  const [lecStart, setLecStart] = useState("");
  const [lecEnd, setLecEnd] = useState("");
  const [lecCourse, setLecCourse] = useState("");
  const [lecRoom, setLecRoom] = useState("");
  const [lecLecturer, setLecLecturer] = useState("");
  const [lecErrors, setLecErrors] = useState({});

  const completedCredits = courses
    .filter((c) => c.completed)
    .reduce((s, c) => s + Number(c.credits), 0);
  const totalCredits = courses.reduce((s, c) => s + Number(c.credits), 0);
  const progressPercent =
    totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0;

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const openProfileModal = () => {
    setProfName(profile.name || "");
    setProfId(profile.studentId || "");
    setProfDept(profile.department || "");
    setProfSem(profile.semester || "");
    setIsProfileModalOpen(true);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    setProfile({
      name: profName,
      studentId: profId,
      department: profDept,
      semester: profSem,
    });
    setIsProfileModalOpen(false);
  };

  const saveCourse = (e) => {
    e.preventDefault();
    const errs = {};
    if (!courseCode.trim()) errs.code = "Required";
    if (!courseName.trim()) errs.name = "Required";
    if (courseCredits < 1 || courseCredits > 6) errs.credits = "Must be 1-6";
    if (Object.keys(errs).length) return setCourseErrors(errs);

    setCourses([
      ...courses,
      {
        id: generateId(),
        code: courseCode,
        name: courseName,
        credits: Number(courseCredits),
        completed: false,
      },
    ]);
    setIsCourseModalOpen(false);
  };

  const deleteCourse = (id) => {
    if (window.confirm("Remove this course?"))
      setCourses(courses.filter((c) => c.id !== id));
  };

  const toggleCourseCompleted = (id) => {
    setCourses(
      courses.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c)),
    );
  };

  const saveLecture = (e) => {
    e.preventDefault();
    const errs = {};
    if (!lecDay) errs.day = "Required";
    if (!lecStart) errs.start = "Required";
    if (!lecEnd) errs.end = "Required";
    if (!lecCourse.trim()) errs.course = "Required";
    if (!lecRoom.trim()) errs.room = "Required";
    if (Object.keys(errs).length) return setLecErrors(errs);

    setSchedule([
      ...schedule,
      {
        id: generateId(),
        day: lecDay,
        startTime: lecStart,
        endTime: lecEnd,
        course: lecCourse,
        room: lecRoom,
        lecturer: lecLecturer,
      },
    ]);
    setIsLectureModalOpen(false);
  };

  const deleteLecture = (id) => {
    if (window.confirm("Remove this lecture?"))
      setSchedule(schedule.filter((s) => s.id !== id));
  };

  const openCourseModal = () => {
    setCourseCode("");
    setCourseName("");
    setCourseCredits("3");
    setCourseErrors({});
    setIsCourseModalOpen(true);
  };

  const openLectureModal = () => {
    setLecDay("Monday");
    setLecStart("");
    setLecEnd("");
    setLecCourse("");
    setLecRoom("");
    setLecLecturer("");
    setLecErrors({});
    setIsLectureModalOpen(true);
  };

  return (
    <div className="page animate-fade-in">
      <header className="page-header flex-between">
        <h1 className="page-title">Profile</h1>
        <button className="btn btn-ghost btn-sm" onClick={openProfileModal}>
          Edit
        </button>
      </header>

      <section className="section stagger">
        <div
          className="card animate-slide-up flex gap-md flex-center"
          style={{ flexDirection: "column", alignItems: "center" }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "var(--color-primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: "bold",
            }}
          >
            {getInitials(profile.name)}
          </div>
          <div className="text-center">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              {profile.name || "Set your name"}
            </h2>
            <p className="text-muted text-sm">
              {profile.studentId || "Set student ID"}
            </p>
            {(profile.department || profile.semester) && (
              <p className="text-sm mt-sm">
                {profile.department}{" "}
                {profile.semester && `• ${profile.semester}`}
              </p>
            )}
          </div>
        </div>

        <div className="card animate-slide-up mt-md">
          <div
            className="flex-between mb-sm"
            style={{ marginBottom: "var(--space-sm)" }}
          >
            <span style={{ fontWeight: 500 }}>Credit Progress</span>
            <span
              className="text-sm"
              style={{ color: "var(--color-primary-light)" }}
            >
              {completedCredits} / {totalCredits}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p
            className="text-xs text-muted text-right"
            style={{ marginTop: "var(--space-sm)" }}
          >
            {progressPercent.toFixed(0)}% Completed
          </p>
        </div>
      </section>

      <section className="section stagger">
        <div className="section-header animate-slide-up flex-between">
          <h2 className="section-title">My Courses</h2>
          <button className="btn btn-ghost btn-sm" onClick={openCourseModal}>
            + Add
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          {courses.length === 0 ? (
            <div className="empty-state animate-slide-up">
              <span className="empty-state-icon">📚</span>
              <p className="empty-state-text">
                Add your courses to track credits.
              </p>
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="card animate-slide-up flex-between"
              >
                <div className="flex gap-md" style={{ alignItems: "center" }}>
                  <div
                    className="checkbox-wrapper"
                    onClick={() => toggleCourseCompleted(course.id)}
                  >
                    <div
                      className={`checkbox ${course.completed ? "checked" : ""}`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-md" style={{ fontWeight: 500 }}>
                      {course.code}
                    </h3>
                    <p className="text-sm text-muted">
                      {course.name} • {course.credits} Cr
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm text-danger"
                  style={{ color: "var(--color-danger)" }}
                  onClick={() => deleteCourse(course.id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="section stagger">
        <div className="section-header animate-slide-up flex-between">
          <h2 className="section-title">Lecture Schedule</h2>
          <button className="btn btn-ghost btn-sm" onClick={openLectureModal}>
            + Add
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          {schedule.length === 0 ? (
            <div className="empty-state animate-slide-up">
              <span className="empty-state-icon">🗓️</span>
              <p className="empty-state-text">Add your lecture schedule.</p>
            </div>
          ) : (
            schedule.map((lec) => (
              <div key={lec.id} className="card animate-slide-up">
                <div
                  className="flex-between mb-xs"
                  style={{ marginBottom: "var(--space-xs)" }}
                >
                  <span className="badge badge-progress">{lec.day}</span>
                  <span className="text-sm">
                    {formatTime(lec.startTime)} - {formatTime(lec.endTime)}
                  </span>
                </div>
                <h3 className="text-md" style={{ fontWeight: 500 }}>
                  {lec.course}
                </h3>
                <div
                  className="flex-between text-sm text-muted"
                  style={{ marginTop: "var(--space-xs)" }}
                >
                  <span>{lec.room}</span>
                  <button
                    className="btn btn-ghost btn-sm text-danger"
                    style={{ color: "var(--color-danger)", padding: 0 }}
                    onClick={() => deleteLecture(lec.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modals */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Edit Profile"
      >
        <form
          onSubmit={saveProfile}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              value={profName}
              onChange={(e) => setProfName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Student ID</label>
            <input
              className="form-input"
              value={profId}
              onChange={(e) => setProfId(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input
              className="form-input"
              value={profDept}
              onChange={(e) => setProfDept(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Semester/Year</label>
            <input
              className="form-input"
              value={profSem}
              onChange={(e) => setProfSem(e.target.value)}
            />
          </div>
          <div
            className="modal-actions"
            style={{ marginTop: "var(--space-lg)" }}
          >
            <button type="submit" className="btn btn-primary btn-block">
              Save Profile
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title="Add Course"
      >
        <form
          onSubmit={saveCourse}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <div className="form-group">
            <label className="form-label">Course Code</label>
            <input
              className={`form-input ${courseErrors.code ? "error" : ""}`}
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="SENG 12345"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Course Name</label>
            <input
              className={`form-input ${courseErrors.name ? "error" : ""}`}
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Credits</label>
            <input
              type="number"
              min="1"
              max="6"
              className={`form-input ${courseErrors.credits ? "error" : ""}`}
              value={courseCredits}
              onChange={(e) => setCourseCredits(e.target.value)}
            />
          </div>
          <div
            className="modal-actions"
            style={{ marginTop: "var(--space-lg)" }}
          >
            <button type="submit" className="btn btn-primary btn-block">
              Save Course
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isLectureModalOpen}
        onClose={() => setIsLectureModalOpen(false)}
        title="Add Lecture"
      >
        <form
          onSubmit={saveLecture}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <div className="form-group">
            <label className="form-label">Day</label>
            <select
              className="form-select"
              value={lecDay}
              onChange={(e) => setLecDay(e.target.value)}
            >
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input
              type="time"
              className={`form-input ${lecErrors.start ? "error" : ""}`}
              value={lecStart}
              onChange={(e) => setLecStart(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input
              type="time"
              className={`form-input ${lecErrors.end ? "error" : ""}`}
              value={lecEnd}
              onChange={(e) => setLecEnd(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Course</label>
            <input
              className={`form-input ${lecErrors.course ? "error" : ""}`}
              value={lecCourse}
              onChange={(e) => setLecCourse(e.target.value)}
              placeholder="e.g. SENG 41293"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Room</label>
            <input
              className={`form-input ${lecErrors.room ? "error" : ""}`}
              value={lecRoom}
              onChange={(e) => setLecRoom(e.target.value)}
              placeholder="e.g. Hall A"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Lecturer (Optional)</label>
            <input
              className="form-input"
              value={lecLecturer}
              onChange={(e) => setLecLecturer(e.target.value)}
            />
          </div>
          <div
            className="modal-actions"
            style={{ marginTop: "var(--space-lg)" }}
          >
            <button type="submit" className="btn btn-primary btn-block">
              Save Lecture
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
