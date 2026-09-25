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

/* =========================================================
   AI & ANALYTICS — risk engine + anomaly detection
   Pure functions over the same real records the chatbot
   already uses. No mock data, no side effects.
   Levels: safe → watch → danger → critical
   ========================================================= */

export function getCourseStats(records) {
  const list = Array.isArray(records) ? records : [];
  const map = new Map();

  list.forEach((item) => {
    const course = courseOf(item);
    const s = normStatus(item);

    if (!map.has(course)) {
      map.set(course, {
        course,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      });
    }

    const row = map.get(course);
    row.total += 1;
    if (s === "present" || s === "accepted" || s === "recorded") row.present += 1;
    else if (s === "absent") row.absent += 1;
    else if (s === "late") row.late += 1;
    else if (s === "excused") row.excused += 1;
  });

  return [...map.values()]
    .map((row) => ({
      ...row,
      attended: row.present + row.late + row.excused,
      rate:
        row.total > 0
          ? Math.round(
              ((row.present + row.late + row.excused) / row.total) * 100
            )
          : 0,
    }))
    .sort((a, b) => a.rate - b.rate || b.absent - a.absent);
}

function maxAbsenceStreak(records) {
  const dated = records
    .map((item) => ({ date: recordDate(item), s: normStatus(item) }))
    .filter((x) => x.date)
    .sort((a, b) => a.date - b.date);

  let best = 0;
  let run = 0;

  dated.forEach(({ s }) => {
    if (s === "absent") {
      run += 1;
      if (run > best) best = run;
    } else if (s === "present" || s === "late" || s === "excused" || s === "accepted") {
      run = 0;
    }
  });

  return best;
}

const LEVEL_RANK = { safe: 0, watch: 1, danger: 2, critical: 3 };

function raise(level, candidate) {
  return LEVEL_RANK[candidate] > LEVEL_RANK[level] ? candidate : level;
}

export function assessRisk(records, overallInput = null, weeklyInput = null, warningsInput = [], byCourseInput = []) {
  const list = Array.isArray(records) ? records : [];
  const overall = overallInput || getOverallStats(list);
  const weekly = weeklyInput || getWeeklySummary(list);
  const warnings = Array.isArray(warningsInput) ? warningsInput : [];
  const byCourse =
    Array.isArray(byCourseInput) && byCourseInput.length > 0
      ? byCourseInput
      : getCourseStats(list);

  let level = "safe";
  const reasons = [];
  const anomalies = [];

  const total = Number(overall.total || 0);
  const rate = Number(overall.rate || 0);
  const absent = Number(overall.absent || 0);
  const late = Number(overall.late || 0);
  const weekAbsent = Number(weekly.absent || 0);
  const weekRate = Number(weekly.rate || 0);
  const weekTotal = Number(weekly.total || 0);

  if (total < 3 && weekAbsent < 2) {
    return {
      level: "safe",
      score: 0,
      reasons: [{ code: "insufficient-data", message: `Only ${total} recorded session(s) so far — not enough data for a risk assessment.` }],
      anomalies: [],
      worstCourse: byCourse[0] || null,
      courseRisks: (byCourse || []).map((c) => ({ ...c, flag: "safe" })),
      overall,
      weekly,
    };
  }

  // ---- Overall-rate rules ----
  if (total >= 3 && rate < 60) {
    level = raise(level, "critical");
    reasons.push({ code: "overall-critical", message: `Overall attendance rate is ${rate}% — below the 60% critical line.` });
  } else if (total >= 3 && rate < 75) {
    level = raise(level, "danger");
    reasons.push({ code: "overall-low", message: `Overall attendance rate is ${rate}% — below the 75% target.` });
  } else if (total >= 3 && rate < 85) {
    level = raise(level, "watch");
    reasons.push({ code: "overall-watch", message: `Overall attendance rate is ${rate}% — slightly below the 85% comfort zone.` });
  }

  // ---- Absence accumulation ----
  if (absent >= 5) {
    level = raise(level, "critical");
    reasons.push({ code: "absences-critical", message: `${absent} absent sessions out of ${total} overall.` });
  } else if (absent >= 3) {
    level = raise(level, "danger");
    reasons.push({ code: "absences-high", message: `${absent} absent sessions out of ${total} overall.` });
  }

  // ---- Weekly anomaly ----
  if (weekAbsent >= 2) {
    level = raise(level, "danger");
    reasons.push({ code: "week-absences", message: `${weekAbsent} absence(s) this week alone.` });
  } else if (weekAbsent >= 1) {
    level = raise(level, "watch");
    reasons.push({ code: "week-absence", message: `${weekAbsent} absence(s) this week.` });
  }

  if (weekTotal >= 2 && total > weekTotal) {
    const drop = rate - weekRate;
    if (drop >= 20) {
      level = raise(level, "danger");
      anomalies.push({ code: "weekly-drop", message: `This week (${weekRate}%) is ${Math.round(drop)} points below your overall ${rate}% — a sudden dip.` });
    } else if (drop >= 10) {
      level = raise(level, "watch");
      anomalies.push({ code: "weekly-slip", message: `This week (${weekRate}%) slipped ${Math.round(drop)} points below your overall ${rate}%.` });
    }
  }

  // ---- Absence streak ----
  const streak = maxAbsenceStreak(list);
  if (streak >= 3) {
    level = raise(level, "critical");
    anomalies.push({ code: "absence-streak", message: `${streak} absences in a row detected — a repeated pattern, not an isolated miss.` });
  } else if (streak >= 2) {
    level = raise(level, "danger");
    anomalies.push({ code: "absence-repeat", message: `2 absences in a row detected.` });
  }

  if (late >= 3) {
    level = raise(level, "watch");
    reasons.push({ code: "lateness", message: `${late} late arrivals overall.` });
  }

  // ---- Per-course risk (the subject-level flags) ----
  const courseRisks = (byCourse || []).map((c) => {
    let flag = "safe";
    if (c.total >= 3 && c.rate < 50) flag = "critical";
    else if ((c.total >= 2 && c.rate < 75) || (c.total >= 2 && c.absent >= 2)) flag = "danger";
    else if (c.rate < 85 || c.absent >= 1 || c.late >= 2) flag = "watch";
    return { ...c, flag };
  });

  const worstCourse = courseRisks[0] || null;

  courseRisks.forEach((c) => {
    if (c.flag === "critical" && c.total >= 2) {
      level = raise(level, "critical");
      reasons.push({ code: "course-critical", course: c.course, message: `${c.course}: ${c.rate}% (${c.absent} absent of ${c.total}) — critically at risk.` });
    } else if (c.flag === "danger" && c.total >= 2) {
      level = raise(level, "danger");
      reasons.push({ code: "course-danger", course: c.course, message: `${c.course}: ${c.rate}% (${c.absent} absent of ${c.total}) — at risk.` });
    }
  });

  // Course outlier anomaly: worst course far below overall
  if (worstCourse && worstCourse.total >= 2 && rate - worstCourse.rate >= 25 && level !== "safe") {
    anomalies.push({ code: "course-outlier", message: `${worstCourse.course} (${worstCourse.rate}%) trails your overall ${rate}% by ${rate - worstCourse.rate} points.` });
  }

  // Warnings from the existing engine reinforce the level
  if (warnings.length >= 3) level = raise(level, "danger");

  const score = Math.min(
    100,
    Math.round(
      Math.max(0, 100 - rate) * 0.5 +
        Math.min(absent, 8) * 6 +
        Math.min(weekAbsent, 4) * 5 +
        (streak >= 3 ? 12 : streak === 2 ? 6 : 0) +
        warnings.length * 2
    )
  );

  return { level, score, reasons, anomalies, worstCourse, courseRisks, overall, weekly };
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
  const records = Array.isArray(ctx.records)
    ? ctx.records
    : Array.isArray(ctx.byCourse) && ctx.byCourse.length
      ? []
      : [];
  const risk =
    ctx.risk ||
    assessRisk(
      records,
      overall,
      weekly,
      warnings,
      ctx.byCourse || []
    );

  if (!q) return "Please type a question about your attendance.";

  const wantsWeek =
    q.includes("week") ||
    q.includes("this week") ||
    q.includes("weekly") ||
    q.includes("current week");

  // ---- Risk / danger / anomaly ----
  if (
    includesAny(q, ["risk", "danger", "at risk", "critical", "red flag", "flag", "alert", "anomal", "pattern", "affect", "effect", "failing", "fail"])
  ) {
    const atRisk = (risk.courseRisks || []).filter(
      (c) => (c.flag === "danger" || c.flag === "critical") && c.total >= 2
    );
    const levelLine =
      risk.level === "critical"
        ? `Your attendance risk level is CRITICAL (score ${risk.score}/100).`
        : risk.level === "danger"
          ? `Your attendance risk level is HIGH (score ${risk.score}/100).`
          : risk.level === "watch"
            ? `Your attendance risk level is moderate (score ${risk.score}/100).`
            : `Your attendance risk level is LOW (score ${risk.score}/100) — nothing alarming.`;
    const parts = [levelLine];
    risk.reasons.slice(0, 2).forEach((r) => parts.push(r.message));
    risk.anomalies.slice(0, 2).forEach((a) => parts.push(`Anomaly: ${a.message}`));
    if (atRisk.length) {
      parts.push(
        `Subject(s) at risk: ${atRisk.map((c) => `${c.course} (${c.rate}%, ${c.absent} absent/${c.total})`).join("; ")}.`
      );
    } else if (risk.level === "safe") {
      parts.push(`No subject is currently at risk. Overall ${overall.rate}% across ${overall.total} sessions.`);
    }
    parts.push(`Overall: ${overall.present} present, ${overall.absent} absent, ${overall.late} late out of ${overall.total} (rate ${overall.rate}%).`);
    return parts.join(" ");
  }

  // ---- Per-course breakdown ----
  if (
    includesAny(q, ["course", "subject", "material", "by course", "per course", "which course", "which subject"])
  ) {
    const rows = risk.courseRisks || [];
    if (!rows.length) {
      return `I don't have per-course data yet. Overall: ${overall.total} sessions, rate ${overall.rate}%.`;
    }
    const lines = rows.slice(0, 5).map(
      (c) =>
        `${c.course}: ${c.rate}% (${c.attended}/${c.total} attended, ${c.absent} absent)${c.flag === "danger" || c.flag === "critical" ? " — AT RISK" : ""}`
    );
    return `Attendance by course — ${lines.join(" · ")}. Overall rate ${overall.rate}% across ${overall.total} sessions.`;
  }

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
