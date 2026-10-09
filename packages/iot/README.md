# CultivaNode Farm Intelligence — IoT Module

> **Connected Intelligence for Agriculture · Your Farm's Working Partner**  
> **Status:** Full Implementation (Telemetry Foundation, Secure Ingestion, Quality Checks, Crop Bridge, Watchdog, Pilot Experiences & Simulator)

---

## 🌾 Overview & Purpose

The **CultivaNode Farm Intelligence IoT Module** transforms raw microclimate and root-zone field conditions into simple, trustworthy, and actionable farm interventions:

- *“This plot is dry; inspect irrigation today.”*
- *“The tank is low; planned irrigation may not complete.”*
- *“This sensor has stopped reporting; crop advice from it is paused.”*
- *“High heat/humidity raises fungal-risk conditions. Inspect tomato leaves before spraying.”*

It is specifically engineered **not** as a generic, noisy sensor dashboard or an unsafe autonomous pump controller, but as a conservative agronomy intelligence engine integrated directly with CultivaNode’s farm and crop foundation.

---

## 🏗️ Architectural Foundations & Anchors

The IoT module anchors cleanly to CultivaNode's core data model without polluting existing operational tables:

```
[ Field Sensor Node ]
       │  (LoRaWAN 868MHz / Cellular NB-IoT / 2G)
       ▼
[ LoRaWAN / Cellular Gateway ]
       │  (Signed HTTP / HMAC-SHA256 Webhook)
       ▼
[ CultivaNode Ingestion Service ]
       │  (Auth, Skew Check, Anti-Replay Seq, Quality Filter)
       ▼
[ IoT Data Layer (telemetry_readings, rollups, device_events) ]
       │
       ├──► [ Agronomy Rules Engine ] (6h sustained condition, hysteresis, cooldown)
       │         │
       │         ▼
       │    [ device_alerts ──► linked to crop_alerts ]
       │
       └──► [ Crop Foundation Bridge ] (Syncs approved daily rollups into crop_measurements)
                 │
                 ▼
       [ Farmer, Field Agent & Admin Experiences ]
```

### Separation of Concerns:
- **Raw Telemetry Storage (`telemetry_readings`):** High-frequency, immutable raw sensor pulses (every 15 minutes) remain strictly inside the dedicated IoT schema.
- **Crop Foundation Integration (`crop_measurements`):** Approved daily/hourly aggregate observations (e.g. daily mean root-zone VWC %, daily canopy temperature, cumulative plot rainfall) are bridged into `crop_measurements`, keeping farm views fast and uncluttered.
- **Weather vs Ground Truth:** Regional forecasts (Open-Meteo & NiMet) serve as broad forecasts, while IoT sensors provide the plot-level ground truth.

---

## 📊 Priority Measurements & Pilot Scope

### Pilot Farm:
- **Location:** Al-Barakah Pilot Farm, Moniya Cluster, Oyo State (Derived Savanna Zone)
- **Monitored Plots:** Plot 1 (Tomato Roma VF, 15cm root depth), Plot 2 (Maize SAMMAZ 15, 30cm root depth), and Main 10,000L Irrigation Reservoir.

| Priority | Measurement | Sensor Channel Code | Primary Agronomic Use |
| :--- | :--- | :--- | :--- |
| **1** | Soil moisture at crop-root depth | `soil_moisture_pct` | Irrigation scheduling & moisture-stress alerts |
| **1** | Canopy air temperature & humidity | `air_temperature_c`, `air_humidity_pct` | Heat stress, disease/fungal risk, spray timing |
| **1** | Battery, signal RSSI, last contact | `battery_pct`, `signal_rssi` | Device health, battery life, trustworthy advice |
| **2** | Rainfall | `rainfall_mm` | Validate/localise regional weather forecasts |
| **2** | Tank or borehole water level | `water_level_pct` | Irrigation readiness & reservoir monitoring |
| **2** | Water-flow meter | `water_flow_lpm` | Detect irrigation delivery & leak anomalies |
| **Later** | Soil EC / pH | `soil_ec_us_cm`, `soil_ph` | Requires calibration discipline & agronomist rules |
| **Later** | Leaf wetness | `leaf_wetness_pct` | Fungal disease refinement |
| **Later** | Pump / valve actuator control | `device_commands` | Safety-critical; gated behind physical failsafes |

---

## 🗄️ Database Architecture & Migrations

Located in `database/migrations/`:

1. **`001_iot_core_schema.sql`**:
   - `device_models`: Hardware specifications, supported connectivity (`lorawan`, `cellular_nb_iot`, `cellular_2g_4g`), power profiles.
   - `devices`: Serial number (EUI-64/IMEI), status lifecycle, battery level/voltage, signal RSSI/SNR, sequence counters, and hashed credentials.
   - `device_installations`: Physical installation record linking node to `farm_id`, `plot_id`, `sensor_depth_cm`, `probe_installation_angle`, `soil_texture`, PostGIS `location`, `installed_by`, site survey checklist, and calibration dates.
   - `sensor_channels`: Supported channels per model with validation limits, units, precision, and measurement priority.
   - `telemetry_readings`: Partitionable raw table with idempotency deduplication index `(device_id, sequence_number, channel_code)`.
   - `telemetry_rollups`: 15-minute, hourly, and daily aggregations.
   - `device_events`: Audit trail for tamper, battery-low, offline, reboot, and gateway events.
   - `alert_rules`: Agronomist-approved thresholds with hysteresis and cooldown.
   - `device_alerts`: Open/acknowledged/resolved alert lifecycle.
   - `device_commands`: Actuator command definitions gated by manual overrides.

2. **`002_iot_security_and_rls.sql`**:
   - Zero-trust device model: devices never receive Supabase client keys or service-role keys.
   - Postgres Row-Level Security (RLS) on all tables.
   - Farm tenant isolation: users can only view telemetry and alerts for farms/plots they have permission to access (`can_view_farm`).
   - Field agent isolation: agents can commission and inspect assigned devices, but cannot see unrelated farm operations.

3. **`003_iot_agronomy_rules_seed.sql`**:
   - Hardware models: `CN-SOIL-PRO-V1` (LoRaWAN Soil & Root Station), `CN-WEATHER-CELL-V1` (Plot Weather Node), `CN-TANK-FLOW-V1` (Water Infrastructure Node).
   - Sensor channels for Priority 1 and Priority 2 metrics.
   - Agronomist-approved rules:
     - Tomato root-zone moisture deficit (< 22% VWC sustained for 6 hours).
     - Maize tasseling moisture deficit (< 20% VWC sustained for 6 hours).
     - Water tank low level (< 25% sustained for 30 minutes).
     - Elevated fungal/blight disease risk (Humidity > 85% sustained for 8 hours).
     - Sensor battery critical (< 15%).

4. **`004_crop_bridge_and_rollups.sql`**:
   - `process_telemetry_rollups()`: Generates 15m, 1h, and 1d aggregations.
   - `sync_approved_iot_to_crop_measurements()`: Bridges daily summaries into `crop_measurements`.
   - `run_device_watchdog()`: Detects silent nodes (> 12 hours), sets status to `'offline'`, and issues paused-advice alert.

---

## 🔒 Security Model & Packet Validation

1. **Zero-Trust Device Layer:**
   - Ingest messages are mutually authenticated or signed using **HMAC-SHA256** (`X-Signature`) or pre-shared bearer tokens stored as SHA-256 hashes (`timingSafeCompare`).
   - Secrets are managed securely and never distributed to client applications.
2. **Clock Drift / Timestamp Skew Enforcement:**
   - Rejects packets with timestamps skewed by more than **15 minutes** in the past or future (`TIMESTAMP_SKEW_EXCEEDED`).
3. **Anti-Replay Sequence Validation:**
   - Enforces monotonically increasing sequence numbers.
   - Replayed older sequence numbers are rejected (`REPLAYED_SEQUENCE_NUMBER`).
   - Exact duplicates are handled idempotently (`DUPLICATE_IDEMPOTENT`) without duplicating database rows or generating multiple alerts.
4. **Lifecycle & Revocation Guards:**
   - Devices marked as `retired`, `maintenance`, or with revoked credentials (`revokedAt`) are rejected immediately.

---

## 🧪 Quality Checks & Anomaly Detection

Every sensor reading passes through `src/ingestion/quality-checker.ts`:
- **Physical Boundaries:** Validates that values lie within possible agronomic and sensor ranges (e.g. soil moisture must be in [0%, 100%]). Values outside are flagged `out_of_range`.
- **Open Circuit / Probe Faults:** Detects electrical open circuits, ADC cutoffs (`-999`, `-9999`, `9999`, `NaN`). Flagged `hardware_fault` and excluded from rollups.
- **Rate-of-Change Anomaly:** Detects abrupt, physically impossible jumps (e.g. soil moisture changing by > 30% in one step without rain). Flagged `suspicious`.
- **Unit Validation:** Verifies expected units (e.g. `%` vs `volts`, `°C` vs `°F` with automatic conversion).

---

## 🧠 Conservative, Crop-Aware Alert Logic

Alerts avoid false positives and farmer fatigue by enforcing strict rules:
1. **Fresh reading from healthy device:** Silent or offline sensors never trigger agronomic farm advice.
2. **Sustained condition:** A single erratic reading does not trigger an alert. Soil moisture deficit requires **6 continuous hours** below the threshold.
3. **Hysteresis:** When an alert is active, it only clears after the reading recovers past the threshold plus a hysteresis buffer (e.g. 22% threshold + 2.5% delta = 24.5% to clear).
4. **Cooldown:** A 12-hour or 24-hour cooldown prevents notification spamming.
5. **Trust Labels:**
   - `📡 Sensor reading` (Plot ground truth)
   - `🌦️ Weather forecast` (NiMet / Open-Meteo regional forecast)
   - `💡 Calculated recommendation` (Agronomic rule synthesis)
   - `⏱️ Device watchdog` (Health & connectivity state)

---

## 📱 Product Experiences

### 1. Farmer Experience
- **Today Card:** Action-focused plain-language directives only (no raw telemetry graphs).
- **Plot Health Cards:** Root-zone moisture bar, target band, canopy temperature, relative humidity, probe depth (15cm/30cm), and device status badge.
- **Water Infrastructure Card:** Reservoir percentage gauge (82%), readiness indicator, and drip cycle capacity.
- **Forecast vs Truth:** Side-by-side comparison between regional weather forecast and on-farm sensor readings.
- **History View:** Plain language summary with expandable 7-day trend chart.
- **Language Toggle:** English and Yorùbá (`Àwọn Iṣẹ́ Oko Lónìí`).

### 2. Field Agent / Installer Experience
- **QR / Serial Pairing:** Enter or scan serial number (`CN-NG-2026-00199`).
- **Plot Assignment & Depth:** Select target farm, plot, crop stage, and root depth (15cm, 30cm, 60cm).
- **Site Survey Checklist:** Offline-capable validation for solar exposure, flood height, tamper seals, and probe calibration.
- **Live Ping Test:** Interactive terminal running real-time connectivity, RSSI, SNR, and battery verification before leaving the field.

### 3. Admin Fleet Console
- **Fleet Health KPIs:** Total nodes, active nodes, degraded nodes, and offline nodes.
- **Hardware Registry Table:** Search, filter by status, firmware, battery, signal RSSI, and calibration date.
- **Ingestion Pipeline Throughput:** Total packets received, accepted readings, deduplicated packets, and rejection metrics.
- **Device Watchdog:** One-click 12-hour silence scan that pauses crop advice for non-reporting nodes.

---

## ⚡ Live Hardware Simulator Lab

Interactive simulator (`src/simulator/`) with physics-based models:
- **Soil Water Physics (`soil-physics.ts`):** Simulates field capacity, wilting point, drainage, and temperature-driven evapotranspiration (ET).
- **Diurnal Weather Cycle (`weather-generator.ts`):** Sinusoidal temperature, humidity, and solar charging curves matching South-West Nigerian tropical conditions.
- **Interactive Scenarios:**
  - *Send Normal Telemetry Pulse*
  - *Trigger 6-Hour Moisture Stress*
  - *Trigger 25mm Rain Storm*
  - *Trigger Low Reservoir Tank (18%)*
  - *Apply Drip Irrigation (60 Liters)*
- **Fault Injection & Attack Simulation:**
  - *Replay Old Sequence Attack*
  - *Duplicate Sequence (Idempotent)*
  - *Timestamp Skew (+2 Hours)*
  - *Sensor Cable Disconnect (-999)*
  - *Out-of-Bounds Spike (145%)*
  - *14-Hour Silence (Watchdog Alert)*

---

## 🚀 Running the Project

### Prerequisites:
- Node.js v20+ / v24+
- npm

### 1. Run Automated Test Suite
```bash
npm test
```
*Executes all 20 unit and integration tests covering security, validation, quality checks, alert rules, watchdog, crop bridge, and end-to-end ingestion.*

### 2. Run CLI Simulator
```bash
npm run simulator
```
*Generates realistic telemetry packets and demonstrates anti-replay defense, clock drift rejection, probe disconnect handling, and the 12-hour watchdog scan.*

### 3. Launch Web Console & Ingestion Server
```bash
npm start
# Or: npm run web
```
- **Web Dashboard:** Open `http://localhost:3000` in your browser.
- **Cellular Ingestion API:** `POST http://localhost:3000/api/v1/telemetry/cellular`
- **LoRaWAN Webhook API:** `POST http://localhost:3000/api/v1/telemetry/lorawan`
- **Health & Metrics:** `GET http://localhost:3000/api/v1/health`, `GET http://localhost:3000/api/v1/metrics`
