/*
  =========================================
  SMART PARKING SYSTEM - CHARTS
  =========================================
*/

let dashboardPieChart = null;
let dashboardBarChart = null;
let statsPieChart = null;
let statsBarChart = null;
let statsLineChart = null;

// Helper to get text/border colors based on current theme
function getThemeChartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor: isDark ? '#94A3B8' : '#475569',
    gridColor: isDark ? '#222F4C' : '#E2E8F0'
  };
}

// Initialise Dashboard Charts
function initDashboardCharts() {
  const pieCtx = document.getElementById('dashboardPieChart');
  const barCtx = document.getElementById('dashboardBarChart');
  const colors = getThemeChartColors();

  if (pieCtx) {
    const stats = getParkingStats();
    dashboardPieChart = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: ['Occupied', 'Available'],
        datasets: [{
          data: [stats.occupied, stats.available],
          backgroundColor: ['#EF4444', '#10B981'],
          borderWidth: 2,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.textColor,
              font: { family: 'Inter', weight: '500' }
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  if (barCtx) {
    dashboardBarChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'],
        datasets: [{
          label: 'Occupied Slots',
          data: [1, 3, 2, 4, 2, 1], // Simulated historical hourly data
          backgroundColor: '#2563EB',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 4,
            ticks: {
              stepSize: 1,
              color: colors.textColor
            },
            grid: { color: colors.gridColor }
          },
          x: {
            ticks: { color: colors.textColor },
            grid: { display: false }
          }
        }
      }
    });
  }
}

// Update Dashboard Charts with New Live Data
function updateDashboardChartsData() {
  if (dashboardPieChart) {
    const stats = getParkingStats();
    dashboardPieChart.data.datasets[0].data = [stats.occupied, stats.available];
    dashboardPieChart.data.datasets[0].borderColor = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#FFFFFF';
    dashboardPieChart.update();
  }
  
  // Optionally update bar chart with a small shift for realism
  if (dashboardBarChart) {
    const stats = getParkingStats();
    const currentHour = new Date().getHours();
    let index = 5; // default to 6:00 PM
    
    if (currentHour < 10) index = 0;
    else if (currentHour < 12) index = 1;
    else if (currentHour < 14) index = 2;
    else if (currentHour < 16) index = 3;
    else if (currentHour < 18) index = 4;
    
    dashboardBarChart.data.datasets[0].data[index] = stats.occupied;
    dashboardBarChart.update();
  }
}

// Initialise Statistics Page Charts
function initStatsCharts() {
  const pieCtx = document.getElementById('statsPieChart');
  const barCtx = document.getElementById('statsBarChart');
  const lineCtx = document.getElementById('statsLineChart');
  const colors = getThemeChartColors();

  if (pieCtx) {
    const stats = getParkingStats();
    statsPieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ['Occupied Slots', 'Available Slots'],
        datasets: [{
          data: [stats.occupied, stats.available],
          backgroundColor: ['#EF4444', '#10B981'],
          borderWidth: 2,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.textColor }
          }
        }
      }
    });
  }

  if (barCtx) {
    statsBarChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Total Vehicle Entries',
          data: [35, 42, 38, 45, 52, 24, 18], // Simulated daily usage
          backgroundColor: '#10B981',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: colors.textColor },
            grid: { color: colors.gridColor }
          },
          x: {
            ticks: { color: colors.textColor },
            grid: { display: false }
          }
        }
      }
    });
  }

  if (lineCtx) {
    statsLineChart = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Average Occupancy %',
          data: [42, 48, 55, 50],
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#2563EB'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: colors.textColor,
              callback: value => value + '%'
            },
            grid: { color: colors.gridColor }
          },
          x: {
            ticks: { color: colors.textColor },
            grid: { display: false }
          }
        }
      }
    });
  }
}

// Redraw charts on dynamic telemetry changes
window.addEventListener('parkingDataChanged', () => {
  updateDashboardChartsData();
  
  if (statsPieChart) {
    const stats = getParkingStats();
    statsPieChart.data.datasets[0].data = [stats.occupied, stats.available];
    statsPieChart.data.datasets[0].borderColor = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#FFFFFF';
    statsPieChart.update();
  }
});

// Update grid and label colors on manual theme change
window.addEventListener('themeChanged', () => {
  const colors = getThemeChartColors();
  const updateScales = (chart) => {
    if (!chart) return;
    if (chart.options.scales) {
      if (chart.options.scales.x && chart.options.scales.x.ticks) {
        chart.options.scales.x.ticks.color = colors.textColor;
      }
      if (chart.options.scales.y && chart.options.scales.y.ticks) {
        chart.options.scales.y.ticks.color = colors.textColor;
        if (chart.options.scales.y.grid) {
          chart.options.scales.y.grid.color = colors.gridColor;
        }
      }
    }
    if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
      chart.options.plugins.legend.labels.color = colors.textColor;
    }
    chart.update();
  };

  updateScales(dashboardPieChart);
  updateScales(dashboardBarChart);
  updateScales(statsPieChart);
  updateScales(statsBarChart);
  updateScales(statsLineChart);
});

// Auto detect page structure and load appropriate charts
document.addEventListener('DOMContentLoaded', () => {
  initDashboardCharts();
  initStatsCharts();
  
  // Custom observer to trigger theme change event in case of manual toggle click
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      // Small timeout to allow CSS custom properties to update
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('themeChanged'));
      }, 50);
    });
  }
});
