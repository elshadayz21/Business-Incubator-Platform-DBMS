import pool from "../../config/db.js";
import { getProjectsStats } from "../projects/projects.js";
import { getMentorTotals } from "../mentors/mentors.js";
import { getWorkshopTotals } from "../workshop/workshops.js";

// Single source of truth for the shared Admin/Superadmin Dashboard landing
// page. Everything the charts and stat cards need lives behind one call so
// the page has one loading/error state, the way Reports.jsx already does
// for its own summary endpoint.

// Cumulative "growth trajectory" — total entrepreneurs and total projects
// that existed by the end of each of the last N months. generate_series
// guarantees every month appears even if nothing happened in it, so the
// line chart doesn't silently skip a month.
const getGrowthTrajectory = async (months = 8) => {
  const res = await pool.query(
    `
    WITH months AS (
      SELECT date_trunc('month', now()) - (n || ' months')::interval AS month_start
      FROM generate_series(0, $1 - 1) AS n
    )
    SELECT
      to_char(m.month_start, 'Mon') AS month,
      (SELECT COUNT(*)::integer FROM users
        WHERE role = 'entrepreneur' AND created_at < m.month_start + interval '1 month') AS users,
      (SELECT COUNT(*)::integer FROM projects
        WHERE created_at < m.month_start + interval '1 month') AS projects
    FROM months m
    ORDER BY m.month_start ASC
    `,
    [months],
  );
  return res.rows;
};

// New entrepreneur registrations for each of the last N days.
const getDailyRegistrations = async (days = 7) => {
  const res = await pool.query(
    `
    WITH days AS (
      SELECT date_trunc('day', now()) - (n || ' days')::interval AS day_start
      FROM generate_series($1 - 1, 0, -1) AS n
    )
    SELECT
      to_char(d.day_start, 'Dy') AS day,
      (SELECT COUNT(*)::integer FROM users
        WHERE role = 'entrepreneur'
          AND created_at >= d.day_start AND created_at < d.day_start + interval '1 day') AS users
    FROM days d
    ORDER BY d.day_start ASC
    `,
    [days],
  );
  return res.rows;
};

// Mentor headcount by expertise area, top 4 (recharts pie is unreadable
// past ~4-5 slices, so smaller categories are folded into "Other").
const getMentorsByExpertise = async (topN = 4) => {
  const res = await pool.query(
    `
    SELECT COALESCE(NULLIF(TRIM(expertise), ''), 'Unspecified') AS name, COUNT(*)::integer AS value
    FROM mentors
    GROUP BY 1
    ORDER BY value DESC
    `,
  );
  const rows = res.rows;
  if (rows.length <= topN) return rows;
  const top = rows.slice(0, topN);
  const otherTotal = rows.slice(topN).reduce((sum, r) => sum + r.value, 0);
  if (otherTotal > 0) top.push({ name: "Other", value: otherTotal });
  return top;
};

const getWorkshopsByStatus = async () => {
  const res = await pool.query(
    `SELECT status, COUNT(*)::integer AS count FROM workshops GROUP BY status`,
  );
  // Normalize into the three statuses the UI expects, in a stable order,
  // even when a status has zero workshops.
  const byStatus = Object.fromEntries(res.rows.map((r) => [r.status, r.count]));
  return [
    { status: "Completed", count: byStatus.completed || 0 },
    { status: "Ongoing", count: byStatus.ongoing || 0 },
    { status: "Scheduled", count: byStatus.scheduled || 0 },
  ];
};

export const getDashboardOverview = async () => {
  const [
    entrepreneursRes,
    projectStats,
    mentorTotals,
    workshopTotals,
    growthData,
    userGrowthData,
    mentorsData,
    workshopsData,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*)::integer AS count FROM users WHERE role = 'entrepreneur'`),
    getProjectsStats(),
    getMentorTotals(),
    getWorkshopTotals(),
    getGrowthTrajectory(8),
    getDailyRegistrations(7),
    getMentorsByExpertise(4),
    getWorkshopsByStatus(),
  ]);

  const totalEntrepreneurs = entrepreneursRes.rows[0].count;
  const totalMentors = Number(mentorTotals.total) || 0;
  const activeMentorsPct =
    totalMentors > 0 ? Math.round((Number(mentorTotals.active) / totalMentors) * 100) : 0;

  // Month-over-month growth for the entrepreneur count badge, using the
  // same trajectory data instead of a second query.
  const lastMonth = growthData[growthData.length - 2]?.users ?? null;
  const thisMonth = growthData[growthData.length - 1]?.users ?? totalEntrepreneurs;
  const entrepreneurGrowthPct =
    lastMonth && lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  return {
    stats: {
      totalEntrepreneurs,
      entrepreneurGrowthPct,
      totalStartups: Number(projectStats.total) || 0,
      approvedStartupsPct:
        Number(projectStats.total) > 0
          ? Math.round((Number(projectStats.completed) / Number(projectStats.total)) * 100)
          : 0,
      totalMentors,
      activeMentorsPct,
      totalWorkshops: Number(workshopTotals.total) || 0,
      workshopsCompleted: Number(workshopTotals.completed) || 0,
    },
    growthData,
    userGrowthData,
    mentorsData,
    workshopsData,
  };
};
