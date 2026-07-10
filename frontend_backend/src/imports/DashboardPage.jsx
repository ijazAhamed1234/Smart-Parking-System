import React, { useState, useEffect } from "react";
import { useParkingZones, useSlotDetection } from "../hooks/useFirebaseData";
import { Car, Lock, Check, Info, MapPin, Plus, Minus, TriangleAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { ref, set, remove, get } from "firebase/database";

// ── Royal animation presets ──────────────────────────────────────
const EASE = [0.4, 0, 0.2, 1];
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

const statusConfig = {
  occupied:  { color: "#DC2626", label: "Occupied",  icon: Car },
  available: { color: "#16A34A", label: "Available", icon: Check },
  reserved:  { color: "#9333EA", label: "Reserved",  icon: Lock },
  error:     { color: "#C9A227", label: "Offline",   icon: TriangleAlert },
};

export default function DashboardPage() {
  const { data: parkingZones, loading } = useParkingZones();
  const { sensorDetection, cvDetection } = useSlotDetection();
  const [selectedZone, setSelectedZone] = useState("A");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [hoverSpot,    setHoverSpot]    = useState(null);
  const [isLive,       setIsLive]       = useState(false);

  // Check if hardware connection is "Live" (data received in last 60s)
  useEffect(() => {
    const checkLive = () => {
      const now = Date.now();
      const allTimestamps = [
        ...Object.values(sensorDetection).map(d => d?.updatedAt || 0),
        ...Object.values(cvDetection).map(d => d?.updatedAt || 0)
      ];
      const latest = Math.max(0, ...allTimestamps);
      setIsLive(latest > 0 && (now - latest) < 60000);
    };
    checkLive();
    const interval = setInterval(checkLive, 5000);
    return () => clearInterval(interval);
  }, [sensorDetection, cvDetection]);

  const handleAddZone = () => {
    const nextIndex = parkingZones.length;
    const id = String.fromCharCode(65 + nextIndex);
    const name = `Zone ${id}`;
    set(ref(db, `parkingZones/${nextIndex}`), {
      id, name, total: 5, price: 30, demand: "low",
      spots: Array.from({ length: 5 }, (_, i) => ({ id: `${id}-0${i + 1}`, status: "available" }))
    });
    set(ref(db, `sensorZones/${nextIndex}`), {
      id, name, symbol: id, color: "#C9A227",
      sensors: Array.from({ length: 5 }, (_, i) => ({ id: `SN-${id}0${i + 1}`, status: "offline", latency: null, health: "bad", updated: "Waiting for data" }))
    });
  };

  const handleRemoveZone = async () => {
    if (parkingZones.length <= 1) return;
    const snap = await get(ref(db, "parkingZones"));
    if (!snap.exists()) return;
    const keys = Object.keys(snap.val()).sort();
    const last = keys[keys.length - 1];
    await remove(ref(db, `parkingZones/${last}`));
    await remove(ref(db, `sensorZones/${last}`));
    const lastZone = parkingZones[parkingZones.length - 1];
    if (selectedZone === lastZone.id) { setSelectedZone(parkingZones[parkingZones.length - 2].id); setSelectedSpot(null); }
  };

  const handleAddSlot = async () => {
    const zoneIndex = parkingZones.findIndex(z => z.id === selectedZone);
    if (zoneIndex === -1) return;

    const z = parkingZones[zoneIndex];
    const zoneSnap = await get(ref(db, `parkingZones/${zoneIndex}`));
    let zData;
    
    if (!zoneSnap.exists()) {
      zData = {
        id: z.id || selectedZone,
        name: z.name || `Zone ${selectedZone}`,
        total: z.total || 5,
        price: z.price || 30,
        demand: z.demand || "low",
        spots: z.spots.map(s => ({ id: s.id, status: s.status }))
      };
    } else {
      zData = zoneSnap.val();
      if (!zData.id) zData.id = z.id || selectedZone;
    }

    const rawSpots = zData.spots ? (Array.isArray(zData.spots) ? zData.spots : Object.values(zData.spots)) : [];
    const newTotal = Math.max(zData.total || 0, rawSpots.length) + 1;
    const slotId = `${zData.id}-${newTotal.toString().padStart(2, '0')}`;
    const newSpots = [...rawSpots, { id: slotId, status: "available" }];

    await set(ref(db, `parkingZones/${zoneIndex}`), { ...zData, total: newTotal, spots: newSpots });

    // Sync with sensorZones
    const sensorSnap = await get(ref(db, `sensorZones/${zoneIndex}`));
    if (!sensorSnap.exists()) {
      await set(ref(db, `sensorZones/${zoneIndex}`), {
        id: zData.id, name: zData.name || `Zone ${zData.id}`, symbol: zData.id, color: "#C9A227",
        sensors: newSpots.map((s, i) => ({
          id: `SN-${zData.id}${String(i + 1).padStart(2, '0')}`,
          status: "offline", latency: null, health: "bad", updated: "Waiting for data"
        }))
      });
    } else {
      const sData = sensorSnap.val();
      const rawSensors = sData.sensors ? (Array.isArray(sData.sensors) ? sData.sensors : Object.values(sData.sensors)) : [];
      const newSensors = [...rawSensors, {
        id: `SN-${zData.id}${newTotal.toString().padStart(2, '0')}`,
        status: "offline", latency: null, health: "bad", updated: "Waiting for data"
      }];
      await set(ref(db, `sensorZones/${zoneIndex}/sensors`), newSensors);
    }
  };

  const handleRemoveSlot = async () => {
    const zoneIndex = parkingZones.findIndex(z => z.id === selectedZone);
    if (zoneIndex === -1) return;

    const z = parkingZones[zoneIndex];
    const zoneSnap = await get(ref(db, `parkingZones/${zoneIndex}`));
    let zData;

    if (!zoneSnap.exists()) {
      zData = {
        id: z.id || selectedZone,
        name: z.name || `Zone ${selectedZone}`,
        total: z.total || 5,
        price: z.price || 30,
        demand: z.demand || "low",
        spots: z.spots.map(s => ({ id: s.id, status: s.status }))
      };
    } else {
      zData = zoneSnap.val();
      if (!zData.id) zData.id = z.id || selectedZone;
    }

    const rawSpots = zData.spots ? (Array.isArray(zData.spots) ? zData.spots : Object.values(zData.spots)) : [];
    if (Math.max(zData.total || 0, rawSpots.length) <= 1) return;
    
    const newTotal = Math.max(1, Math.max(zData.total || 0, rawSpots.length) - 1);
    const newSpots = rawSpots.slice(0, -1);

    await set(ref(db, `parkingZones/${zoneIndex}`), { ...zData, total: newTotal, spots: newSpots });

    const sensorSnap = await get(ref(db, `sensorZones/${zoneIndex}`));
    if (sensorSnap.exists()) {
      const sData = sensorSnap.val();
      const rawSensors = sData.sensors ? (Array.isArray(sData.sensors) ? sData.sensors : Object.values(sData.sensors)) : [];
      const newSensors = rawSensors.slice(0, -1);
      await set(ref(db, `sensorZones/${zoneIndex}/sensors`), newSensors);
    }

    if (selectedSpot && selectedSpot.id.startsWith(zData.id) && parseInt(selectedSpot.id.split('-')[1]) > newTotal) {
      setSelectedSpot(null);
    }
  };

  if (loading) return (
    <div style={{ color: "rgba(212,175,55,0.3)", textAlign: "center", paddingTop: 60, fontSize: 12 }}>Loading…</div>
  );

  const zone        = parkingZones.find(z => z.id === selectedZone) ?? parkingZones[0];
  const occ         = zone?.spots?.filter(s => s.status === "occupied").length  ?? 0;
  const avail       = zone?.spots?.filter(s => s.status === "available").length ?? 0;
  const res         = zone?.spots?.filter(s => s.status === "reserved").length  ?? 0;
  const visibleSpots = zone?.spots ?? [];

  return (
    <motion.div variants={container} initial="hidden" animate="visible">

      {/* ── Zone Tabs ── */}
      <motion.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {parkingZones.map((z, idx) => {
          const zo    = z.spots.filter(s => s.status === "occupied").length;
          const zpct  = Math.round((zo / z.total) * 100);
          const active = selectedZone === z.id;
          const barC  = zpct > 70 ? "#DC2626" : zpct > 50 ? "#C9A227" : "#16A34A";
          return (
            <motion.button
              key={z.id}
              whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={() => { setSelectedZone(z.id); setSelectedSpot(null); }}
              style={{
                flex: "1 1 160px", textAlign: "left",
                background: active ? "rgba(201,162,39,0.07)" : "#0d0d0d",
                border: active ? "1px solid rgba(201,162,39,0.2)" : "1px solid rgba(255,255,255,0.05)",
                borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                position: "relative", overflow: "hidden",
                transition: "background 0.22s, border-color 0.22s",
              }}
            >
              {active && (
                <motion.div layoutId="zoneTab" style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                  background: "linear-gradient(90deg, #C9A227, transparent)",
                }} transition={{ duration: 0.35, ease: EASE }} />
              )}
              <div style={{ color: active ? "#C9A227" : "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>
                {z.name.toUpperCase()}
              </div>
              <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{zpct}%</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 2 }}>{zo}/{z.total} occupied</div>
              <div style={{ height: 2, borderRadius: 1, marginTop: 8, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${zpct}%` }}
                  transition={{ duration: 0.7, ease: EASE }}
                  style={{ height: "100%", background: barC }}
                />
              </div>
            </motion.button>
          );
        })}

        {/* Add/Remove */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }} onClick={handleAddZone}
            style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.14)", borderRadius: 8, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
            <Plus size={18} color="#16A34A" />
          </motion.button>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }} onClick={handleRemoveZone} disabled={parkingZones.length <= 1}
            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.14)", borderRadius: 8, width: 40, height: 40, cursor: parkingZones.length <= 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: parkingZones.length <= 1 ? 0.3 : 1, transition: "all 0.2s" }}>
            <Minus size={18} color="#DC2626" />
          </motion.button>
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div variants={container} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Occupied",  val: occ,   color: "#DC2626", Icon: Car   },
          { label: "Available", val: avail, color: "#16A34A", Icon: Check },
          { label: "Reserved",  val: res,   color: "#9333EA", Icon: Lock  },
        ].map((s) => (
          <motion.div key={s.label} variants={fadeUp}
            whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}
            transition={{ duration: 0.2, ease: EASE }}
            style={{
              background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 10, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `${s.color}0f`, border: `1px solid ${s.color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.Icon size={15} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 10 }}>{s.label}</div>
              <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main: Grid + Detail ── */}
      <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12 }}>

        {/* Parking Grid */}
        <div style={{ background: "#0d0d0d", border: "1px solid rgba(201,162,39,0.08)", borderRadius: 12, padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={14} style={{ color: "#C9A227" }} />
                <span style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}>{zone.name}</span>
              </div>
              <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleAddSlot}
                  style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 4, width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={12} color="#16A34A" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleRemoveSlot} disabled={zone.total <= 1}
                  style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 4, width: 22, height: 22, cursor: zone.total <= 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: zone.total <= 1 ? 0.3 : 1 }}>
                  <Minus size={12} color="#DC2626" />
                </motion.button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {/* Live Connection Indicator */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "2px 8px", borderRadius: 4,
                background: isLive ? "rgba(22,163,74,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isLive ? "rgba(22,163,74,0.2)" : "rgba(255,255,255,0.06)"}`,
                transition: "all 0.4s ease"
              }}>
                <motion.div
                  animate={isLive ? { opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: isLive ? "#16A34A" : "rgba(255,255,255,0.2)" }}
                />
                <span style={{ color: isLive ? "#16A34A" : "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
                  {isLive ? "HARDWARE LIVE" : "BRIDGE OFFLINE"}
                </span>
              </div>

              {Object.entries(statusConfig).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: v.color }} />
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedZone}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(visibleSpots.length, 5)}, 1fr)`, gap: 6 }}
            >
              {visibleSpots.map((spot, sIdx) => {
                const isSelected = selectedSpot?.id === spot.id;
                const isHover    = hoverSpot === spot.id;
                const c          = statusConfig[spot.status]?.color || "#C9A227";
                // sIdx===0 is the sensor+CV controlled slot
                const isSensorSlot = sIdx === 0;
                return (
                  <motion.div
                    key={spot.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: sIdx * 0.01, ease: EASE }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setSelectedSpot(isSelected ? null : spot)}
                    onMouseEnter={() => setHoverSpot(spot.id)}
                    onMouseLeave={() => setHoverSpot(null)}
                    style={{
                      aspectRatio: "1", borderRadius: 8,
                      border: isSelected ? `2px solid ${c}` : isSensorSlot ? `1px solid ${c}44` : `1px solid ${c}24`,
                      background: isSelected ? `${c}14` : isHover ? `${c}0a` : `${c}06`,
                      cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                      boxShadow: isSelected ? `0 4px 14px rgba(0,0,0,0.5)` : isSensorSlot ? `0 0 8px ${c}18` : "none",
                      transition: "border 0.18s, background 0.18s",
                      position: "relative",
                    }}
                  >
                    {spot.status === "occupied"  && <Car       size={11} style={{ color: c, opacity: 0.8 }} />}
                    {spot.status === "reserved"  && <Lock      size={9}  style={{ color: c, opacity: 0.8 }} />}
                    {spot.status === "error"     && <TriangleAlert size={9} style={{ color: c, opacity: 0.8 }} />}
                    {spot.status === "available" && <div style={{ width: 4, height: 4, borderRadius: "50%", background: c, opacity: 0.5 }} />}
                    <div style={{ color: c, fontSize: 7.5, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", opacity: 0.7 }}>{spot.id}</div>
                    {/* Detection source badges for sensor-controlled slot */}
                    {isSensorSlot && (
                      <div style={{ display: "flex", gap: 2, marginTop: 1 }}>
                        <div style={{
                          fontSize: 5.5, fontWeight: 700, letterSpacing: 0.3,
                          padding: "1px 3px", borderRadius: 3,
                          background: spot._sensorDetected ? "rgba(220,38,38,0.25)" : "rgba(255,255,255,0.05)",
                          color: spot._sensorDetected ? "#FF6B6B" : "rgba(255,255,255,0.2)",
                          border: `1px solid ${spot._sensorDetected ? "rgba(220,38,38,0.3)" : "rgba(255,255,255,0.08)"}`,
                        }}>SN</div>
                        <div style={{
                          fontSize: 5.5, fontWeight: 700, letterSpacing: 0.3,
                          padding: "1px 3px", borderRadius: 3,
                          background: spot._cvDetected ? "rgba(147,51,234,0.25)" : "rgba(255,255,255,0.05)",
                          color: spot._cvDetected ? "#C084FC" : "rgba(255,255,255,0.2)",
                          border: `1px solid ${spot._cvDetected ? "rgba(147,51,234,0.3)" : "rgba(255,255,255,0.08)"}`,
                        }}>CV</div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Spot Detail */}
        <div style={{ background: "#0d0d0d", border: "1px solid rgba(201,162,39,0.08)", borderRadius: 12, padding: "18px" }}>
          <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Spot Detail</div>
          <AnimatePresence mode="wait">
            {selectedSpot ? (() => {
              const cfg  = statusConfig[selectedSpot.status];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={selectedSpot.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <div style={{
                    background: `${cfg.color}0a`, border: `1px solid ${cfg.color}20`,
                    borderRadius: 10, padding: "16px", marginBottom: 14, textAlign: "center",
                  }}>
                    <Icon size={24} style={{ color: cfg.color, marginBottom: 6 }} />
                    <div style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{selectedSpot.id}</div>
                    <div style={{
                      display: "inline-flex", marginTop: 6,
                      background: `${cfg.color}10`, border: `1px solid ${cfg.color}22`,
                      padding: "3px 12px", borderRadius: 20,
                      color: cfg.color, fontSize: 9, fontWeight: 600, letterSpacing: 1,
                    }}>{cfg.label.toUpperCase()}</div>
                  </div>
                  {[
                    { label: "Zone",   val: zone.name },
                    { label: "Status", val: cfg.label  },
                    // Detection source rows — only for the sensor-controlled slot (X-01)
                    ...(selectedSpot._sensorDetected !== undefined ? [
                      { label: "Sensor",    val: selectedSpot._sensorDetected ? "Detected ▲" : "Clear" },
                      { label: "CV Detect", val: selectedSpot._cvDetected     ? "Detected ▲" : "Clear" },
                    ] : []),
                    ...(selectedSpot.plate   ? [{ label: "Plate",   val: selectedSpot.plate   }, { label: "Since",   val: selectedSpot.since   }] : []),
                    ...(selectedSpot.reservedBy ? [{ label: "Reserved By", val: selectedSpot.reservedBy }, { label: "Until", val: selectedSpot.until }] : []),
                  ].map((r, i) => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 11 }}>{r.label}</span>
                      <span style={{
                        color: r.label === "Sensor" || r.label === "CV Detect"
                          ? (r.val.startsWith("Detected") ? "#DC2626" : "#16A34A")
                          : "rgba(255,255,255,0.65)",
                        fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: (r.label === "Sensor" || r.label === "CV Detect") ? 600 : 400,
                      }}>{r.val}</span>
                    </div>
                  ))}
                </motion.div>
              );
            })() : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: "center", color: "rgba(212,175,55,0.18)", paddingTop: 50 }}>
                <Info size={28} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 11 }}>Click a spot<br />to view details</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}