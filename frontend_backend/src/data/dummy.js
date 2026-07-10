// ═══════════════════════════════════════════════════════════════
// PARKOS — Smart Parking Infrastructure Mock Data
// ═══════════════════════════════════════════════════════════════

// ── THEME COLORS ─────────────────────────────────────────────
export const COLORS = {
  bg: "#000000",
  card: "#050505",
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.12)",
  green: "#00FF66",
  red: "#FF3366",
  yellow: "#FFCC00",
  purple: "#B266FF",
  blue: "#3B82F6",
  white: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.35)",
};

// ── KPI SUMMARY ──────────────────────────────────────────────
export const kpiData = [
  { label: "Total Slots", value: "120", sub: "across 3 zones", color: COLORS.blue, icon: "grid" },
  { label: "Occupied", value: "77", sub: "64.2% utilization", color: COLORS.red, icon: "car" },
  { label: "Available", value: "35", sub: "ready to park", color: COLORS.green, icon: "check" },
  { label: "Revenue Today", value: "₹28,340", sub: "+12% vs yesterday", color: COLORS.purple, icon: "wallet" },
];

// ── PARKING ZONES ────────────────────────────────────────────
export const parkingZones = [
  {
    id: "A", name: "Zone A", total: 5, price: 40, demand: "high",
    spots: [
      { id: "A-01", status: "available" },
      { id: "A-02", status: "available" },
      { id: "A-03", status: "available" },
      { id: "A-04", status: "available" },
      { id: "A-05", status: "available" },
    ],
  },
  {
    id: "B", name: "Zone B", total: 5, price: 60, demand: "high",
    spots: [
      { id: "B-01", status: "available" },
      { id: "B-02", status: "available" },
      { id: "B-03", status: "available" },
      { id: "B-04", status: "available" },
      { id: "B-05", status: "available" },
    ],
  }
];

// ── ALERTS ───────────────────────────────────────────────────
export const recentAlerts = [
  { msg: "Zone B approaching full capacity (85%)", time: "1 min ago", type: "warning" },
  { msg: "Zone A spot A-32 payment overdue", time: "2 min ago", type: "warning" },
  { msg: "Zone B gate sensor offline", time: "5 min ago", type: "error" },
  { msg: "New reservation: B-29 by Arun P", time: "8 min ago", type: "info" },
  { msg: "Vehicle exited: A-15 (KA-07-MN-6789)", time: "12 min ago", type: "success" },
  { msg: "Sensor calibration needed: C-06", time: "18 min ago", type: "maintenance" },
  { msg: "Peak pricing activated for Zone B", time: "25 min ago", type: "info" },
  { msg: "New EV charger online at C-30", time: "32 min ago", type: "success" },
];

// ── CHART DATA ───────────────────────────────────────────────
export const hourlyData = {
  labels: ["6AM", "7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM"],
  occupied: [12, 28, 45, 62, 78, 85, 92, 105, 98, 88, 82, 75, 68, 58, 45],
};

export const weeklyData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  revenue: [18500, 22300, 19800, 24100, 28900, 32500, 26400],
  avgOccupancy: [68, 72, 70, 75, 82, 88, 76],
};

export const zonePerformance = {
  labels: ["Zone A", "Zone B", "Zone C"],
  occupancy: [65, 80, 35],
};

export const vehicleTypes = {
  labels: ["Sedan", "SUV", "Hatchback", "Bike", "EV"],
  counts: [42, 28, 35, 18, 12],
};

export const weeklyPricingTrend = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  zoneA: [35, 38, 40, 42, 45, 50, 40],
  zoneB: [50, 55, 58, 60, 65, 70, 60],
  zoneC: [20, 22, 25, 28, 30, 35, 25],
};

export const dailyZonePricing = {
  labels: ["Zone A", "Zone B", "Zone C"],
  morning: [30, 45, 20],
  afternoon: [45, 65, 30],
  evening: [40, 55, 25],
};

// ── PREDICTIONS ──────────────────────────────────────────────
export const demandPrediction = {
  labels: ["Now", "+1h", "+2h", "+3h", "+4h", "+5h", "+6h"],
  predicted: [77, 85, 92, 95, 88, 75, 60],
  actual: [77, null, null, null, null, null, null],
};

// ── HEATMAP DATA ─────────────────────────────────────────────
export const heatmapData = [
  { hour: "6AM", zoneA: 20, zoneB: 15, zoneC: 10 },
  { hour: "8AM", zoneA: 55, zoneB: 60, zoneC: 30 },
  { hour: "10AM", zoneA: 75, zoneB: 80, zoneC: 45 },
  { hour: "12PM", zoneA: 85, zoneB: 90, zoneC: 55 },
  { hour: "2PM", zoneA: 80, zoneB: 85, zoneC: 50 },
  { hour: "4PM", zoneA: 70, zoneB: 75, zoneC: 40 },
  { hour: "6PM", zoneA: 60, zoneB: 65, zoneC: 35 },
  { hour: "8PM", zoneA: 40, zoneB: 45, zoneC: 25 },
];

// ── SENSOR DATA ──────────────────────────────────────────────
export const sensorZones = [
  {
    id: "A", name: "Zone Alpha", symbol: "A", color: "#00FF66",
    sensors: Array.from({ length: 5 }).map((_, i) => ({ id: `SN-A0${i + 1}`, status: "offline", latency: null, updated: "Waiting for data", health: "bad" })),
  },
  {
    id: "B", name: "Zone Beta", symbol: "B", color: "#B266FF",
    sensors: Array.from({ length: 5 }).map((_, i) => ({ id: `SN-B0${i + 1}`, status: "offline", latency: null, updated: "Waiting for data", health: "bad" })),
  }
];

export const systemAlerts = [];