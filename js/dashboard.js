/* ============================================================
   TaskFlow – dashboard.js
   Analytics calculations + Chart.js chart rendering
   All stats computed from real task data — no hardcoded values
   ============================================================ */

'use strict';

let _weeklyChart   = null;
let _categoryChart = null;

/**
 * Updates all dashboard stat cards from live task data.
 * @param {object} stats - result of TFTasks.calcStats()
 */
const updateStatCards = (stats) => {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('stat-total',      stats.total);
  set('stat-completed',  stats.completed);
  set('stat-pending',    stats.pending);
  set('stat-overdue',    stats.overdue);
  set('stat-high',       stats.highPri);
  set('stat-today',      stats.today);
  set('stat-pct',        `${stats.percentage}%`);

  // Progress bar
  window.TFUI.updateProgressBar('progress-fill', 'progress-pct', stats.percentage);

  // Nav badge for overdue
  const badge = document.getElementById('overdue-badge');
  if (badge) {
    badge.textContent = stats.overdue;
    badge.style.display = stats.overdue > 0 ? 'inline-block' : 'none';
  }
};

/**
 * Renders the compact task lists on the dashboard.
 * @param {object} stats
 */
const updateDashboardLists = (stats) => {
  const todayEl    = document.getElementById('dash-today-list');
  const upcomingEl = document.getElementById('dash-upcoming-list');
  const overdueEl  = document.getElementById('dash-overdue-list');

  if (todayEl)    window.TFUI.renderCompactList(todayEl,    stats.todayList,   'No tasks due today');
  if (upcomingEl) window.TFUI.renderCompactList(upcomingEl, stats.upcomingList, 'No upcoming tasks');
  if (overdueEl)  window.TFUI.renderCompactList(overdueEl,  stats.overdueList,  'No overdue tasks');
};

/**
 * Computes task counts per weekday for the current week.
 * @param {object[]} tasks
 * @returns {{ labels: string[], created: number[], completed: number[] }}
 */
const weeklyChartData = (tasks) => {
  const { getWeekDays, dateToString } = window.TFUtils;
  const days    = getWeekDays(new Date());
  const labels  = days.map(d => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][days.indexOf(d)]);
  const created   = new Array(7).fill(0);
  const completed = new Array(7).fill(0);

  days.forEach((day, i) => {
    const ds = dateToString(day);
    tasks.forEach(t => {
      if (t.createdAt && t.createdAt.startsWith(ds))   created[i]++;
      if (t.completedAt && t.completedAt.startsWith(ds)) completed[i]++;
    });
  });

  return { labels, created, completed };
};

/**
 * Computes task distribution by category.
 * @param {object[]} tasks
 * @returns {{ labels: string[], counts: number[] }}
 */
const categoryChartData = (tasks) => {
  const map = {};
  tasks.forEach(t => {
    const cat = t.category || 'Uncategorised';
    map[cat] = (map[cat] || 0) + 1;
  });

  // Sort by count desc, take top 8
  const sorted = Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  return {
    labels: sorted.map(([k]) => k),
    counts: sorted.map(([, v]) => v),
  };
};

const CHART_COLORS = [
  '#6366f1','#22c55e','#f59e0b','#ef4444',
  '#3b82f6','#a855f7','#ec4899','#14b8a6',
];

/**
 * Renders or updates the weekly bar chart.
 * @param {object[]} tasks
 */
const renderWeeklyChart = (tasks) => {
  const canvas = document.getElementById('weekly-chart');
  if (!canvas) return;

  // Chart.js may not be loaded (no network) — degrade gracefully
  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML += `<p style="color:var(--color-text-muted);font-size:var(--font-size-sm);text-align:center;padding:var(--space-4) 0">Chart.js unavailable (offline)</p>`;
    canvas.style.display = 'none';
    return;
  }

  const { labels, created, completed } = weeklyChartData(tasks);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Created',
        data: created,
        backgroundColor: 'rgba(99,102,241,0.7)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Completed',
        data: completed,
        backgroundColor: 'rgba(34,197,94,0.7)',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: { color: '#9ca3af', font: { family: 'Inter, sans-serif', size: 12 } },
      },
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af' },
        grid:  { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: { color: '#9ca3af', stepSize: 1 },
        grid:  { color: 'rgba(255,255,255,0.05)' },
        beginAtZero: true,
      },
    },
  };

  if (_weeklyChart) {
    _weeklyChart.data = chartData;
    _weeklyChart.update();
  } else {
    _weeklyChart = new Chart(canvas, { type: 'bar', data: chartData, options });
  }
};

/**
 * Renders or updates the category doughnut chart.
 * @param {object[]} tasks
 */
const renderCategoryChart = (tasks) => {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    canvas.style.display = 'none';
    return;
  }

  const { labels, counts } = categoryChartData(tasks);

  if (labels.length === 0) {
    if (_categoryChart) { _categoryChart.destroy(); _categoryChart = null; }
    canvas.parentElement.innerHTML += `<p style="color:var(--color-text-muted);font-size:var(--font-size-sm);text-align:center;padding:var(--space-4) 0">No category data yet</p>`;
    canvas.style.display = 'none';
    return;
  }

  const chartData = {
    labels,
    datasets: [{
      data: counts,
      backgroundColor: CHART_COLORS,
      borderColor: 'rgba(0,0,0,0.2)',
      borderWidth: 1,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#9ca3af', font: { family: 'Inter, sans-serif', size: 11 }, padding: 12, boxWidth: 12 },
      },
    },
  };

  if (_categoryChart) {
    _categoryChart.data = chartData;
    _categoryChart.update();
  } else {
    _categoryChart = new Chart(canvas, { type: 'doughnut', data: chartData, options });
  }
};

/**
 * Full dashboard refresh — call whenever tasks change.
 */
const refreshDashboard = () => {
  const tasks = window.TFStorage.getTasks();
  const stats = window.TFTasks.calcStats(tasks);

  updateStatCards(stats);
  updateDashboardLists(stats);
  renderWeeklyChart(tasks);
  renderCategoryChart(tasks);
};

window.TFDashboard = {
  refreshDashboard,
  updateStatCards,
  updateDashboardLists,
  renderWeeklyChart,
  renderCategoryChart,
  weeklyChartData,
  categoryChartData,
};
