/**
 * routes/dashboard.js
 * Aggregated dashboard data endpoint.
 *
 * GET /api/dashboard
 * Returns: totals, pipeline, revenue, tasks, stage distribution,
 *          recent activities, top opportunities.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();

    // ── Totals ────────────────────────────────────────────
    const totalAccounts     = db.prepare(`SELECT COUNT(*) AS n FROM accounts`).get().n;
    const totalOpportunities = db.prepare(`SELECT COUNT(*) AS n FROM opportunities WHERE stage NOT IN ('Closed Won','Closed Lost')`).get().n;
    const pipelineValue     = db.prepare(`SELECT COALESCE(SUM(value * probability / 100), 0) AS v FROM opportunities WHERE stage NOT IN ('Closed Won','Closed Lost')`).get().v;

    // ── Monthly revenue (Closed Won this month) ───────────
    const monthlyRevenue = db.prepare(
      `SELECT COALESCE(SUM(value), 0) AS v FROM opportunities
       WHERE stage = 'Closed Won'
       AND strftime('%Y-%m', actual_close_date) = strftime('%Y-%m', 'now')`
    ).get().v;

    // ── Tasks ─────────────────────────────────────────────
    const openTasks = db.prepare(
      `SELECT COUNT(*) AS n FROM tasks WHERE status NOT IN ('Completed','Cancelled')`
    ).get().n;
    const overdueTasks = db.prepare(
      `SELECT COUNT(*) AS n FROM tasks
       WHERE status NOT IN ('Completed','Cancelled')
       AND due_date < date('now')`
    ).get().n;

    // ── Stage distribution ────────────────────────────────
    const stageDistribution = db.prepare(
      `SELECT stage, COUNT(*) AS count, COALESCE(SUM(value), 0) AS total_value
       FROM opportunities
       GROUP BY stage
       ORDER BY CASE stage
         WHEN 'Discovery' THEN 1 WHEN 'Qualification' THEN 2 WHEN 'Proposal' THEN 3
         WHEN 'Negotiation' THEN 4 WHEN 'Closed Won' THEN 5 WHEN 'Closed Lost' THEN 6
       END`
    ).all();

    // ── Recent activities ─────────────────────────────────
    const recentActivities = db.prepare(
      `SELECT a.*, ac.company_name AS account_name
       FROM activities a LEFT JOIN accounts ac ON a.account_id = ac.id
       ORDER BY a.date DESC, a.created_at DESC
       LIMIT 10`
    ).all();

    // ── Top opportunities ─────────────────────────────────
    const topOpportunities = db.prepare(
      `SELECT o.*, a.company_name AS account_name
       FROM opportunities o LEFT JOIN accounts a ON o.account_id = a.id
       WHERE o.stage NOT IN ('Closed Won','Closed Lost')
       ORDER BY o.value DESC
       LIMIT 10`
    ).all();

    res.json({
      success: true,
      data: {
        total_accounts: totalAccounts,
        total_opportunities: totalOpportunities,
        pipeline_value: Math.round(pipelineValue * 100) / 100,
        monthly_revenue: Math.round(monthlyRevenue * 100) / 100,
        open_tasks: openTasks,
        overdue_tasks: overdueTasks,
        stage_distribution: stageDistribution,
        recent_activities: recentActivities,
        top_opportunities: topOpportunities,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
