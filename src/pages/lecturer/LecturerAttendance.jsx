import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLecturerAttendanceReport, getLecturerSections } from "../../services/api";
import "./LecturerAttendance.css";

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.attendance)) return data.attendance;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getAttendanceStatus(row) {
  return String(
    row?.attendance_status ??
      row?.attendanceStatus ??
      row?.status ??
      "absent"
  ).toLowerCase();
}

function getStudentName(row) {
  return (
    <div
      className={`lecturer-attendance-page${
        mobileMenuOpen ? " mobile-menu-open" : ""
      }`}
    >
      <header className="attendance-mobile-header">
        <button
          type="button"
          className="attendance-mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <button
          type="button"
          className="attendance-mobile-brand"
          onClick={() => handleMobileNavigation("/lecturer/dashboard")}
        >
          Attendify
        </button>

        <div className="attendance-mobile-avatar">
          {lecturerInitials}
        </div>
      </header>

      <div
        className="attendance-mobile-overlay"
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <aside
        className={`lecturer-attendance-sidebar${
          mobileMenuOpen ? " mobile-open" : ""
        }`}
      >
        <div className="attendance-sidebar-brand">
          <button
            type="button"
            className="attendance-brand-button"
            onClick={() => handleMobileNavigation("/lecturer/dashboard")}
          >
            <span className="attendance-brand-mark">A</span>

            <span>
              <strong>Attendify</strong>
              <small>LECTURER PORTAL</small>
            </span>
          </button>

          <button
            type="button"
            className="attendance-mobile-close"
            onClick={closeMobileMenu}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <div className="attendance-sidebar-profile">
          <div className="attendance-profile-avatar">
            {lecturerInitials}
          </div>

          <div>
            <strong>{lecturerName}</strong>
            <span>Lecturer account</span>
          </div>
        </div>

        <nav className="attendance-sidebar-nav" aria-label="Lecturer navigation">
          <button
            type="button"
            onClick={() => handleMobileNavigation("/lecturer/dashboard")}
          >
            <span>DB</span>
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => handleMobileNavigation("/lecturer/sessions")}
          >
            <span>AS</span>
            Attendance Sessions
          </button>

          <button
            type="button"
            onClick={() => handleMobileNavigation("/lecturer/sections")}
          >
            <span>MS</span>
            My Sections
          </button>

          <button
            type="button"
            className="active"
            onClick={() => handleMobileNavigation("/lecturer/attendance")}
          >
            <span>AT</span>
            Attendance
          </button>

          <button
            type="button"
            onClick={() => handleMobileNavigation("/lecturer/reports")}
          >
            <span>RP</span>
            Reports
          </button>
        </nav>

        <div className="attendance-sidebar-footer">
          <button type="button" onClick={handleLogout}>
            <span>LO</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="lecturer-attendance-main">
        <header className="lecturer-attendance-topbar">
          <div>
            <span className="topbar-label">LECTURER PORTAL</span>
            <h1>Attendance</h1>
            <p>
              Review attendance records for your assigned sections.
            </p>
          </div>

          <div className="topbar-user">
            <span className="topbar-user-context">
              Attendance monitoring
            </span>

            <div className="topbar-avatar">
              {lecturerInitials}
            </div>
          </div>
        </header>

        <section className="lecturer-attendance-content">
          <div className="attendance-hero">
            <div>
              <span className="hero-label">ATTENDANCE MONITORING</span>

              <h2>Attendance records</h2>

              <p>
                Filter and review attendance activity across your teaching
                sections.
              </p>
            </div>

            <button
              type="button"
              className="attendance-refresh-button"
              onClick={() => loadAttendance(true)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="attendance-alert">
              <div className="alert-icon">!</div>

              <div className="alert-content">
                <strong>Unable to load attendance</strong>
                <p>{error}</p>
              </div>

              <button
                type="button"
                onClick={() => loadAttendance(true)}
                disabled={refreshing}
              >
                {refreshing ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          <div className="attendance-stat-grid">
            <div className="attendance-stat-card">
              <div className="stat-icon">AT</div>
              <div>
                <span>Total records</span>
                <strong>{stats.total}</strong>
                <small>Records matching the current filters</small>
              </div>
            </div>

            <div className="attendance-stat-card">
              <div className="stat-icon">PR</div>
              <div>
                <span>Present</span>
                <strong>{stats.present}</strong>
                <small>Students marked present</small>
              </div>
            </div>

            <div className="attendance-stat-card">
              <div className="stat-icon">LT</div>
              <div>
                <span>Late</span>
                <strong>{stats.late}</strong>
                <small>Students marked late</small>
              </div>
            </div>

            <div className="attendance-stat-card">
              <div className="stat-icon">AR</div>
              <div>
                <span>Attendance rate</span>
                <strong>{stats.attendanceRate}%</strong>
                <small>Present + late records</small>
              </div>
            </div>
          </div>

          <section className="attendance-panel">
            <div className="attendance-panel-header">
              <div>
                <span className="panel-label">RECORD FILTERS</span>

                <h3>Attendance history</h3>

                <p>
                  Use the filters to inspect specific attendance records.
                </p>
              </div>
            </div>

            <div className="attendance-filters">
              <div className="attendance-search">
                <span>Q</span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student, course or section..."
                  aria-label="Search student, course or section"
                />
              </div>

              <div className="attendance-filter-field">
                <label htmlFor="attendance-section">Section</label>

                <select
                  id="attendance-section"
                  value={sectionFilter}
                  onChange={(event) => setSectionFilter(event.target.value)}
                  disabled={sectionsLoading}
                >
                  <option value="all">All sections</option>

                  {sections.map((section) => {
                    const id = getSectionId(section);

                    return (
                      <option key={id} value={id}>
                        {getSectionLabel(section)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="attendance-filter-field">
                <label htmlFor="attendance-status">Status</label>

                <select
                  id="attendance-status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excused</option>
                </select>
              </div>

              <div className="attendance-filter-field">
                <label htmlFor="attendance-from">From</label>

                <input
                  id="attendance-from"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>

              <div className="attendance-filter-field">
                <label htmlFor="attendance-to">To</label>

                <input
                  id="attendance-to"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>

              <button
                type="button"
                className="clear-attendance-filters"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>

            {sectionsError && (
              <div className="sections-inline-warning">
                {sectionsError}
              </div>
            )}

            <div className="attendance-table-wrap">
              {loading ? (
                <div className="attendance-loading">
                  <div className="loading-spinner" />

                  <strong>Loading attendance records</strong>

                  <span>Reading attendance data...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="attendance-empty">
                  <div className="empty-icon">AT</div>

                  <h3>No attendance records</h3>

                  <p>No records match the current filters.</p>

                  <button
                    type="button"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="attendance-mobile-list">
                    {filteredRecords.map((row, index) => {
                      const status = getAttendanceStatus(row);
                      const studentName = getStudentName(row);

                      const rowKey =
                        row?.attendance_id ??
                        row?.attendanceId ??
                        `${row?.student_code || index}-${row?.session_date || index}`;

                      return (
                        <article
                          className="attendance-mobile-card"
                          key={rowKey}
                        >
                          <div className="attendance-mobile-card-header">
                            <div className="attendance-student">
                              <div className="student-avatar">
                                {getInitials(
                                  row?.first_name,
                                  row?.last_name
                                )}
                              </div>

                              <div>
                                <strong>{studentName}</strong>

                                <span>
                                  {row?.student_code ||
                                    row?.studentCode ||
                                    row?.email ||
                                    "Student"}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`attendance-status attendance-status-${status}`}
                            >
                              <span className="status-dot" />
                              {status}
                            </span>
                          </div>

                          <div className="attendance-mobile-grid">
                            <div>
                              <span>Course</span>
                              <strong>
                                {row?.course_code ||
                                  row?.courseCode ||
                                  "-"}
                              </strong>
                            </div>

                            <div>
                              <span>Section</span>
                              <strong>
                                {row?.section_name ||
                                  row?.sectionName ||
                                  "-"}
                              </strong>
                            </div>

                            <div>
                              <span>Date</span>
                              <strong>
                                {formatDate(
                                  row?.session_date ||
                                    row?.sessionDate
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>Time</span>
                              <strong>
                                {formatTime(
                                  row?.scheduled_start ||
                                    row?.scheduledStart
                                )}
                                {" - "}
                                {formatTime(
                                  row?.scheduled_end ||
                                    row?.scheduledEnd
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>Source</span>
                              <strong>{row?.source || "-"}</strong>
                            </div>

                            <div>
                              <span>Validation</span>
                              <strong>
                                {row?.validation_status ||
                                  row?.validationStatus ||
                                  "-"}
                              </strong>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="attendance-desktop-table">
                    <table className="lecturer-attendance-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Course</th>
                          <th>Section</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Status</th>
                          <th>Source</th>
                          <th>Validation</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredRecords.map((row, index) => {
                          const status = getAttendanceStatus(row);
                          const studentName = getStudentName(row);

                          const rowKey =
                            row?.attendance_id ??
                            row?.attendanceId ??
                            `${row?.student_code || index}-${row?.session_date || index}`;

                          return (
                            <tr key={rowKey}>
                              <td>
                                <div className="attendance-student">
                                  <div className="student-avatar">
                                    {getInitials(
                                      row?.first_name,
                                      row?.last_name
                                    )}
                                  </div>

                                  <div>
                                    <strong>{studentName}</strong>

                                    <span>
                                      {row?.student_code ||
                                        row?.studentCode ||
                                        row?.email ||
                                        "Student"}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <div className="course-info">
                                  <strong>
                                    {row?.course_code ||
                                      row?.courseCode ||
                                      "-"}
                                  </strong>

                                  <span>
                                    {row?.course_name ||
                                      row?.courseName ||
                                      "Course"}
                                  </span>
                                </div>
                              </td>

                              <td>
                                {row?.section_name ||
                                  row?.sectionName ||
                                  "-"}
                              </td>

                              <td>
                                {formatDate(
                                  row?.session_date ||
                                    row?.sessionDate
                                )}
                              </td>

                              <td>
                                <div className="time-info">
                                  <strong>
                                    {formatTime(
                                      row?.scheduled_start ||
                                        row?.scheduledStart
                                    )}
                                  </strong>

                                  <span>
                                    {formatTime(
                                      row?.scheduled_end ||
                                        row?.scheduledEnd
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span
                                  className={`attendance-status attendance-status-${status}`}
                                >
                                  <span className="status-dot" />
                                  {status}
                                </span>
                              </td>

                              <td>
                                <span className="source-badge">
                                  {row?.source || "-"}
                                </span>
                              </td>

                              <td>
                                <span className="validation-badge">
                                  {row?.validation_status ||
                                    row?.validationStatus ||
                                    "-"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );

}
