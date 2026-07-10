import React, { useState, useEffect } from "react";
import { useKpiData, useParkingZones, useRecentAlerts } from "../hooks/useFirebaseData";
import { LayoutGrid, Car, CircleCheck, Wallet, TrendingUp, Clock, MapPin, Bell, ChevronRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ── Royal animation presets ──────────────────────────────────────
const EASE = [0.4, 0, 0.2, 1];
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

const iconMap = { grid: LayoutGrid, car: Car, check: CircleCheck, wallet: Wallet };
const alertColors = { warning: "#C9A227", info: "#8B6914", success: "#16A34A", error: "#DC2626", maintenance: "#C9A227" };
const statusColor  = { occupied: "#DC2626", available: "#16A34A", reserved: "#9333EA" };

export default function HomePage({ setPage }) {
  const { data: kpiData,      loading: loadKpi   } = useKpiData();
  const { data: parkingZones, loading: loadZones } = useParkingZones();
  const { data: recentAlerts, loading: loadAlerts} = useRecentAlerts();

  if (loadKpi || loadZones || loadAlerts) return (
    <div style={{ color: "rgba(212,175,55,0.3)", textAlign: "center", paddingTop: 60, fontSize: 12 }}>
      Loading…
    </div>
  );

  const totalOccupied = parkingZones.reduce((a, z) => a + z.spots.filter(s => s.status === "occupied").length, 0);
  const totalSpots    = parkingZones.reduce((a, z) => a + z.total, 0);
  const totalAvail    = parkingZones.reduce((a, z) => a + z.spots.filter(s => s.status === "available").length, 0);
  const pct           = totalSpots > 0 ? Math.round((totalOccupied / totalSpots) * 100) : 0;

  const dynamicKpis = [
    { label: "Total Slots",    value: String(totalSpots),    sub: `${parkingZones.length} zones`,  color: "#C9A227", icon: "grid" },
    { label: "Occupied",       value: String(totalOccupied), sub: `${pct}% utilization`,           color: "#DC2626", icon: "car"  },
    { label: "Available",      value: String(totalAvail),    sub: "ready to park",                 color: "#16A34A", icon: "check"},
    kpiData[3],
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="visible">

      {/* ── Welcome Banner ── */}
      <motion.div
        variants={fadeUp}
        style={{
          background: "linear-gradient(135deg, rgba(201,162,39,0.05) 0%, rgba(139,105,20,0.07) 100%)",
          border: "1px solid rgba(201,162,39,0.12)",
          borderRadius: 12, padding: "18px 22px", marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A" }} />
            <span style={{ color: "#16A34A", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>LIVE MONITORING</span>
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>Good morning, Admin</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>
            {totalOccupied} of {totalSpots} slots occupied · {totalAvail} available
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setPage("parking")}
            style={{
              padding: "8px 16px", borderRadius: 8,
              border: "1px solid rgba(201,162,39,0.2)",
              background: "rgba(201,162,39,0.06)", color: "#C9A227",
              fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
            }}
          >View Grid</button>
          <button
            onClick={() => setPage("analytics")}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg, #C9A227, #7A5C10)",
              color: "#000", fontSize: 12, cursor: "pointer", fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
              transition: "opacity 0.2s",
            }}
          >Analytics →</button>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div variants={container} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {dynamicKpis.map((k, i) => {
          if (!k) return null;
          const Icon = iconMap[k.icon] || LayoutGrid;
          return (
            <motion.div
              key={k.label}
              variants={fadeUp}
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
              transition={{ duration: 0.22, ease: EASE }}
              style={{
                background: "#0d0d0d", border: "1px solid rgba(201,162,39,0.08)",
                borderRadius: 12, padding: "16px 18px",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${k.color}60, transparent)`,
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `${k.color}12`, border: `1px solid ${k.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={14} style={{ color: k.color }} />
                </div>
                <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, letterSpacing: 1 }}>{k.label.toUpperCase()}</span>
              </div>
              <div style={{ color: "#FFFFFF", fontSize: 26, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
              <div style={{ color: k.color, fontSize: 11, marginTop: 3, opacity: 0.8 }}>{k.sub}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Main Grid ── */}
      <motion.div variants={container} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>

        {/* Live Parking Overview */}
        <motion.div variants={fadeUp} style={{
          background: "#0d0d0d", border: "1px solid rgba(201,162,39,0.08)",
          borderRadius: 12, padding: "18px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}>Live Parking Overview</div>
            <div style={{ display: "flex", gap: 10 }}>
              {Object.entries(statusColor).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: v }} />
                  <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, textTransform: "capitalize" }}>{k}</span>
                </div>
              ))}
            </div>
          </div>

          {parkingZones.map((zone, zoneIdx) => {
            const occ  = zone.spots.filter(s => s.status === "occupied").length;
            const zPct = Math.round((occ / zone.total) * 100);
            return (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + zoneIdx * 0.08, ease: EASE }}
                style={{ marginBottom: 14 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 500 }}>{zone.name}</span>
                  <span style={{
                    color: zPct > 70 ? "#DC2626" : zPct > 50 ? "#C9A227" : "#16A34A",
                    fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                  }}>{zPct}% · {occ}/{zone.total}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(zone.spots.length, 5)}, 1fr)`, gap: 3 }}>
                  {zone.spots.slice(0, 5).map((spot, sIdx) => (
                    <motion.div
                      key={spot.id}
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 0.75, scaleY: 1 }}
                      transition={{ duration: 0.3, delay: 0.25 + zoneIdx * 0.08 + sIdx * 0.015, ease: EASE }}
                      style={{
                        height: 7, borderRadius: 2,
                        background: statusColor[spot.status] || "#1a1a1a",
                        transformOrigin: "bottom",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Right column */}
        <motion.div variants={container} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Quick Stats */}
          <motion.div variants={fadeUp} style={{
            background: "#0d0d0d", border: "1px solid rgba(201,162,39,0.08)",
            borderRadius: 12, padding: "18px",
          }}>
            <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Quick Stats</div>
            {[
              { icon: Clock,      label: "Peak Hour",    value: "8:00 AM", sub: "Max occupancy",     color: "#C9A227" },
              { icon: MapPin,     label: "Busiest Zone", value: parkingZones[0]?.name || "Zone A", sub: "Most turnover", color: "#C9A227" },
              { icon: TrendingUp, label: "Avg Session",  value: "4.2 hrs", sub: "Vehicle dwell",     color: "#C9A227" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: EASE }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0",
                  borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${s.color}0d`, border: `1px solid ${s.color}16`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <s.icon size={14} style={{ color: s.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 10 }}>{s.label}</div>
                  <div style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
                </div>
                <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 10 }}>{s.sub}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Notifications */}
          <motion.div variants={fadeUp} style={{
            background: "#0d0d0d", border: "1px solid rgba(201,162,39,0.08)",
            borderRadius: 12, padding: "18px", flex: 1,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}>Notifications</div>
              <div style={{
                padding: "2px 8px", borderRadius: 8,
                background: "rgba(201,162,39,0.07)", border: "1px solid rgba(201,162,39,0.16)",
                color: "#C9A227", fontSize: 10, fontWeight: 600,
              }}>{recentAlerts.length}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentAlerts.slice(0, 5).map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.4 + i * 0.06, ease: EASE }}
                  style={{
                    display: "flex", gap: 8, alignItems: "flex-start",
                    padding: "8px 10px", borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: alertColors[a.type] || "#C9A227",
                    marginTop: 5, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{a.msg}</div>
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 1 }}>{a.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}