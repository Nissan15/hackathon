let trendChart, donutChart, monthlyBarChart, yearlyBarChart, weeklyBarChart;
let humanCountChart, perPersonEmissionChart, emissionsComparisonChart;

function getDateRange(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

function updateDashboard() {
    const days = parseInt(document.getElementById('dateRange').value);
    const dateRange = getDateRange(days);
    
    fetch(`/api/dashboard?start_date=${dateRange.start}&end_date=${dateRange.end}`)
        .then(response => response.json())
        .then(data => {
            console.log('Dashboard data received:', data);
            updateKPIs(data.kpis);
            updateTrendChart(data.monthly_trend || []);
            updateMonthlyBarChart(data.monthly_trend || []);
            updateYearlyBarChart(data.yearly_comparison || []);
            updateWeeklyBarChart(data.weekly_comparison || []);
            updateDonutChart(data.source_breakdown || []);
            console.log('Human count data:', data.daily_human_count);
            console.log('Per-person emission data:', data.daily_per_person_emission);
            updateHumanCountChart(data.daily_human_count || []);
            updatePerPersonEmissionChart(data.daily_per_person_emission || []);
            updateEmissionsComparisonChart(data.emissions_comparison || {});
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
        });
}

function updateKPIs(kpis) {
    if (!kpis) return;

    const totalEl = document.getElementById('totalEmissions');
    const changeEl = document.getElementById('percentChange');
    const biggestSourceEl = document.getElementById('biggestSource');
    const biggestSourcePercentEl = document.getElementById('biggestSourcePercent');
    const energyEl = document.getElementById('energySaved');

    const totalEmissions = Number(kpis.total_emissions ?? 0);
    totalEl.textContent = totalEmissions.toFixed(2);

    const changeRaw = Number(kpis.percent_change ?? 0);
    const direction = changeRaw >= 0 ? '↑' : '↓';
    const changeFormatted = Math.abs(changeRaw).toFixed(1);
    changeEl.textContent = `${direction} ${changeFormatted}%`;
    changeEl.style.color = changeRaw > 0 ? '#ff4757' : (changeRaw < 0 ? '#00d4aa' : '#e4e6eb');

    const source = kpis.biggest_source || 'N/A';
    const formattedSource = source
        .toString()
        .replace('_', ' ')
        .replace(/^./, c => c.toUpperCase());
    biggestSourceEl.textContent = formattedSource;

    const biggestSourcePercent = Number(kpis.biggest_source_percent ?? 0).toFixed(1);
    biggestSourcePercentEl.textContent = `${biggestSourcePercent}% of total`;

    energyEl.textContent = Number(kpis.energy_saved ?? 0).toLocaleString();

    // New human count KPIs
    const totalHumansEl = document.getElementById('totalHumans');
    const avgPerPersonEl = document.getElementById('avgPerPersonEmission');
    const highestPerPersonDayEl = document.getElementById('highestPerPersonDay');
    const highestPerPersonValueEl = document.getElementById('highestPerPersonValue');

    if (totalHumansEl) {
        totalHumansEl.textContent = Number(kpis.total_humans ?? 0).toLocaleString();
    }

    if (avgPerPersonEl) {
        const avgPerPerson = Number(kpis.avg_per_person_emission ?? 0);
        avgPerPersonEl.textContent = avgPerPerson > 0 ? avgPerPerson.toFixed(4) : '--';
    }

    if (highestPerPersonDayEl && highestPerPersonValueEl) {
        const highestDay = kpis.highest_per_person_emission_day || 'N/A';
        const highestValue = Number(kpis.highest_per_person_emission_value ?? 0);
        highestPerPersonDayEl.textContent = highestDay;
        highestPerPersonValueEl.textContent = highestValue > 0 ? `${highestValue.toFixed(4)} tonnes/person` : '--';
    }
}

function updateTrendChart(monthlyData) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.map(d => d.month),
            datasets: [{
                label: 'Total Emissions (Tonnes CO₂e)',
                data: monthlyData.map(d => d.emissions),
                borderColor: '#00d4aa',
                backgroundColor: 'rgba(0, 212, 170, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: '#00d4aa'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e4e6eb'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: '#2d3748'
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: '#2d3748'
                    }
                }
            }
        }
    });
}

function updateDonutChart(sourceData) {
    const ctx = document.getElementById('donutChart').getContext('2d');
    
    if (donutChart) {
        donutChart.destroy();
    }
    
    const colors = ['#00d4aa', '#0099ff', '#ffa502', '#ff4757'];
    
    donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sourceData.map(d => d.source.charAt(0).toUpperCase() + d.source.slice(1).replace('_', ' ')),
            datasets: [{
                data: sourceData.map(d => d.emissions),
                backgroundColor: colors,
                borderColor: '#242b3d',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e4e6eb',
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value.toFixed(2)} tonnes (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateMonthlyBarChart(monthlyData) {
    const canvas = document.getElementById('monthlyBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (monthlyBarChart) {
        monthlyBarChart.destroy();
    }

    const labels = monthlyData.map(d => d.month);
    const values = monthlyData.map(d => d.emissions);

    monthlyBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Monthly Emissions (Tonnes CO₂e)',
                    data: values,
                    backgroundColor: 'rgba(0, 212, 170, 0.7)',
                    borderColor: '#00d4aa',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e4e6eb'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: '#2d3748'
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: '#2d3748'
                    }
                }
            }
        }
    });
}

function updateYearlyBarChart(yearlyData) {
    const canvas = document.getElementById('yearlyBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (yearlyBarChart) {
        yearlyBarChart.destroy();
    }

    const labels = yearlyData.map(d => d.year.toString());
    const values = yearlyData.map(d => d.emissions);

    yearlyBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Yearly Emissions (Tonnes CO₂e)',
                    data: values,
                    backgroundColor: 'rgba(0, 153, 255, 0.7)',
                    borderColor: '#0099ff',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e4e6eb'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: '#2d3748'
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: '#2d3748'
                    }
                }
            }
        }
    });
}

function updateWeeklyBarChart(weeklyData) {
    const canvas = document.getElementById('weeklyBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (weeklyBarChart) {
        weeklyBarChart.destroy();
    }

    const labels = weeklyData.map(d => d.label);
    const values = weeklyData.map(d => d.emissions);

    weeklyBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Weekly Emissions (Tonnes CO₂e)',
                    data: values,
                    backgroundColor: 'rgba(255, 165, 2, 0.7)',
                    borderColor: '#ffa502',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e4e6eb'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: '#2d3748'
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: '#2d3748'
                    }
                }
            }
        }
    });
}

function updateHumanCountChart(humanData) {
    const canvas = document.getElementById('humanCountChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (humanCountChart) {
        humanCountChart.destroy();
    }

    if (!humanData || humanData.length === 0) {
        console.log('No human count data available');
        return;
    }

    const labels = humanData.map(d => {
        try {
            const date = new Date(d.date);
            if (isNaN(date.getTime())) {
                return d.date; // Return raw date string if parsing fails
            }
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (e) {
            return d.date;
        }
    });
    const values = humanData.map(d => d.humans || 0);

    humanCountChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Human Count',
                data: values,
                backgroundColor: 'rgba(107, 70, 193, 0.7)',
                borderColor: '#6b46c1',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e4e6eb'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: '#2d3748'
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b3b8',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: '#2d3748'
                    }
                }
            }
        }
    });
}

function updatePerPersonEmissionChart(perPersonData) {
    const canvas = document.getElementById('perPersonEmissionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (perPersonEmissionChart) {
        perPersonEmissionChart.destroy();
    }

    if (!perPersonData || perPersonData.length === 0) {
        console.log('No per-person emission data available');
        return;
    }

    // Filter out null values for the chart
    const validData = perPersonData.filter(d => d.per_person_emission !== null && d.per_person_emission !== undefined);
    
    if (validData.length === 0) {
        console.log('No valid per-person emission data (all values are null)');
        return;
    }
    
    const labels = validData.map(d => {
        try {
            const date = new Date(d.date);
            if (isNaN(date.getTime())) {
                return d.date;
            }
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (e) {
            return d.date;
        }
    });
    const values = validData.map(d => d.per_person_emission);

    perPersonEmissionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Per-Person Emission (Tonnes CO₂e)',
                data: values,
                borderColor: '#e9d5ff',
                backgroundColor: 'rgba(233, 213, 255, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#e9d5ff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e4e6eb'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: '#2d3748'
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b3b8',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: '#2d3748'
                    }
                }
            }
        }
    });
}

function updateEmissionsComparisonChart(comparisonData) {
    const canvas = document.getElementById('emissionsComparisonChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (emissionsComparisonChart) {
        emissionsComparisonChart.destroy();
    }

    const operational = comparisonData.total_operational_emissions || 0;
    const humanResponsible = comparisonData.total_human_responsible_emissions || 0;

    emissionsComparisonChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Operational Emissions', 'Total Human-Responsible Emissions'],
            datasets: [{
                data: [operational, humanResponsible],
                backgroundColor: ['rgba(0, 212, 170, 0.7)', 'rgba(107, 70, 193, 0.7)'],
                borderColor: ['#00d4aa', '#6b46c1'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e4e6eb',
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value.toFixed(2)} tonnes (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function loadRecommendations() {
    fetch('/api/recommendations')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('recommendationsContainer');
            container.innerHTML = '';
            
            data.recommendations.forEach(rec => {
                const card = document.createElement('div');
                card.className = `recommendation-card priority-${rec.priority.toLowerCase()}`;
                card.innerHTML = `
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <span class="priority-badge priority-${rec.priority.toLowerCase()}">
                        ${rec.priority} Priority
                    </span>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error fetching recommendations:', error);
            document.getElementById('recommendationsContainer').innerHTML = 
                '<p class="loading">Error loading recommendations</p>';
        });
}

document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
    loadRecommendations();
});
