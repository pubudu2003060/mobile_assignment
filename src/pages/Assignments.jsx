import { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useNotification } from "../hooks/useNotification";
import { getTimeRemaining, generateId } from "../utils/dateUtils";
import Modal from "../components/Modal";

export default function Assignments() {
  const [assignments, setAssignments] = useLocalStorage(
    "smartcampus_assignments",
    [],
  );
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { sendNotification, sendPushNotification, permission, isSubscribed } =
    useNotification();

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");
  const [notify, setNotify] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      if (permission !== "granted") return;
      assignments.forEach((assignment) => {
        if (assignment.notify && assignment.status !== "Completed") {
          const { text, isDueSoon, isOverdue } = getTimeRemaining(
            assignment.deadline,
          );
          if (isDueSoon && !isOverdue) {
            // SEND LOCAL NOTIFICATION ONLY (tab is open, so this is fine)
            sendNotification("⏰ Assignment Due Soon", {
              body: `${assignment.title} - Due in ${text}`,
            });
            // REMOVE THE sendPushNotification CALL - BACKEND WILL HANDLE IT
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [assignments, permission, sendNotification]);

  const filteredAssignments = assignments.filter((a) => {
    if (filter === "All") return true;
    if (filter === "Overdue") {
      const { isOverdue } = getTimeRemaining(a.deadline);
      return isOverdue && a.status !== "Completed";
    }
    return a.status === filter;
  });

  const toggleCompletion = (id) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "Completed" ? "Pending" : "Completed" }
          : a,
      ),
    );
  };

  const deleteAssignment = (id) => {
    if (window.confirm("Delete this assignment?")) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const openEditModal = (assignment) => {
    setEditingId(assignment.id);
    setTitle(assignment.title);
    setCourse(assignment.course);
    setDeadline(assignment.deadline);
    setDescription(assignment.description);
    setStatus(assignment.status);
    setNotify(assignment.notify || false);
    setErrors({});
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setTitle("");
    setCourse("");
    setDeadline("");
    setDescription("");
    setStatus("Pending");
    setNotify(false);
    setErrors({});
    setIsModalOpen(true);
  };

  const saveAssignment = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!course.trim()) newErrors.course = "Course is required";
    if (!deadline) newErrors.deadline = "Deadline is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const assignmentData = {
      id: editingId || generateId(),
      title,
      course,
      deadline,
      description,
      status,
      notify,
      createdAt: new Date().toISOString(),
    };

    // Update local state
    if (editingId) {
      setAssignments((prev) =>
        prev.map((a) => (a.id === editingId ? assignmentData : a)),
      );
    } else {
      setAssignments((prev) => [...prev, assignmentData]);
    }

    // --- NEW: Schedule backend notification if reminder is enabled ---
    if (assignmentData.notify) {
      try {
        const response = await fetch(
          "http://localhost:3000/api/assignments/schedule-notification",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assignmentId: assignmentData.id,
              title: assignmentData.title,
              deadline: assignmentData.deadline,
              status: assignmentData.status,
              notify: assignmentData.notify,
            }),
          },
        );
        if (!response.ok) {
          console.warn(
            "Failed to schedule backend notification:",
            await response.text(),
          );
        } else {
          console.log("Backend notification scheduled successfully");
        }
      } catch (error) {
        console.warn("Error scheduling backend notification:", error);
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="page animate-fade-in">
      <header className="page-header flex-between">
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">{assignments.length} assignments</p>
        </div>
        <button className="btn btn-primary btn-icon" onClick={openAddModal}>
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </header>

      <div className="filter-tabs">
        {["All", "Pending", "In Progress", "Completed", "Overdue"].map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
        }}
      >
        {filteredAssignments.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📝</span>
            <h3 className="empty-state-title">No assignments found</h3>
            <p className="empty-state-text">
              Add your first assignment to start tracking.
            </p>
            <button className="btn btn-primary mt-md" onClick={openAddModal}>
              Add Assignment
            </button>
          </div>
        ) : (
          filteredAssignments.map((a) => {
            const { text, isOverdue } = getTimeRemaining(a.deadline);
            let badgeClass = "badge-pending";
            if (a.status === "Completed") badgeClass = "badge-completed";
            else if (a.status === "In Progress") badgeClass = "badge-progress";
            else if (isOverdue) badgeClass = "badge-overdue";

            return (
              <div
                key={a.id}
                className="card flex gap-md"
                style={{ alignItems: "flex-start" }}
              >
                <div
                  className="checkbox-wrapper"
                  style={{ marginTop: "var(--space-sm)" }}
                  onClick={() => toggleCompletion(a.id)}
                >
                  <div
                    className={`checkbox ${a.status === "Completed" ? "checked" : ""}`}
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
                <div style={{ flex: 1 }}>
                  <div
                    className="flex-between mb-xs"
                    style={{ marginBottom: "var(--space-xs)" }}
                  >
                    <span className="text-xs text-muted">{a.course}</span>
                    <span className={`badge ${badgeClass}`}>
                      {a.status === "Completed"
                        ? "Completed"
                        : isOverdue
                          ? "Overdue"
                          : text}
                    </span>
                  </div>
                  <h3
                    className={`text-md mb-xs ${a.status === "Completed" ? "text-muted" : ""}`}
                    style={{
                      fontWeight: 500,
                      marginBottom: "var(--space-xs)",
                      textDecoration:
                        a.status === "Completed" ? "line-through" : "none",
                    }}
                  >
                    {a.title}
                  </h3>
                  {a.description && (
                    <p
                      className="text-sm text-muted mb-sm"
                      style={{ marginBottom: "var(--space-sm)" }}
                    >
                      {a.description}
                    </p>
                  )}

                  <div
                    className="flex gap-sm"
                    style={{ marginTop: "var(--space-sm)" }}
                  >
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openEditModal(a)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm text-danger"
                      style={{ color: "var(--color-danger)" }}
                      onClick={() => deleteAssignment(a.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Assignment" : "Add Assignment"}
      >
        <form
          onSubmit={saveAssignment}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className={`form-input ${errors.title ? "error" : ""}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Final Project Report"
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Course</label>
            <input
              className={`form-input ${errors.course ? "error" : ""}`}
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g., SENG 41293"
            />
            {errors.course && (
              <span className="form-error">{errors.course}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input
              type="datetime-local"
              className={`form-input ${errors.deadline ? "error" : ""}`}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            {errors.deadline && (
              <span className="form-error">{errors.deadline}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any extra notes..."
            ></textarea>
          </div>

          <div className="form-group flex-between">
            <label className="form-label" style={{ marginBottom: 0 }}>
              Enable Reminder
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />
              <div className="toggle-slider"></div>
            </label>
          </div>

          <div
            className="modal-actions"
            style={{ marginTop: "var(--space-lg)" }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
