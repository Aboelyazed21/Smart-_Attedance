import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";
import "./CorrectionRequests.css";

const courseOptions = [
  "All Courses",
  "Data Structures",
  "Web Development",
  "Database Systems",
  "Machine Learning",
  "Software Security",
  "Design & Testing",
];

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function CorrectionRequests() {
  const navigate = useNavigate();
  const user = getSavedUser();

  const firstName =
    user?.first_name ||
    user?.firstName ||
    "Student";

  const lastName =
    user?.last_name ||
    user?.lastName ||
    "";

  const fullName = `${firstName} ${lastName}`.trim();

  const avatarLetter =
    firstName.charAt(0).toUpperCase() || "S";

  const [requests, setRequests] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form, setForm] = useState({
    course: "",
    section: "",
    attendanceDate: "",
    reason: "",
    details: "",
  });

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !normalizedSearch ||
        request.id.toLowerCase().includes(normalizedSearch) ||
        request.course.toLowerCase().includes(normalizedSearch) ||
        request.reason.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All Status" ||
        request.status === statusFilter;

      const matchesCourse =
        courseFilter === "All Courses" ||
        request.course === courseFilter;

      const requestDate = new Date(request.attendanceDate);
      const matchesFrom =
        !fromDate ||
        requestDate >= new Date(`${fromDate}T00:00:00`);

      const matchesTo =
        !toDate ||
        requestDate <= new Date(`${toDate}T23:59:59`);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCourse &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    requests,
    search,
    statusFilter,
    courseFilter,
    fromDate,
    toDate,
  ]);

  const pendingCount = requests.filter(
    (item) => item.status === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === "Rejected"
  ).length;

  function resetFilters() {
    setSearch("");
    setStatusFilter("All Status");
    setCourseFilter("All Courses");
    setFromDate("");
    setToDate("");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  function goTo(path) {
    setSidebarOpen(false);
    navigate(path);
  }

  useEffect(() => {
    if (!sidebarOpen) {
      if (!showModal && !selectedRequest) document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      if (!showModal && !selectedRequest) document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen, showModal, selectedRequest]);

  function openNewRequest() {
    setForm({
      course: "",
      section: "",
      attendanceDate: "",
      reason: "",
      details: "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function submitRequest(event) {
    event.preventDefault();

    if (
      !form.course ||
      !form.section ||
      !form.attendanceDate ||
      !form.reason.trim()
    ) {
      return;
    }

    const nextId = `CR-${String(requests.length + 11).padStart(4, "0")}`;

    const createdRequest = {
      id: nextId,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      course: form.course,
      section: form.section,
      attendanceDate: new Date(
        `${form.attendanceDate}T12:00:00`
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      status: "Pending",
      reason: form.reason.trim(),
      submittedAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      details: form.details.trim(),
    };

    setRequests((current) => [
      createdRequest,
      ...current,
    ]);

    setShowModal(false);
  }

  return (
    <div className="correction-page">
      {sidebarOpen && (
        <button
          className="correction-sidebar-overlay"
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="correction-sidebar"
        className={`correction-sidebar${sidebarOpen ? " open" : ""}`}
      >
        <div className="correction-brand">
          <div className="correction-brand-logo" aria-hidden="true">
            A
          </div>

          <div>
            <strong>Attendify</strong>
            <span>Student Portal</span>
          </div>
        </div>

        <div className="correction-profile">
          <div className="correction-avatar">
            {avatarLetter}
          </div>

          <div className="correction-profile-info">
            <strong>{fullName}</strong>
            <span>Student</span>
          </div>
        </div>

        <nav className="correction-nav" aria-label="Student navigation">
          <button
            type="button"
            onClick={() => goTo("/dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => goTo("/student/attendance")}
          >
            My Attendance
          </button>

          <button
            type="button"
            onClick={() => goTo("/student/scan")}
          >
            Scan Attendance
          </button>

          <button
            type="button"
            className="active"
            aria-current="page"
            onClick={() => goTo("/student/correction-requests")}
          >
            Correction Requests
          </button>

          <button
            type="button"
            onClick={() => goTo("/student/chatbot")}
          >
            Attendance Assistant
          </button>
        </nav>

        <div className="correction-sidebar-bottom">
          <button
            type="button"
            className="correction-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="correction-main">
        <header className="correction-topbar">
          <button
            className="correction-menu-button hamburger"
            type="button"
            aria-expanded={sidebarOpen}
            aria-controls="correction-sidebar"
            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>

          <div className="correction-user-area">
            <div className="top-avatar" aria-hidden="true">
              {avatarLetter}
            </div>

            <div className="top-user-info">
              <strong>{fullName}</strong>
              <span>Student</span>
            </div>
          </div>
        </header>

        <section className="correction-content">
          <div className="correction-hero">
            <div className="hero-copy">
              <div>
                <span className="hero-label">
                  ATTENDANCE
                </span>

                <h1>Correction Requests</h1>

                <p>
                  Submit and track requests for attendance
                  corrections.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="new-request-button"
              onClick={openNewRequest}
            >
              New Correction Request
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card pending">
              <div>
                <span>Pending Requests</span>
                <strong>{pendingCount}</strong>
                <small>Awaiting review</small>
              </div>
            </div>

            <div className="stat-card approved">
              <div>
                <span>Approved Requests</span>
                <strong>{approvedCount}</strong>
                <small>Successfully updated</small>
              </div>
            </div>

            <div className="stat-card rejected">
              <div>
                <span>Rejected Requests</span>
                <strong>{rejectedCount}</strong>
                <small>Not approved</small>
              </div>
            </div>

            <div className="stat-card total">
              <div>
                <span>Total Requests</span>
                <strong>{requests.length}</strong>
                <small>All time</small>
              </div>
            </div>
          </div>

          <div className="correction-layout">
            <div className="correction-left">
              <div className="filter-card">
                <div className="filter-field search-field">
                  <label htmlFor="filter-search">Search</label>
                  <div className="input-with-prefix">
                    <input
                      id="filter-search"
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search by course, reason..."
                    />
                  </div>
                </div>

                <div className="filter-field">
                  <label htmlFor="filter-status">Status</label>
                  <select
                    id="filter-status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                  >
                    <option>All Status</option>
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="filter-course">Course</label>
                  <select
                    id="filter-course"
                    value={courseFilter}
                    onChange={(event) =>
                      setCourseFilter(event.target.value)
                    }
                  >
                    {courseOptions.map((course) => (
                      <option key={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="filter-from-date">From Date</label>
                  <input
                    id="filter-from-date"
                    className="date-input"
                    type="date"
                    value={fromDate}
                    onChange={(event) =>
                      setFromDate(event.target.value)
                    }
                  />
                </div>

                <div className="filter-field">
                  <label htmlFor="filter-to-date">To Date</label>
                  <input
                    id="filter-to-date"
                    className="date-input"
                    type="date"
                    value={toDate}
                    onChange={(event) =>
                      setToDate(event.target.value)
                    }
                  />
                </div>

                <button
                  type="button"
                  className="reset-filter-button"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              </div>

              <div className="requests-card">
                <div className="requests-card-header">
                  <div className="section-title">
                    <div>
                      <h2>My Correction Requests</h2>
                      <p>
                        Track your attendance correction
                        submissions.
                      </p>
                    </div>
                  </div>

                  <span className="result-count">
                    Showing {filteredRequests.length} of{" "}
                    {requests.length} requests
                  </span>
                </div>

                <div className="requests-table-wrap">
                  <table className="requests-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Section</th>
                        <th>Attendance Date</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Submitted At</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request.id}>
                          <td>
                            <strong className="request-id">
                              #{request.id}
                            </strong>
                          </td>

                          <td>{request.date}</td>

                          <td>
                            <strong>
                              {request.course}
                            </strong>
                          </td>

                          <td>{request.section}</td>

                          <td>
                            {request.attendanceDate}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${request.status.toLowerCase()}`}
                            >
                              {request.status}
                            </span>
                          </td>

                          <td className="reason-cell">
                            {request.reason}
                          </td>

                          <td>
                            {request.submittedAt}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="view-button"
                              onClick={() =>
                                setSelectedRequest(
                                  request
                                )
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredRequests.length === 0 && (
                        <tr>
                          <td
                            colSpan="9"
                            className="empty-table"
                          >
                            <p>
                              {requests.length === 0
                                ? "No correction requests yet."
                                : "No correction requests match your filters."}
                            </p>
                            <button
                              type="button"
                              className="view-button"
                              onClick={
                                requests.length === 0
                                  ? openNewRequest
                                  : resetFilters
                              }
                            >
                              {requests.length === 0
                                ? "New Correction Request"
                                : "Reset filters"}
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="correction-right">
              <div className="side-card">
                <div className="side-card-title">
                  <h3>
                    How Correction Requests Work
                  </h3>
                </div>

                <div className="process-list">
                  <div className="process-item">
                    <span>1</span>
                    <div>
                      <strong>
                        Select the attendance record
                      </strong>
                      <p>
                        Choose the class and date you
                        need to correct.
                      </p>
                    </div>
                  </div>

                  <div className="process-item">
                    <span>2</span>
                    <div>
                      <strong>
                        Explain the issue
                      </strong>
                      <p>
                        Provide a clear reason and
                        supporting details.
                      </p>
                    </div>
                  </div>

                  <div className="process-item">
                    <span>3</span>
                    <div>
                      <strong>Submit request</strong>
                      <p>
                        Your request will be sent to
                        the lecturer for review.
                      </p>
                    </div>
                  </div>

                  <div className="process-item">
                    <span>4</span>
                    <div>
                      <strong>Lecturer reviews</strong>
                      <p>
                        You will see the decision here
                        after review.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="side-card help-card">
                <div className="side-card-title">
                  <h3>Need help?</h3>
                </div>

                <p>
                  If you believe there is a mistake in
                  your attendance record, you can submit
                  a correction request. Provide accurate
                  details and supporting evidence when
                  available.
                </p>
              </div>

              <div className="side-card tips-card">
                <div className="side-card-title">
                  <h3>Tips for a Successful Request</h3>
                </div>

                <ul>
                  <li>
                    Select the correct course and date
                  </li>
                  <li>
                    Provide a clear and honest reason
                  </li>
                  <li>
                    Attach supporting evidence when
                    available
                  </li>
                  <li>
                    Submit your request as soon as
                    possible
                  </li>
                  <li>
                    Check this page for review updates
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <Footer />
      </main>

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="request-modal">
            <div className="modal-header">
              <div>
                <span>ATTENDANCE</span>
                <h2>New Correction Request</h2>
                <p>
                  Provide the attendance details that need
                  correction.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitRequest}>
              <div className="modal-grid">
                <label>
                  Course
                  <select
                    name="course"
                    value={form.course}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">
                      Select course
                    </option>
                    {courseOptions
                      .filter(
                        (course) =>
                          course !== "All Courses"
                      )
                      .map((course) => (
                        <option
                          key={course}
                          value={course}
                        >
                          {course}
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  Section
                  <input
                    name="section"
                    value={form.section}
                    onChange={handleFormChange}
                    placeholder="Example: Sec 1"
                    required
                  />
                </label>

                <label>
                  Attendance Date
                  <input
                    type="date"
                    name="attendanceDate"
                    value={form.attendanceDate}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Reason
                  <input
                    name="reason"
                    value={form.reason}
                    onChange={handleFormChange}
                    placeholder="Example: Present but marked absent"
                    required
                  />
                </label>

                <label className="full-width">
                  Additional Details
                  <textarea
                    name="details"
                    value={form.details}
                    onChange={handleFormChange}
                    placeholder="Explain what happened and provide any useful details."
                    rows="5"
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-request-button"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRequest(null);
            }
          }}
        >
          <div className="request-modal details-modal">
            <div className="modal-header">
              <div>
                <span>REQUEST DETAILS</span>
                <h2>#{selectedRequest.id}</h2>
                <p>
                  Submitted {selectedRequest.submittedAt}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
            </div>

            <div className="details-grid">
              <div>
                <span>Course</span>
                <strong>{selectedRequest.course}</strong>
              </div>

              <div>
                <span>Section</span>
                <strong>{selectedRequest.section}</strong>
              </div>

              <div>
                <span>Attendance Date</span>
                <strong>
                  {selectedRequest.attendanceDate}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  <span
                    className={`status-badge ${selectedRequest.status.toLowerCase()}`}
                  >
                    {selectedRequest.status}
                  </span>
                </strong>
              </div>

              <div className="details-full">
                <span>Reason</span>
                <strong>{selectedRequest.reason}</strong>
              </div>

              {selectedRequest.details && (
                <div className="details-full">
                  <span>Additional Details</span>
                  <p>{selectedRequest.details}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorrectionRequests;
