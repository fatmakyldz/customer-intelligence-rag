import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import * as dotenv from 'dotenv';

dotenv.config();

const documents = [
  // ---- SENSOR LOGS: temperature ----
  {
    content:
      'Temperature sensor log - Module MOD-DC-01, Cold Aisle A (rack row R1-R8). Readings over the last 6 hours: 22.4°C, 23.1°C, 25.8°C, 29.6°C, 33.2°C, 35.4°C. Inlet air temperature has climbed steadily and is now at 35.4°C, well above the ASHRAE A1 recommended maximum of 27°C and approaching the 35-36°C critical threshold where compute throttling and thermal shutdown begin. The rise correlates with a drop in CRAC-2 supply airflow. Hot-aisle return temperature peaked at 41°C. Immediate risk of overheating-induced server shutdown and downtime.',
    source: 'temp_sensor_mod01_aisleA',
    metadata: {
      type: 'sensor_log',
      module: 'MOD-DC-01',
      metric: 'temperature_celsius',
      latest_value: 35.4,
      threshold_critical: 35,
      location: 'cold_aisle_A',
      date: '2026-06-22',
    },
  },
  {
    content:
      'Temperature sensor log - Module MOD-DC-02, Cold Aisle B. Stable operation. Inlet air temperature held between 21.8°C and 23.5°C across the last 24 hours. CRAC-3 and CRAC-4 supply airflow nominal. All readings within ASHRAE A1 recommended range (18-27°C). No thermal risk detected.',
    source: 'temp_sensor_mod02_aisleB',
    metadata: {
      type: 'sensor_log',
      module: 'MOD-DC-02',
      metric: 'temperature_celsius',
      latest_value: 22.9,
      threshold_critical: 35,
      location: 'cold_aisle_B',
      date: '2026-06-22',
    },
  },
  // ---- SENSOR LOGS: humidity ----
  {
    content:
      'Humidity sensor log - Module MOD-DC-01, server room ambient. Relative humidity readings over the last 4 hours: 52%, 56%, 61%, 64%, 67%, 69%. Humidity has crossed the 65% upper safe limit and is now at 69% RH. Sustained humidity above 60% RH increases the risk of condensation, corrosion on connectors, and conductive anodic filament failures on PCBs. Combined with the elevated temperature in the same module, this points to a failing humidity control / cooling loop. Risk of long-term hardware damage and short-term electrical faults.',
    source: 'humidity_sensor_mod01',
    metadata: {
      type: 'sensor_log',
      module: 'MOD-DC-01',
      metric: 'relative_humidity_percent',
      latest_value: 69,
      threshold_warning: 60,
      threshold_critical: 65,
      date: '2026-06-22',
    },
  },
  // ---- UPS EVENTS ----
  {
    content:
      'UPS event log - UPS-A (modular Li-ion string, Module MOD-DC-01). Self-test report: estimated battery runtime at current load (38 kW) has fallen to 17 minutes, below the 20-minute minimum required to ride through a utility outage and complete a graceful shutdown or generator start. Measured battery string capacity is 71% of rated (health "degraded"). Internal resistance on cabinet 3 is rising and two cells flagged for replacement. If utility power is lost, UPS-A may not sustain the load long enough, creating a high risk of unprotected shutdown and data loss.',
    source: 'ups_a_selftest',
    metadata: {
      type: 'ups_event',
      unit: 'UPS-A',
      module: 'MOD-DC-01',
      runtime_minutes: 17,
      runtime_min_required: 20,
      battery_health_percent: 71,
      severity: 'critical',
      date: '2026-06-21',
    },
  },
  {
    content:
      'UPS event log - UPS-B (Module MOD-DC-02). Battery degradation trend report. Over the last 9 months measured capacity has declined from 98% to 84% of rated. Estimated runtime at current load is 26 minutes, still above the 20-minute threshold but trending down ~1.5% per month. At the current rate the string will drop below the 20-minute safe runtime in approximately 4 months. Recommend scheduling battery replacement before Q4 2026. Warning-level, not yet critical.',
    source: 'ups_b_degradation',
    metadata: {
      type: 'ups_event',
      unit: 'UPS-B',
      module: 'MOD-DC-02',
      runtime_minutes: 26,
      runtime_min_required: 20,
      battery_health_percent: 84,
      severity: 'warning',
      date: '2026-06-20',
    },
  },
  // ---- FIRE ALARM EVENTS ----
  {
    content:
      'Fire alarm panel event - Panel FACP-1 (VESDA aspirating smoke detection, Module MOD-DC-01). Event type: FAULT. Detection zone Z3 (over hot aisle, rack row R5-R8) reporting "detector fault / airflow low" since 03:14. While in fault state, zone Z3 cannot reliably detect smoke, leaving part of the server room without early fire detection. The fault coincides with the elevated hot-aisle temperature in the same module. This is a fire-system failure condition: suppression release for Z3 is inhibited. Requires immediate inspection of the aspirating pipe network and detector.',
    source: 'facp1_event_log',
    metadata: {
      type: 'fire_alarm_event',
      panel: 'FACP-1',
      module: 'MOD-DC-01',
      event: 'fault',
      zone: 'Z3',
      severity: 'critical',
      date: '2026-06-22',
    },
  },
  {
    content:
      'Fire alarm panel event - Panel FACP-2 (Module MOD-DC-02). Event type: TEST. Scheduled monthly functional test of smoke detectors and clean-agent (FM-200) release circuit completed successfully. All 4 zones responded, alarm-to-release sequence verified in test mode (no agent discharged), and the panel returned to NORMAL. Next scheduled test: 2026-07-15. No action required.',
    source: 'facp2_event_log',
    metadata: {
      type: 'fire_alarm_event',
      panel: 'FACP-2',
      module: 'MOD-DC-02',
      event: 'test',
      result: 'pass',
      severity: 'normal',
      date: '2026-06-15',
    },
  },
  // ---- MAINTENANCE REPORTS ----
  {
    content:
      'Maintenance report - CRAC-2 (computer room air conditioner, Module MOD-DC-01). Status: OVERDUE. Quarterly preventive maintenance (filter replacement, compressor and refrigerant check, condensate drain cleaning) was due 2026-05-15 and has been deferred for 38 days due to spare-parts backorder. Technician notes from the last visit flagged a partially clogged air filter and reduced supply airflow on CRAC-2. The delayed CRAC maintenance is the most likely root cause of the rising cold-aisle temperature and humidity in MOD-DC-01. Recommend emergency maintenance dispatch.',
    source: 'crac2_maintenance',
    metadata: {
      type: 'maintenance_report',
      asset: 'CRAC-2',
      module: 'MOD-DC-01',
      status: 'overdue',
      days_overdue: 38,
      due_date: '2026-05-15',
      severity: 'warning',
    },
  },
  {
    content:
      'Maintenance report - CRAC-3 and CRAC-4 (Module MOD-DC-02). Status: COMPLETED. Quarterly preventive maintenance performed on 2026-06-10: filters replaced, refrigerant charge verified, condensate lines flushed, fan bearings inspected. Both units operating at full rated cooling capacity. Next service due 2026-09-10. No issues found.',
    source: 'crac34_maintenance',
    metadata: {
      type: 'maintenance_report',
      asset: 'CRAC-3,CRAC-4',
      module: 'MOD-DC-02',
      status: 'completed',
      date: '2026-06-10',
      severity: 'normal',
    },
  },
  // ---- INCIDENT / DATA-LOSS RISK ----
  {
    content:
      'Server room incident report INC-2026-0619 - Module MOD-DC-01, storage array SAN-1. Two disks in RAID-6 array SAN-1 (volume holding primary database and backup staging) reported SMART pre-failure alerts within 24 hours: drive bay 4 (reallocated sector count rising) and drive bay 9 (pending sectors + read errors). RAID-6 currently tolerates the loss of these two drives, but a third failure would cause array collapse and permanent data loss. The array sits in the same module experiencing overheating (35.4°C) and high humidity (69%), which accelerates disk failure. The most recent off-site backup completed 4 days ago; backup jobs have been failing since the storage warnings began. High risk of data loss.',
    source: 'incident_inc_2026_0619',
    metadata: {
      type: 'maintenance_report',
      asset: 'SAN-1',
      module: 'MOD-DC-01',
      incident_id: 'INC-2026-0619',
      severity: 'critical',
      risk: 'data_loss',
      date: '2026-06-19',
    },
  },
  // ---- FACILITY / COMPANY DOCUMENTS ----
  {
    content:
      'Facility operating thresholds and SOP - MOD-DC modular edge data centers. Environmental limits: cold-aisle inlet temperature recommended 18-27°C, critical at/above 35°C (compute throttling and thermal shutdown risk). Relative humidity safe range 40-60%, warning above 60%, critical above 65%. UPS minimum battery runtime under full load: 20 minutes (to cover generator start and graceful shutdown). CRAC preventive maintenance cadence: quarterly. Fire detection (VESDA/FACP) must be functional in all zones at all times; any FAULT is treated as a critical event. Escalation: a single critical reading pages the on-call facility engineer; two concurrent critical conditions trigger the data-loss prevention runbook.',
    source: 'facility_sop_thresholds',
    metadata: {
      type: 'facility_document',
      doc: 'operating_thresholds_sop',
      version: '3.0',
      date: '2026-01-10',
    },
  },
  {
    content:
      'Company document - MOD-DC Operations business continuity policy. The company operates modular edge data centers for customers requiring on-premise / offline AI and storage. Contractual uptime SLA is 99.98% (max ~1.6 hours downtime/year). Any event risking data loss, overheating shutdown, UPS failure, or fire-system failure must be logged and analyzed by the MOD-DC Local Intelligence Platform, with recommended actions reviewed by the facility manager. All telemetry and documents are processed locally; no facility data leaves the site (air-gapped, Ollama-based local LLM). This policy supports the patent filing for autonomous local data-center risk analysis.',
    source: 'company_business_continuity_policy',
    metadata: {
      type: 'company_document',
      doc: 'business_continuity_policy',
      version: '1.2',
      date: '2026-02-01',
    },
  },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ragdb',
    ssl: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: 'Xenova/all-MiniLM-L6-v2',
  });

  console.log(`Seeding ${documents.length} documents...`);

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    console.log(`[${i + 1}/${documents.length}] Embedding: ${doc.metadata.type} - ${doc.source}`);

    const vector = await embeddings.embedQuery(doc.content);
    const vectorStr = `[${vector.join(',')}]`;

    await dataSource.query(
      `INSERT INTO documents (content, metadata, embedding, source)
       VALUES ($1, $2, $3::vector, $4)`,
      [doc.content, JSON.stringify(doc.metadata), vectorStr, doc.source],
    );
  }

  console.log('Seed complete!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
