import pool from "../config/db.js";

// Single source of truth for the incubator's "impact" numbers (startups
// supported, mentor connections, cohorts/year). Both the landing page and
// the About page render these, so they must both call this helper rather
// than each running their own copy of the query — otherwise the two pages
// can silently show different numbers for the same stat.
export const getImpactStats = async () => {
  let impactStats = { startupsSupported: 0, mentorConnections: 0, cohortsPerYear: 2 };
  try {
    const [projectsRes, mentorConnRes, cohortYearsRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::integer AS count FROM projects`),
      pool.query(`
        SELECT (
          (SELECT COUNT(*) FROM mentor_project_assignments) +
          (SELECT COUNT(*) FROM mentor_assignments)
        )::integer AS count
      `),
      pool.query(`
        SELECT ROUND(COUNT(*)::numeric / GREATEST(COUNT(DISTINCT EXTRACT(YEAR FROM start_date)), 1))::integer AS avg_per_year
        FROM cohorts WHERE start_date IS NOT NULL
      `),
    ]);
    impactStats = {
      startupsSupported: projectsRes.rows[0].count,
      mentorConnections: mentorConnRes.rows[0].count,
      // Falls back to the program's standard cadence (2/yr) when there's
      // not yet enough cohort history to compute a meaningful average.
      cohortsPerYear: cohortYearsRes.rows[0].avg_per_year || 2,
    };
  } catch (statsErr) {
    console.error("Impact stats error:", statsErr);
  }
  return impactStats;
};
