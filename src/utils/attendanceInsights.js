/* =========================================================
   ATTENDANCE INSIGHTS
   Shared, dependency-free helpers that derive weekly
   summaries, warnings and chatbot answers from the REAL
   attendance records returned by GET /attendance/my.

   No mock data is created here. Every number comes from
   the records passed in by the caller.
   ========================================================= */

export function toRecords(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.attendance)) return data.attendance;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function normStatus(item) {
  return String(
    item?.attendance_status || item?.status || item?.validation_status || ""
  )
    .trim()
    .toLowerCase();
}

export function recordDate(item) {
  const raw =
    item?.session_date ||
    item?.sessionDate ||
    item?.attendance_time ||
    item?.date ||
    item?.attendance_date ||
    item?.created_at ||
    item?.marked_at ||
    item?.scanned_at ||
    null;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function courseOf(item) {
  return (
    item?.course_name ||
    item?.course_title ||
    item?.courseName ||
    item?.course_code ||
    item?.courseCode ||
    item?.section_name ||
    item?.sectionName ||
    "Unknown Course"
  );
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  return d;
}

function endOfWeek(date) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

export function getOverallStats(records) {
  const list = Array.isArray(records) ? records : [];
  const total = list.length;
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  list.forEach((item) => {
    const s = normStatus(item);
    if (s === "present" || s === "accepted") present += 1;
    else if (s === "absent") absent += 1;
    else if (s === "late") late += 1;
    else if (s === "excused") excused += 1;
    else if (s === "recorded") present += 1;
  });

  const attended = present + late + excused;
  const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

  return { total, present, absent, late, excused, attended, rate };
}

export function getWeeklySummary(records, now = new Date()) {
  const list = Array.isArray(records) ? records : [];
  const start = startOfWeek(now);
  const end = endOfWeek(now);

  const weekRecords = list.filter((item) => {
    const d = recordDate(item);
    return d && d >= start && d <= end;
  });

  const stats = getOverallStats(weekRecords);

  return {
    start,
    end,
    total: stats.total,
    present: stats.present,
    absent: stats.absent,
    late: stats.late,
    excused: stats.excused,
    attended: stats.attended,
    rate: stats.rate,
    records: weekRecords,
  };
}

function latestDateFor(records, predicate) {
  const dates = records
    .filter(predicate)
    .map(recordDate)
    .filter(Boolean)
    .sort((a, b) => b - a);
  return dates[0] || null;
}

function topCourseFor(records, predicate) {
  const counts = new Map();
  records.filter(predicate).forEach((item) => {
    const c = courseOf(item);
    counts.set(c, (counts.get(c) || 0) + 1);
  });
  let best = null;
  let bestCount = 0;
  counts.forEach((count, course) => {
    if (count > bestCount) {
      bestCount = count;
      best = course;
    }
  });
  return best;
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/* =========================================================
   WARNINGS — derived from real records only.
   Subtle, informational, never alarming visually.
   ========================================================= */

export function deriveWarnings(records, weekly = null) {
  const list = Array.isArray(records) ? records : [];
  if (list.length === 0) return [];

  const overall = getOverallStats(list);
  const week = weekly || getWeeklySummary(list);
  const warnings = [];
  let id = 1;

  const push = (w) => {
    warnings.push({ id: `W-${id++}`, ...w });
  };

  if (overall.absent >= 3) {
    push({
      type: "Absence accumulation",
      date: fmtDate(
        latestDateFor(list, (i) => normStatus(i) === "absent")
      ),
      course: topCourseFor(list, (i) => normStatus(i) === "absent") || "—",
      message: `You have ${overall.absent} absent sessions out of ${overall.total}. Review the affected courses and consider submitting a correction request if any record is incorrect.`,
    });
  }

  if (overall.total >= 3 && overall.rate < 75) {
    push({
      type: "Low attendance rate",
      date: fmtDate(new Date()),
      course: topCourseFor(list, () => true) || "—",
      message: `Your overall attendance rate is ${overall.rate}%. The usual target is 75%. Attending upcoming sessions will raise this rate.`,
    });
  }

  if (overall.late >= 2) {
    push({
      type: "Repeated lateness",
      date: fmtDate(
        latestDateFor(list, (i) => normStatus(i) === "late")
      ),
      course: topCourseFor(list, (i) => normStatus(i) === "late") || "—",
      message: `You have ${overall.late} late arrivals. Try to scan the QR code right at the start of each session.`,
    });
  }

  if (week.absent >= 2) {
    push({
      type: "This week absences",
      date: fmtDate(week.end),
      course:
        topCourseFor(week.records, (i) => normStatus(i) === "absent") || "—",
      message: `You missed ${week.absent} session(s) this week. Check your weekly summary for details.`,
    });
  }

  return warnings.slice(0, 4);
}

/* =========================================================
   CHATBOT — rule-based answers over real attendance data.
   ========================================================= */

export const SUGGESTED_QUESTIONS = [
  "How many sessions did I attend this week?",
  "How many absences do I have?",
  "Give me a summary of my attendance this week.",
  "How many warnings do I have?",
  "What is my attendance percentage?",
  "Show me my weekly attendance.",
];

function includesAny(text, words) {
  return words.some((w) => text.includes(w));
}

export function answerAttendanceQuestion(question, ctx) {
  const q = String(question || "").toLowerCase().trim();
  const { overall, weekly, warnings } = ctx;

  if (!q) return "Please type a question about your attendance.";

  const wantsWeek =
    q.includes("week") ||
    q.includes("this week") ||
    q.includes("weekly") ||
    q.includes("current week");

  // Warnings
  if (
    includesAny(q, ["warning", "warnings", "warn", "alert", "penalt"]) ||
    q.includes("how many warnings")
  ) {
    if (warnings.length === 0) {
      return `You currently have 0 attendance warnings. Overall you have ${overall.present} present, ${overall.absent} absent and ${overall.late} late out of ${overall.total} sessions (rate ${overall.rate}%). Keep attending regularly to stay clear.`;
    }
    const first = warnings[0];
    return `You have ${warnings.length} attendance warning(s). The most relevant is "${first.type}"${
      first.course && first.course !== "—" ? ` for ${first.course}` : ""
    }: ${first.message} Overall rate is ${overall.rate}% across ${overall.total} sessions.`;
  }

  // Percentage
  if (
    q.includes("percentage") ||
    q.includes("percent") ||
    q.includes("%") ||
    q.includes("rate")
  ) {
    if (wantsWeek) {
      return `This week your attendance rate is ${weekly.rate}% — ${weekly.attended} attended out of ${weekly.total} sessions (${weekly.present} present, ${weekly.late} late, ${weekly.absent} absent). Overall this semester your rate is ${overall.rate}% across ${overall.total} sessions.`;
    }
    return `Your overall attendance rate is ${overall.rate}% — ${overall.attended} attended out of ${overall.total} sessions (${overall.present} present, ${overall.late} late, ${overall.excused} excused, ${overall.absent} absent). This week it is ${weekly.rate}% across ${weekly.total} sessions.`;
  }

  // Absences
  if (q.includes("absen") || q.includes("absent") || q.includes("missed")) {
    if (wantsWeek) {
      return `This week you have ${weekly.absent} absent session(s) out of ${weekly.total} sessions. Overall you have ${overall.absent} absences out of ${overall.total} sessions.`;
    }
    return `You have ${overall.absent} absent session(s) out of ${overall.total} overall (${weekly.absent} of them this week). You also have ${overall.present} present and ${overall.late} late.`;
  }

  // Late
  if (q.includes("late")) {
    return `You have ${overall.late} late session(s) overall (${weekly.late} this week). Overall: ${overall.present} present, ${overall.absent} absent, ${overall.total} total, rate ${overall.rate}%.`;
  }

  // Attended / present
  if (
    q.includes("attend") ||
    q.includes("present") ||
    q.includes("session") ||
    q.includes("how many")
  ) {
    if (wantsWeek || q.includes("summary") || q.includes("show")) {
      return `Weekly summary: ${weekly.total} total sessions — ${weekly.present} present, ${weekly.late} late, ${weekly.absent} absent, ${weekly.excused} excused. Attendance rate ${weekly.rate}%. Overall: ${overall.total} sessions, ${overall.present} present, ${overall.absent} absent, rate ${overall.rate}%.`;
    }
    return `Overall you attended ${overall.attended} out of ${overall.total} sessions (${overall.present} present, ${overall.late} late, ${overall.excused} excused, ${overall.absent} absent) — rate ${overall.rate}%. This week: ${weekly.attended} of ${weekly.total} (rate ${weekly.rate}%).`;
  }

  // Summary
  if (q.includes("summar") || q.includes("overview") || q.includes("report")) {
    return `Attendance summary — This week: ${weekly.total} sessions, ${weekly.present} present, ${weekly.late} late, ${weekly.absent} absent, rate ${weekly.rate}%. Overall: ${overall.total} sessions, ${overall.present} present, ${overall.absent} absent, ${overall.late} late, rate ${overall.rate}%. Warnings: ${warnings.length}.`;
  }

  // Fallback
  return `Based on your records: overall ${overall.total} sessions (${overall.present} present, ${overall.late} late, ${overall.absent} absent, rate ${overall.rate}%). This week: ${weekly.total} sessions (${weekly.present} present, ${weekly.absent} absent, rate ${weekly.rate}%). You have ${warnings.length} warning(s). Ask about absences, percentage, weekly summary or warnings.`;
}
