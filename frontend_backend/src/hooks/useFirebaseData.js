// ═══════════════════════════════════════════════════════════════
// useFirebaseData — Real-time subscription to Firebase RTDB
// Falls back to dummy data when Firebase node is empty/missing.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import {
  parkingZones as dummyZones,
  sensorZones as dummySensors,
  systemAlerts as dummyAlerts,
  recentAlerts as dummyRecentAlerts,
  kpiData as dummyKpi,
  hourlyData as dummyHourly,
  weeklyData as dummyWeekly,
  zonePerformance as dummyZonePerf,
  vehicleTypes as dummyVehicleTypes,
  weeklyPricingTrend as dummyPricingTrend,
  dailyZonePricing as dummyDailyPricing,
  demandPrediction as dummyDemand,
  heatmapData as dummyHeatmap,
} from "../data/dummy";

/**
 * Subscribes to a single RTDB path and returns { data, loading, error }.
 * If the Firebase snapshot is null, `fallback` is returned as data.
 */
function useRTDB(path, fallback) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const dbRef = ref(db, path);
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const val = snapshot.val();
        setData(val !== null ? val : fallback);
        setLoading(false);
      },
      (err) => {
        console.error(`Firebase RTDB error at "${path}":`, err);
        setError(err);
        setData(fallback);
        setLoading(false);
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { data, loading, error };
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return Object.values(value).filter(Boolean);
}

function getZoneIdFromZone(zone, index) {
  const fallback = String.fromCharCode(65 + index);
  if (!zone) return fallback;

  const candidates = [zone.id, zone.symbol, zone.name]
    .filter(Boolean)
    .map((v) => String(v).trim().toUpperCase());

  for (const raw of candidates) {
    // Exact single-letter IDs are preferred: "A", "B", ...
    if (/^[A-Z]$/.test(raw)) return raw;

    // Common labels like "Zone A", "ZONE-B", "A1" -> pick first letter token.
    const m = raw.match(/[A-Z]/);
    if (m) return m[0];
  }

  return fallback;
}

// ── Public hooks ────────────────────────────────────────────────

/**
 * useParkingZones — Live parking zone & slot data.
 *
 * Slot X-01 (the sensor-controlled slot) in each zone:
 *   Status derived from two independent Firebase detection sources:
 *
 *   Firebase path: sensorDetection/{zoneId}
 *     Shape: { detected: true|false, updatedAt: number }
 *     Written by the IoT ultrasonic/IR sensor (Python/Arduino)
 *
 *   Firebase path: cvDetection/{zoneId}
 *     Shape: { detected: true|false, confidence: 0-1, updatedAt: number }
 *     Written by the OpenCV car-detection script
 *
 *   Combined rule:  occupied  → sensorDetected OR cvDetected
 *                   available → both false / missing
 *
 * All other slots (X-02 … X-05) use the standard parkingZones data.
 * Analytics & Pricing pages auto-reflect changes since they consume this hook.
 */
export function useParkingZones() {
  const zonesResult     = useRTDB("parkingZones",    null);
  // Detection paths are NON-BLOCKING — fallback to {} so they resolve immediately
  // even if the Firebase nodes haven't been written to yet.
  const sensorDetResult = useRTDB("sensorDetection", {});
  const cvDetResult     = useRTDB("cvDetection",     {});

  const raw          = zonesResult.data;
  const sensorDetRaw = sensorDetResult.data || {};  // { A: { detected: bool }, B: {...} }
  const cvDetRaw     = cvDetResult.data     || {};  // { A: { detected: bool }, B: {...} }

  // Only block rendering on the main zones data, not on detection paths
  const loading = zonesResult.loading;

  const rawArray  = toArray(raw);
  const activeLen = raw === null ? dummyZones.length : Math.max(1, rawArray.length);


  const data = Array.from({ length: activeLen }).map((_, zIndex) => {
    const liveZone = rawArray[zIndex];
    const baseZoneFromDummy = dummyZones[zIndex];
    const zoneId = getZoneIdFromZone(liveZone || baseZoneFromDummy, zIndex);

    const baseZone = baseZoneFromDummy || {
      id: zoneId,
      name: `Zone ${zoneId}`,
      total: 5, price: 30, demand: "low",
      spots: []
    };

    const baseSpots = baseZone.spots || [];
    const liveSpots = liveZone?.spots
      ? toArray(liveZone.spots)
      : [];

    // ── Dual-source detection for slot X-01 (index 0) ──────────
    // Read detected boolean from sensorDetection/A and cvDetection/A
    const sensorDetected = !!(sensorDetRaw?.[zoneId]?.detected);
    const cvDetected     = !!(cvDetRaw?.[zoneId]?.detected);
    
    // ── Merge all spots ─────────────────────────────────────────
    const maxSpots = Math.max(baseSpots.length || 5, liveSpots.length);

    const mergedSpots = Array.from({ length: maxSpots }).map((_, sIndex) => {
      const baseSpot = baseSpots[sIndex] || {
        id: `${zoneId}-0${sIndex + 1}`, status: "available"
      };
      const liveSpot = liveSpots[sIndex];

      if (sIndex === 0) {
        // Slot X-01: occupied takes precedence, then reserved, then available
        const liveStatus = liveSpot?.status || "available";
        // Occupancy now requires BOTH Hardware and Vision to agree
        const isOccupied = (cvDetected && sensorDetected);
        const finalStatus = isOccupied ? "occupied" : (liveStatus === "reserved" ? "reserved" : "available");
        
        return {
          ...baseSpot,
          ...(liveSpot || {}),
          status: finalStatus,
          rawStatus: liveStatus,
          _sensorDetected: sensorDetected,
          _cvDetected:     cvDetected,
        };
      }

      return liveSpot ? { ...baseSpot, ...liveSpot, rawStatus: liveSpot.status } : { ...baseSpot, rawStatus: "available" };
    });

    const zoneBase = liveZone ? { ...baseZone, ...liveZone } : baseZone;
    return { ...zoneBase, total: mergedSpots.length, spots: mergedSpots };
  });

  return { ...zonesResult, loading, data };
}

/**
 * useSlotDetection — Exposes raw sensor + CV detection per zone.
 * Returns:
 *   sensorDetection: { A: { detected, updatedAt }, B: {...} }
 *   cvDetection:     { A: { detected, confidence, updatedAt }, B: {...} }
 */
export function useSlotDetection() {
  const sensor = useRTDB("sensorDetection", {});
  const cv     = useRTDB("cvDetection",     {});
  return {
    sensorDetection: sensor.data || {},
    cvDetection:     cv.data     || {},
    loading: sensor.loading || cv.loading,
  };
}

/** Live sensor zones */
export function useSensorZones() {
  const result = useRTDB("sensorZones", null);
  const sensorDetResult = useRTDB("sensorDetection", {});
  const cvDetResult = useRTDB("cvDetection", {});

  const raw = result.data;
  const sensorDet = sensorDetResult.data || {};
  const cvDet = cvDetResult.data || {};
  
  const rawArray = toArray(raw);
  const activeLen = raw === null ? dummySensors.length : Math.max(1, rawArray.length);

  const data = Array.from({ length: activeLen }).map((_, zIndex) => {
    const liveZone = rawArray[zIndex];
    const baseZoneFromDummy = dummySensors[zIndex];
    const zoneId = getZoneIdFromZone(liveZone || baseZoneFromDummy, zIndex);

    const baseZone = baseZoneFromDummy || {
      id: zoneId,
      name: `Zone ${zoneId}`,
      symbol: zoneId,
      color: "#F3D422",
      sensors: []
    };

    // Deep merge sensors
    const baseSensors = baseZone.sensors || [];
    const liveSensorsArray = liveZone?.sensors ? toArray(liveZone.sensors) : [];
    
    // Use the number of sensors from dummy data or live data
    const maxSensors = Math.max(baseSensors.length || 5, liveSensorsArray.length);

    if (maxSensors === 0) return { ...baseZone, ...liveZone, sensors: [] };

    const mergedSensors = Array.from({ length: maxSensors }).map((_, sIndex) => {
      const baseSensor = baseSensors[sIndex] || {
        id: `SN-${baseZone.id}0${sIndex + 1}`, status: "offline", latency: null, health: "bad", updated: "Waiting for data"
      };
      const liveSensor = liveSensorsArray[sIndex];
      const merged = liveSensor ? { ...baseSensor, ...liveSensor } : baseSensor;

      // Hardware bridge:
      // Python scripts publish to sensorDetection/{zoneId} and cvDetection/{zoneId}.
      // We project that live feed into the first sensor row so System Health reflects hardware even
      // if sensorZones is not being written by firmware.
      if (sIndex === 0) {
        const sensorNode = sensorDet?.[zoneId];
        const cvNode = cvDet?.[zoneId];
        const latestTs = Math.max(Number(sensorNode?.updatedAt || 0), Number(cvNode?.updatedAt || 0));

        if (latestTs > 0) {
          const now = Date.now();
          const ageMs = Math.max(0, now - latestTs);
          // With 30s hardware heartbeat, 60s is a safe threshold for "Live" status.
          const isStale = ageMs > 60 * 1000; 

          return {
            ...merged,
            id: `HW-${zoneId}-01`,
            status: isStale ? "offline" : "online",
            health: isStale ? "bad" : "good",
            latency: isStale ? null : Math.min(999, ageMs),
            lastUpdated: latestTs,
            updated: isStale ? "stale feed" : "just now",
          };
        }
      }

      return merged;
    });
    
    return { ...baseZone, ...liveZone, sensors: mergedSensors };
  });

  return { ...result, data, loading: result.loading || sensorDetResult.loading || cvDetResult.loading };
}

/** Live system alerts */
export function useSystemAlerts() {
  const result = useRTDB("systemAlerts", null);
  const raw = result.data;
  const data =
    raw === null
      ? dummyAlerts
      : Array.isArray(raw)
      ? raw
      : Object.values(raw);
  return { ...result, data };
}

/** Live recent alerts (dashboard) */
export function useRecentAlerts() {
  const result = useRTDB("recentAlerts", null);
  const raw = result.data;
  const data =
    raw === null
      ? dummyRecentAlerts
      : Array.isArray(raw)
      ? raw
      : Object.values(raw);
  return { ...result, data };
}

/** Live KPI summary */
export function useKpiData() {
  const result = useRTDB("kpiData", null);
  const raw = result.data;
  const data =
    raw === null
      ? dummyKpi
      : Array.isArray(raw)
      ? raw
      : Object.values(raw);
  return { ...result, data };
}

/** Live hourly chart */
export function useHourlyData() {
  return useRTDB("hourlyData", dummyHourly);
}

/** Live weekly chart */
export function useWeeklyData() {
  return useRTDB("weeklyData", dummyWeekly);
}

/** Live zone performance */
export function useZonePerformance() {
  return useRTDB("zonePerformance", dummyZonePerf);
}

/** Live vehicle types */
export function useVehicleTypes() {
  return useRTDB("vehicleTypes", dummyVehicleTypes);
}

/** Live weekly pricing trend */
export function useWeeklyPricingTrend() {
  return useRTDB("weeklyPricingTrend", dummyPricingTrend);
}

/** Live daily zone pricing */
export function useDailyZonePricing() {
  return useRTDB("dailyZonePricing", dummyDailyPricing);
}

/** Live demand prediction */
export function useDemandPrediction() {
  return useRTDB("demandPrediction", dummyDemand);
}

/** Live heatmap */
export function useHeatmapData() {
  const result = useRTDB("heatmapData", null);
  const raw = result.data;
  const data =
    raw === null
      ? dummyHeatmap
      : Array.isArray(raw)
      ? raw
      : Object.values(raw);
  return { ...result, data };
}
