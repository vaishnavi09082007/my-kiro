/* ============================================================
   TaskFlow – dashboard.js
   Analytics calculations + Chart.js chart rendering
   All stats computed from real task data — no hardcoded values
   ============================================================ */

'use strict';

let _weeklyChart   = null;
let _categoryChart = null;
let _chartOfflineWarned = false; // only warn once per session

/**
 * Updates all dashboard stat cards from live task data.
 * @param {object} stats - result of TFTasks.calcStats()
 */
const updateStatCards = (stats) => {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('stat-total',     stats.total);
  set('stat-completed', stats.completed);
  set('stat-pending',   stats.pending);
  set('stat-overdue',   stats.overdue);
  set('stat-high',      stats.highPri);
  set('stat-today',     stats.today);
  set('stat-pct',       `${stats.percentage}%`);

  // Progress bar
  window.TFUI.updateProgressBar('progress-fill', 'progress-pct', stats.percentage);

  // Colour progress bar green when at 100%
  const fill = document.getElementById('progress-fill');
  if (fill) {
    fill.classList.toggle('progress-bar__fill--success', stats.percentage === 100);
    fill.setAttribute('aria-valuenow', stats.percentage);
  }

  // Overdue badge in sidebar nav
  const badge = document.getElementById('overdue-badge');
  if (badge) {
    badge.textContent = stats.overdue;
    badge.style.display  = stats.overdue > 0 ? 'inline-block' : 'none';
    badge.classList.toggle('hidden', stats.overdue === 0);
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
  const remindersEl = document.getElementById('dash-reminders-list');

  if (todayEl)    window.TFUI.renderCompactList(todayEl,    stats.todayList,   'No tasks due today 🎉');
  if (upcomingEl) window.TFUI.renderCompactList(upcomingEl, stats.upcomingList, 'No upcoming tasks in the next 7 days');
  if (overdueEl)  window.TFUI.renderCompactList(overdueEl,  stats.overdueList,  stats.overdueList.length === 0 ? 'All caught up! No overdue tasks 🎉' : '');

  // Reminders: tasks due within 24 hours that are not completed
  if (remindersEl) {
    const tasks = window.TFStorage.getTasks();
    const now   = Date.now();
    const in24h = now + 24 * 3600 * 1000;
    const reminders = tasks.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const d = window.TFUtils.parseDateTime(t.dueDate, t.dueTime);
      return d && d.getTime() > now && d.getTime() <= in24h;
    }).sort((a, b) => {
      const da = window.TFUtils.parseDateTime(a.dueDate, a.dueTime);
      const db = window.TFUtils.parseDateTime(b.dueDate, b.dueTime);
      return da - db;
    });
    window.TFUI.renderCompactList(remindersEl, reminders, 'No tasks due in the next 24 hours ✓');
  }
};

/**
 * Computes Mon–Sun task counts for the current week.
 * @param {object[]} tasks
 * @returns {{ labels: string[], created: number[], completed: number[], pending: number[] }}
 */
const weeklyChartData = (tasks) => {
  const { getWeekDays, dateToString } = window.TFUtils;
  const days    = getWeekDays(new Date()); // Mon first
  const labels  = days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' }));
  const created   = new Array(7).fill(0);
  const completed = new Array(7).fill(0);

  days.forEach((day, i) => {
    const ds = dateToString(day);
    tasks.forEach(t => {
      // Count tasks created on this day
      if (t.createdAt && t.createdAt.slice(0, 10) === ds) created[i]++;
      // Count tasks completed on this day
      if (t.completedAt && t.completedAt.slice(0, 10) === ds) completed[i]++;
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
    const cat = (t.category && t.category.trim()) || 'Uncategorised';
    map[cat] = (map[cat] || 0) + 1;
  });

  // Sort by count desc, cap at 8 slices
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
 * Returns Chart.js scale/legend styles adapted to current theme.
 * @returns {object}
 */
const getChartTheme = () => {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    tickColor:  isDark ? '#9ca3af' : '#4b5563',
    gridColor:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    legendColor: isDark ? '#9ca3af' : '#4b5563',
  };
};

/**
 * Checks Chart.js availability; shows friendly fallback once if offline.
 * @param {HTMLCanvasElement} canvas
 * @returns {boolean}
 */
const ensureChartJs = (canvas) => {
  if (typeof Chart !== 'undefined') return true;
  if (!_chartOfflineWarned) {
    _chartOfflineWarned = true;
    const msg = document.createElement('p');
    msg.style.cssText = 'color:var(--color-text-muted);font-size:var(--font-size-sm);text-align:center;padding:var(--space-4) 0';
    msg.textContent = 'Charts require an internet connection to load Chart.js.';
    canvas.parentElement.appendChild(msg);
  }
  canvas.style.display = 'none';
  return false;
};

/**
 * Renders or updates the weekly activity bar chart.
 * @param {object[]} tasks
 */
const renderWeeklyChart = (tasks) => {
  const canvas = document.getElementById('weekly-chart');
  if (!canvas) return;
  if (!ensureChartJs(canvas)) return;

  const { labels, created, completed } = weeklyChartData(tasks);
  const theme = getChartTheme();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Created',
        data: created,
        backgroundColor: 'rgba(99,102,241,0.75)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Completed',
        data: completed,
        backgroundColor: 'rgba(34,197,94,0.75)',
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
        labels: { color: theme.legendColor, font: { family: 'Inter, sans-serif', size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} task${ctx.parsed.y !== 1 ? 's' : ''}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: theme.tickColor, font: { size: 12 } },
        grid:  { color: theme.gridColor },
      },
      y: {
        ticks: { color: theme.tickColor, stepSize: 1, precision: 0 },
        grid:  { color: theme.gridColor },
        beginAtZero: true,
        min: 0,
      },
    },
  };

  if (_weeklyChart) {
    _weeklyChart.data    = chartData;
    _weeklyChart.options = options;
    _weeklyChart.update('none'); // 'none' = skip animation on update for snappier feel
  } else {
    canvas.style.display = '';
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
  if (!ensureChartJs(canvas)) return;

  const { labels, counts } = categoryChartData(tasks);
  const theme = getChartTheme();

  if (labels.length === 0) {
    if (_categoryChart) { _categoryChart.destroy(); _categoryChart = null; }
    canvas.style.display = 'none';
    // Show placeholder only once
    if (!canvas.parentElement.querySelector('.chart-empty-msg')) {
      const msg = document.createElement('p');
      msg.className = 'chart-empty-msg';
      msg.style.cssText = 'color:var(--color-text-muted);font-size:var(--font-size-sm);text-align:center;padding:var(--space-4) 0';
      msg.textContent = 'Add tasks with categories to see this chart.';
      canvas.parentElement.appendChild(msg);
    }
    return;
  }

  // Remove empty message if tasks now exist
  canvas.parentElement.querySelector('.chart-empty-msg')?.remove();
  canvas.style.display = '';

  const chartData = {
    labels,
    datasets: [{
      data:            counts,
      backgroundColor: CHART_COLORS,
      borderColor:     'rgba(0,0,0,0.15)',
      borderWidth:     1,
      hoverOffset:     6,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color:    theme.legendColor,
          font:     { family: 'Inter, sans-serif', size: 11 },
          padding:  12,
          boxWidth: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
            const pct   = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  if (_categoryChart) {
    _categoryChart.data    = chartData;
    _categoryChart.options = options;
    _categoryChart.update('none');
  } else {
    _categoryChart = new Chart(canvas, { type: 'doughnut', data: chartData, options });
  }
};

/**
 * Destroys existing charts (call before theme change to re-render with new colours).
 */
const destroyCharts = () => {
  if (_weeklyChart)   { _weeklyChart.destroy();   _weeklyChart   = null; }
  if (_categoryChart) { _categoryChart.destroy(); _categoryChart = null; }
};

/**
 * Full dashboard refresh — call whenever tasks change or theme switches.
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
  destroyCharts,
  weeklyChartData,
  categoryChartData,
};
