// =============================================================================
// CultivaNode Farm Intelligence: Frontend Controller
// =============================================================================

let currentLanguage = 'en';

const DICTIONARY = {
  en: {
    today_actions: "TODAY'S FARM ACTIONS",
    all_optimal_title: "All Field Conditions Within Target",
    all_optimal_desc: "Root zone moisture, temperature, and water storage are optimal. No manual irrigation or spray interventions needed today.",
    plot_health_heading: "Plot Soil & Microclimate Health",
    acknowledge: "Acknowledge",
    working: "Working",
    degraded: "Needs Attention",
    offline: "Offline",
    optimal: "Optimal Moisture",
    stress: "Moisture Deficit"
  },
  yo: {
    today_actions: "ÀWỌN IṢẸ́ OKO LÓNÌÍ",
    all_optimal_title: "Gbogbo Nnkan Wà Létò Lórí Oko",
    all_optimal_desc: "Ọrinrin ilẹ̀, ooru afẹ́fẹ́ àti omi inú kànga wà ní ipò tí ó dára. Kò sí ìdí fún irigeson tàbí fífún oògùn lónìí.",
    plot_health_heading: "Ipò Ilẹ̀ Oko àti Afẹ́fẹ́",
    acknowledge: "Mo ti gbọ́",
    working: "Ń ṣiṣẹ́ dáradára",
    degraded: "Nílò àtúnṣe",
    offline: "Kò sí lórí afẹ́fẹ́",
    optimal: "Ọrinrin tó tọ́",
    stress: "Ilẹ̀ ti gbẹ"
  }
};

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  fetchFarmerSummary();
  fetchAdminFleet();

  // Background refresh every 10 seconds
  setInterval(() => {
    fetchFarmerSummary();
    fetchAdminFleet();
  }, 10000);
});

function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `view-${tab.dataset.tab}`;
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add('active');
      }

      if (tab.dataset.tab === 'admin') fetchAdminFleet();
      if (tab.dataset.tab === 'farmer') fetchFarmerSummary();
    });
  });
}

function setLanguage(lang) {
  currentLanguage = lang;
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('lang-yo').classList.toggle('active', lang === 'yo');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (DICTIONARY[lang] && DICTIONARY[lang][key]) {
      el.textContent = DICTIONARY[lang][key];
    }
  });

  fetchFarmerSummary();
}

/**
 * Fetch and render Farmer view
 */
async function fetchFarmerSummary() {
  try {
    const res = await fetch('/api/farmer/summary');
    if (!res.ok) return;
    const data = await res.json();

    // 1. Render Alerts / Today Card
    const alertsContainer = document.getElementById('farmer-alerts-list');
    if (data.alerts && data.alerts.length > 0) {
      alertsContainer.innerHTML = data.alerts.map(alert => `
        <div class="alert-item-box ${alert.severity}">
          <div class="alert-icon-wrap">
            ${alert.severity === 'critical' ? '🚨' : '⚠️'}
          </div>
          <div class="alert-content-body">
            <div class="alert-title-row">
              <h4 class="alert-item-title">${escapeHtml(alert.observation)}</h4>
            </div>
            <div class="alert-suggested-action">
              👉 <strong>Action:</strong> ${escapeHtml(alert.suggestedAction)}
            </div>
            <div class="alert-meta-row">
              <span class="trust-chip ${alert.source === 'sensor reading' ? 'sensor' : 'watchdog'}">
                ${alert.source === 'sensor reading' ? '📡 Sensor reading' : '⏱️ ' + alert.source}
              </span>
              <span>Confidence: ${(alert.confidence * 100).toFixed(0)}%</span>
              <span>Triggered: ${new Date(alert.triggeredAt).toLocaleTimeString()}</span>
            </div>
          </div>
          <button class="ack-btn" onclick="acknowledgeAlert('${alert.id}')">
            ${DICTIONARY[currentLanguage].acknowledge}
          </button>
        </div>
      `).join('');
    } else {
      alertsContainer.innerHTML = `
        <div class="empty-alert-state">
          <span class="check-icon">✅</span>
          <div>
            <h4>${DICTIONARY[currentLanguage].all_optimal_title}</h4>
            <p>${DICTIONARY[currentLanguage].all_optimal_desc}</p>
          </div>
        </div>
      `;
    }

    // 2. Render Plots Grid
    const plotsContainer = document.getElementById('farmer-plots-grid');
    if (data.plots && data.plots.length > 0) {
      plotsContainer.innerHTML = data.plots.map(p => {
        const isOptimal = p.currentMoisturePct >= p.targetMoistureMin;
        const fillWidth = Math.min(100, Math.max(5, (p.currentMoisturePct / 45) * 100));

        return `
          <div class="plot-card">
            <div class="plot-header">
              <div>
                <h3 class="plot-name">${escapeHtml(p.name)}</h3>
                <div class="plot-stage">${escapeHtml(p.stage)} · ${p.areaHa} ha</div>
              </div>
              <span class="plot-status-pill ${isOptimal ? 'optimal' : 'stress'}">
                ${isOptimal ? DICTIONARY[currentLanguage].optimal : DICTIONARY[currentLanguage].stress}
              </span>
            </div>

            <div class="moisture-readout-box">
              <div class="readout-top-row">
                <span class="readout-val">${p.currentMoisturePct}<span class="unit">% VWC</span></span>
                <span class="target-band-label">Target: ${p.targetMoistureMin}% – ${p.targetMoistureMax}%</span>
              </div>
              <div class="moisture-bar-track">
                <div class="moisture-bar-fill ${isOptimal ? '' : 'stress'}" style="width: ${fillWidth}%;"></div>
              </div>
              <small class="field-hint">FDR probe installed at ${p.probeDepthCm} cm active crop root depth</small>
            </div>

            <div class="microclimate-metrics">
              <div class="micro-col">
                <div class="micro-lbl">Canopy Temperature</div>
                <div class="micro-val">${p.temperatureC}°C</div>
              </div>
              <div class="micro-col">
                <div class="micro-lbl">Relative Humidity</div>
                <div class="micro-val">${p.humidityPct}%</div>
              </div>
            </div>

            <div class="plot-device-bar">
              <span class="device-health-state ${p.device.status}">
                ● ${p.device.status === 'active' ? DICTIONARY[currentLanguage].working : p.device.status === 'degraded' ? DICTIONARY[currentLanguage].degraded : DICTIONARY[currentLanguage].offline}
              </span>
              <span>🔋 ${p.device.batteryPct ?? 90}%</span>
              <span>Node: ${p.device.serial}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. Render Tank Level
    if (data.infrastructure) {
      const tank = data.infrastructure;
      const fillBar = document.getElementById('tank-fill-bar');
      const levelVal = document.getElementById('tank-level-val');
      const statusBadge = document.getElementById('tank-status-badge');

      if (fillBar && levelVal) {
        fillBar.style.height = `${tank.tankLevelPct}%`;
        levelVal.textContent = `${tank.tankLevelPct}%`;

        if (tank.tankLevelPct < 25) {
          fillBar.style.background = 'linear-gradient(to top, #dc2626, #f87171)';
          statusBadge.className = 'tank-status-badge alert-red';
          statusBadge.textContent = 'Low Reservoir Level';
        } else {
          fillBar.style.background = 'linear-gradient(to top, #0284c7, #38bdf8)';
          statusBadge.className = 'tank-status-badge';
          statusBadge.textContent = 'Ready for Irrigation';
        }
      }
    }

    // 4. Render Weather Comparison
    if (data.weatherComparison) {
      const comp = data.weatherComparison;
      document.getElementById('comp-forecast-temp').textContent =
        `${comp.weatherForecast.temperatureC}°C · ${comp.weatherForecast.rainfallMm} mm Rain`;
      document.getElementById('comp-sensor-temp').textContent =
        `${comp.sensorPlotTruth.temperatureC}°C · ${comp.sensorPlotTruth.rainfallMm} mm Rain`;
      document.getElementById('comp-recommendation-text').textContent =
        comp.trustRecommendation;
    }

    // Render chart bars
    renderMockTrendChart();
  } catch (err) {
    console.error('Error fetching farmer summary:', err);
  }
}

function renderMockTrendChart() {
  const container = document.getElementById('history-chart-bars');
  if (!container || container.children.length > 0) return;

  const sampleValues = [24.8, 25.4, 26.1, 25.0, 24.2, 23.9, 24.5];
  container.innerHTML = sampleValues.map(v => {
    const h = (v / 35) * 100;
    return `
      <div class="chart-bar-col">
        <span class="bar-val-label">${v}%</span>
        <div class="bar-pill" style="height: ${h}%;"></div>
      </div>
    `;
  }).join('');
}

function toggleHistoryView() {
  const content = document.getElementById('history-content');
  const btn = document.getElementById('btn-toggle-history');
  if (content.style.display === 'none') {
    content.style.display = 'block';
    btn.textContent = 'Hide Graph ▴';
  } else {
    content.style.display = 'none';
    btn.textContent = 'Show Graph ▾';
  }
}

/**
 * Field Agent Live Ping Test
 */
async function runPingTest() {
  const serial = document.getElementById('inst-serial').value.trim();
  const terminal = document.getElementById('ping-terminal');

  terminal.innerHTML += `<div class="terminal-line"><span class="prompt">$</span> pinging node ${escapeHtml(serial)}...</div>`;

  try {
    const res = await fetch(`/api/installer/ping-test/${encodeURIComponent(serial)}`);
    const data = await res.json();

    if (data.success) {
      terminal.innerHTML += `
        <div class="terminal-line" style="color: #4ade80;">[OK] Echo received from ${data.serialNumber} (RSSI: ${data.signalRssi} dBm, SNR: ${data.signalSnr} dB)</div>
        <div class="terminal-line text-muted">Battery: ${data.batteryPct}% · Power Source: Solar+LiFePO4 · Status: ${data.status}</div>
      `;
      document.getElementById('ping-rssi').textContent = `${data.signalRssi} dBm`;
      document.getElementById('ping-quality').textContent = data.connectionQuality;
      document.getElementById('ping-battery').textContent = `${data.batteryPct}%`;
      document.getElementById('ping-state').textContent = data.status.toUpperCase();
    } else {
      terminal.innerHTML += `<div class="terminal-line" style="color: #f87171;">[FAIL] ${data.message}</div>`;
    }
  } catch (err) {
    terminal.innerHTML += `<div class="terminal-line" style="color: #f87171;">[ERROR] Failed to contact node: ${err.message}</div>`;
  }

  terminal.scrollTop = terminal.scrollHeight;
}

/**
 * Handle installer provisioning form submit
 */
async function handleInstallerSubmit(event) {
  event.preventDefault();
  const serialNumber = document.getElementById('inst-serial').value.trim();
  const farmId = document.getElementById('inst-farm').value;
  const plotId = document.getElementById('inst-plot').value;
  const sensorDepthCm = document.getElementById('inst-depth').value;
  const soilTexture = document.getElementById('inst-soil').value;

  try {
    const res = await fetch('/api/installer/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serialNumber,
        farmId,
        plotId,
        sensorDepthCm,
        soilTexture,
        siteSurvey: {
          surveyVerified: true,
          offlineSynced: true
        }
      })
    });

    const data = await res.json();
    if (data.success) {
      alert(`Success! Node ${serialNumber} commissioned and assigned to ${plotId}.`);
      fetchAdminFleet();
      fetchFarmerSummary();
    } else {
      alert(`Provisioning failed: ${data.message}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

/**
 * Fetch Admin Fleet data
 */
async function fetchAdminFleet() {
  try {
    const res = await fetch('/api/admin/fleet');
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('admin-total-nodes').textContent = data.summary.totalDevices;
    document.getElementById('admin-active-nodes').textContent = data.summary.activeCount;
    document.getElementById('admin-degraded-nodes').textContent = data.summary.degradedCount;
    document.getElementById('admin-offline-nodes').textContent = data.summary.offlineCount;

    const tbody = document.getElementById('admin-devices-tbody');
    tbody.innerHTML = data.devices.map(d => `
      <tr>
        <td><strong>${d.serialNumber}</strong></td>
        <td>${d.modelId.includes('soil') ? 'Soil Pro (LoRaWAN)' : 'Water Node (Cellular)'}</td>
        <td>${d.installation ? d.installation.plotId + ' (' + d.installation.depthCm + 'cm)' : '<span class="text-muted">Unassigned</span>'}</td>
        <td><span class="status-badge ${d.status}">${d.status}</span></td>
        <td>${d.batteryLevelPct ?? 90}%</td>
        <td>${d.signalRssi ?? -75} dBm</td>
        <td>${d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleTimeString() : 'Never'}</td>
        <td>
          <button class="secondary-btn btn-sm" onclick="pingDeviceFromAdmin('${d.serialNumber}')">Ping</button>
        </td>
      </tr>
    `).join('');

    // Update pipeline stats
    const metricsRes = await fetch('/api/v1/metrics');
    if (metricsRes.ok) {
      const mData = await metricsRes.json();
      document.getElementById('stat-total-packets').textContent = mData.metrics.totalPacketsReceived;
      document.getElementById('stat-accepted-packets').textContent = mData.metrics.acceptedPacketsCount;
      document.getElementById('stat-duplicate-packets').textContent = mData.metrics.duplicatesCount;
      document.getElementById('stat-rejected-packets').textContent = mData.metrics.rejectedPacketsCount;
    }
  } catch (err) {
    console.error('Error fetching admin fleet:', err);
  }
}

async function triggerWatchdogRun() {
  const resultLabel = document.getElementById('watchdog-run-result');
  resultLabel.textContent = 'Running scan...';

  try {
    const res = await fetch('/api/v1/watchdog/run?thresholdHours=12', { method: 'POST' });
    const data = await res.json();
    resultLabel.textContent = `Scanned: ${data.silentCount} silent node(s) flagged offline.`;
    fetchAdminFleet();
    fetchFarmerSummary();
  } catch (err) {
    resultLabel.textContent = `Error: ${err.message}`;
  }
}

/**
 * Simulator controls
 */
async function sendSimulatorAction(action, targetDevice, param) {
  addSimLog(`[CMD] Triggering simulator action: ${action} on ${targetDevice}...`, 'system');

  try {
    const res = await fetch('/api/simulator/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, targetDevice, param })
    });

    const data = await res.json();

    if (data.result && data.result.success) {
      addSimLog(`[SUCCESS] Ingested packet seq #${data.result.readings?.[0]?.sequenceNumber || 'N/A'}. Quality: ${data.result.readings?.[0]?.qualityFlag || 'valid'}`, 'success');
    } else if (data.result && !data.result.success) {
      addSimLog(`[FILTERED] Code: ${data.result.code} - ${data.result.message}`, 'error');
    } else {
      addSimLog(`[RESPONSE] ${JSON.stringify(data)}`, 'warn');
    }

    // Refresh views immediately
    fetchFarmerSummary();
    fetchAdminFleet();
  } catch (err) {
    addSimLog(`[ERROR] ${err.message}`, 'error');
  }
}

async function acknowledgeAlert(alertId) {
  try {
    await fetch('/api/simulator/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'acknowledge_alert', param: alertId })
    });
    fetchFarmerSummary();
  } catch (err) {
    console.error('Error acknowledging alert:', err);
  }
}

function addSimLog(text, level = 'system') {
  const terminal = document.getElementById('sim-log-terminal');
  if (!terminal) return;
  const time = new Date().toLocaleTimeString();
  terminal.innerHTML += `<div class="log-entry ${level}">[${time}] ${escapeHtml(text)}</div>`;
  terminal.scrollTop = terminal.scrollHeight;
}

function clearSimLogs() {
  const terminal = document.getElementById('sim-log-terminal');
  if (terminal) terminal.innerHTML = '<div class="log-entry system">[SYSTEM] Log cleared.</div>';
}

function pingDeviceFromAdmin(serial) {
  document.getElementById('inst-serial').value = serial;
  document.querySelector('[data-tab="installer"]').click();
  runPingTest();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
