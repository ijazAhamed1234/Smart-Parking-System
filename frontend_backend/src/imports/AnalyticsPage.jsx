import React, { useEffect, useRef, useState } from "react";
import { useParkingZones } from "../hooks/useFirebaseData";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement,
  LineController, BarController, DoughnutController,
  Title, Tooltip, Legend, Filler
} from "chart.js";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Car, CircleCheck, Lock, Zap } from "lucide-react";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement,
  LineController, BarController, DoughnutController,
  Title, Tooltip, Legend, Filler
);

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const tooltipConfig = {
  backgroundColor: "rgba(5,5,5,0.96)",
  borderColor: "rgba(212,175,55,0.15)",
  borderWidth: 1,
  titleColor: "#FFFFFF",
  bodyColor: "rgba(255,255,255,0.7)",
  padding: 12, cornerRadius: 8,
  titleFont: { family: "'Inter', sans-serif", size: 12, weight: 600 },
  bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
  displayColors: true, boxPadding: 4,
};

const tickStyle = { color: "rgba(255,255,255,0.4)", font: { size: 10, family: "'JetBrains Mono'" } };
const gridStyle = { color: "rgba(212,175,55,0.05)" };
const borderStyle = { color: "rgba(212,175,55,0.05)" };

function GlassCard({ title, sub, badge, children, style = {} }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.005 }}
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(212,175,55,0.1)",
        borderRadius: 14, padding: "22px",
        position: "relative", overflow: "hidden",
        ...style,
      }}
    >
      <div style={{
        position: "absolute", top: -40, right: -40, width: 120, height: 120,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600 }}>{title}</div>
          {sub && <div style={{ color: "rgba(212,175,55,0.4)", fontSize: 11, marginTop: 2 }}>{sub}</div>}
        </div>
        {badge && (
          <div style={{
            padding: "3px 9px", borderRadius: 8,
            background: badge === "LIVE" ? "rgba(22,163,74,0.06)" : "rgba(201,162,39,0.06)",
            border: badge === "LIVE" ? "1px solid rgba(22,163,74,0.14)" : "1px solid rgba(201,162,39,0.14)",
            color: badge === "LIVE" ? "#16A34A" : "#C9A227",
            fontSize: 10, fontWeight: 600, letterSpacing: 1,
          }}>{badge}</div>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { data: parkingZones, loading } = useParkingZones();
  const [tick, setTick] = useState(0);

  // Re-render every 5s to keep "live" feel
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 5000);
    return () => clearInterval(t);
  }, []);

  // ── Derive metrics (safe defaults when loading) ──────────────
  const zones         = loading ? [] : parkingZones;
  const totalSpots    = zones.reduce((a, z) => a + z.total, 0);
  const totalOccupied = zones.reduce((a, z) => a + z.spots.filter(s => s.status === "occupied").length, 0);
  const totalAvail    = zones.reduce((a, z) => a + z.spots.filter(s => s.status === "available").length, 0);
  const totalReserved = zones.reduce((a, z) => a + z.spots.filter(s => s.status === "reserved").length, 0);
  const pct           = totalSpots > 0 ? Math.round((totalOccupied / totalSpots) * 100) : 0;
  const availPct      = totalSpots > 0 ? Math.round((totalAvail / totalSpots) * 100) : 0;

  const zoneLabels   = zones.map(z => z.name);
  const zoneOccupied = zones.map(z => z.spots.filter(s => s.status === "occupied").length);
  const zoneAvail    = zones.map(z => z.spots.filter(s => s.status === "available").length);
  const zoneReserved = zones.map(z => z.spots.filter(s => s.status === "reserved").length);
  const zonePct      = zones.map(z => {
    const occ = z.spots.filter(s => s.status === "occupied").length;
    return z.total > 0 ? Math.round((occ / z.total) * 100) : 0;
  });
  const busiestZoneIdx = zonePct.length ? zonePct.indexOf(Math.max(...zonePct)) : 0;

  // ── Chart refs — ALL hooks called unconditionally before any return ──
  const zoneBarRef = useRef(null);
  const doughRef   = useRef(null);
  const zonePctRef = useRef(null);

  const zoneBarChart = useRef(null);
  const doughChart   = useRef(null);
  const zonePctChart = useRef(null);

  // Zone breakdown bar chart
  useEffect(() => {
    if (!zoneBarRef.current || zones.length === 0) return;
    if (zoneBarChart.current) zoneBarChart.current.destroy();
    zoneBarChart.current = new ChartJS(zoneBarRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: zoneLabels,
        datasets: [
          { label: "Occupied",  data: zoneOccupied, backgroundColor: "rgba(220,38,38,0.7)",   borderRadius: 6, borderSkipped: false },
          { label: "Available", data: zoneAvail,    backgroundColor: "rgba(22,163,74,0.7)",    borderRadius: 6, borderSkipped: false },
          { label: "Reserved",  data: zoneReserved, backgroundColor: "rgba(147,51,234,0.6)",  borderRadius: 6, borderSkipped: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 900, easing: "easeOutQuart" },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: "rgba(255,255,255,0.45)", font: { size: 10 }, usePointStyle: true, pointStyle: "rectRounded", padding: 16 } },
          tooltip: tooltipConfig,
        },
        scales: {
          x: { ticks: tickStyle, grid: gridStyle, border: borderStyle },
          y: { ticks: { ...tickStyle, stepSize: 1 }, grid: gridStyle, border: borderStyle, min: 0, beginAtZero: true },
        },
      },
    });
    return () => { if (zoneBarChart.current) { zoneBarChart.current.destroy(); zoneBarChart.current = null; } };
  }, [loading, totalOccupied, totalAvail, totalReserved, tick]);

  // Status doughnut
  useEffect(() => {
    if (!doughRef.current || zones.length === 0) return;
    if (doughChart.current) doughChart.current.destroy();
    doughChart.current = new ChartJS(doughRef.current.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Occupied", "Available", "Reserved"],
        datasets: [{
          data: [totalOccupied, totalAvail, totalReserved],
          backgroundColor: ["rgba(220,38,38,0.75)", "rgba(22,163,74,0.75)", "rgba(147,51,234,0.65)"],
          borderColor: ["#DC262640", "#16A34A40", "#9333EA40"],
          borderWidth: 2,
          hoverBackgroundColor: ["#DC2626", "#16A34A", "#9333EA"],
          hoverBorderColor: "#050505", hoverBorderWidth: 2, hoverOffset: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { animateRotate: true, animateScale: true, duration: 1200, easing: "easeOutQuart" },
        plugins: {
          legend: { position: "bottom", labels: { color: "rgba(255,255,255,0.45)", font: { size: 11 }, padding: 16, usePointStyle: true, pointStyle: "circle" } },
          tooltip: tooltipConfig,
        },
        cutout: "68%",
      },
    });
    return () => { if (doughChart.current) { doughChart.current.destroy(); doughChart.current = null; } };
  }, [loading, totalOccupied, totalAvail, totalReserved, tick]);

  // Zone occupancy % horizontal bar
  useEffect(() => {
    if (!zonePctRef.current || zones.length === 0) return;
    if (zonePctChart.current) zonePctChart.current.destroy();
    zonePctChart.current = new ChartJS(zonePctRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: zoneLabels,
        datasets: [{
          label: "Occupancy %",
          data: zonePct,
          backgroundColor: zonePct.map(p => p > 70 ? "rgba(220,38,38,0.7)" : p > 40 ? "rgba(212,175,55,0.7)" : "rgba(22,163,74,0.7)"),
          borderRadius: 6, borderSkipped: false,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 900, easing: "easeOutQuart" },
        plugins: { legend: { display: false }, tooltip: tooltipConfig },
        scales: {
          x: { ticks: { ...tickStyle, callback: v => `${v}%` }, grid: gridStyle, border: borderStyle, min: 0, max: 100 },
          y: { ticks: tickStyle, grid: { display: false }, border: borderStyle },
        },
      },
    });
    return () => { if (zonePctChart.current) { zonePctChart.current.destroy(); zonePctChart.current = null; } };
  }, [loading, tick, JSON.stringify(zonePct)]);

  // ── Now safe to early-return after all hooks ─────────────────
  if (loading) return (
    <div style={{ color: "rgba(212,175,55,0.3)", textAlign: "center", paddingTop: 60, fontSize: 12 }}>
      Loading…
    </div>
  );

  const heatmapRows = [
    { label: "Occupied",  values: zoneOccupied, color: "#DC2626" },
    { label: "Available", values: zoneAvail,    color: "#16A34A" },
    { label: "Reserved",  values: zoneReserved, color: "#9333EA" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">

      {/* ═══ Live KPI Summary ═══ */}
      <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total Slots",  val: totalSpots,    delta: `${zones.length} zones`,      color: "#D4AF37", Icon: Zap,         up: true },
          { label: "Occupied",     val: totalOccupied, delta: `${pct}% utilization`,         color: "#DC2626", Icon: Car,         up: pct > 50 },
          { label: "Available",    val: totalAvail,    delta: `${availPct}% free`,            color: "#16A34A", Icon: CircleCheck, up: availPct > 50 },
          { label: "Reserved",     val: totalReserved, delta: `${zones.length} zone${zones.length !== 1 ? "s" : ""}`, color: "#9333EA", Icon: Lock, up: false },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            whileHover={{ scale: 1.02, y: -2 }}
            style={{
              background: "#0d0d0d", border: "1px solid rgba(212,175,55,0.09)",
              borderRadius: 12, padding: "16px 18px",
              position: "relative", overflow: "hidden", cursor: "default",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}14`, border: `1px solid ${s.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.Icon size={14} style={{ color: s.color }} />
              </div>
              <span style={{ color: "rgba(212,175,55,0.4)", fontSize: 10, letterSpacing: 1.5 }}>{s.label.toUpperCase()}</span>
            </div>
            <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</div>
            <div style={{ color: s.color, fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {s.delta}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ Live badge ═══ */}
      <motion.div variants={itemVariants} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
        <span style={{ color: "#16A34A", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>LIVE DATA</span>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginLeft: 4 }}>
          Showing real-time status from {zones.length} zone{zones.length !== 1 ? "s" : ""}
        </span>
      </motion.div>

      {/* ═══ Charts Row 1 ═══ */}
      <motion.div variants={containerVariants} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12, marginBottom: 12 }}>
        <GlassCard title="Zone-wise Slot Breakdown" sub="Occupied / Available / Reserved per zone" badge="LIVE">
          <div style={{ position: "relative", height: 240 }}>
            <canvas ref={zoneBarRef} />
          </div>
        </GlassCard>
        <GlassCard title="Overall Slot Status" sub="Distribution across all zones" badge="LIVE">
          <div style={{ position: "relative", height: 240 }}>
            <canvas ref={doughRef} />
          </div>
        </GlassCard>
      </motion.div>

      {/* ═══ Charts Row 2 ═══ */}
      <motion.div variants={containerVariants} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <GlassCard title="Zone Occupancy Rate" sub="% of slots occupied per zone" badge="LIVE">
          <div style={{ position: "relative", height: 200 }}>
            <canvas ref={zonePctRef} />
          </div>
        </GlassCard>

        {/* Zone spotlight */}
        <GlassCard title="Zone Spotlight" sub="Live occupancy per zone">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {zones.map((zone, idx) => {
              const occ = zone.spots.filter(s => s.status === "occupied").length;
              const avl = zone.spots.filter(s => s.status === "available").length;
              const res = zone.spots.filter(s => s.status === "reserved").length;
              const p   = zone.total > 0 ? Math.round((occ / zone.total) * 100) : 0;
              const barColor = p > 70 ? "#DC2626" : p > 40 ? "#D4AF37" : "#16A34A";
              const isBusiest = idx === busiestZoneIdx;
              return (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: isBusiest ? "rgba(212,175,55,0.04)" : "rgba(255,255,255,0.02)",
                    border: isBusiest ? "1px solid rgba(212,175,55,0.15)" : "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}>{zone.name}</span>
                      {isBusiest && (
                        <span style={{ fontSize: 9, color: "#D4AF37", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", padding: "1px 6px", borderRadius: 4, letterSpacing: 1 }}>BUSIEST</span>
                      )}
                    </div>
                    <span style={{ color: barColor, fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{p}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 8 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p}%` }}
                      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ height: "100%", borderRadius: 3, background: barColor, boxShadow: `0 0 8px ${barColor}40` }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[
                      { label: "Occ", val: occ, color: "#DC2626" },
                      { label: "Avl", val: avl, color: "#16A34A" },
                      { label: "Res", val: res, color: "#9333EA" },
                    ].map(s => (
                      <span key={s.label} style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                        <span style={{ color: s.color }}>{s.val}</span>
                        <span style={{ color: "rgba(255,255,255,0.3)" }}> {s.label}</span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* ═══ Slot Status Matrix ═══ */}
      <motion.div variants={itemVariants}>
        <GlassCard title="Slot Status Matrix" sub="Status breakdown by zone (live)" badge="LIVE">
          <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${zones.length}, 1fr)`, gap: 6 }}>
            <div />
            {zones.map(z => (
              <div key={z.id} style={{ textAlign: "center", color: "rgba(212,175,55,0.5)", fontSize: 11, padding: "6px 0", fontWeight: 600, letterSpacing: 0.5 }}>
                {z.name}
              </div>
            ))}
            {heatmapRows.map(row => (
              <React.Fragment key={row.label}>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 3, background: row.color, boxShadow: `0 0 6px ${row.color}60`, flexShrink: 0 }} />
                  {row.label}
                </div>
                {row.values.map((val, i) => {
                  const zone = zones[i];
                  const p    = zone?.total > 0 ? Math.round((val / zone.total) * 100) : 0;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, delay: i * 0.05 }}
                      whileHover={{ scale: 1.06, zIndex: 2 }}
                      style={{
                        background: `${row.color}10`, border: `1px solid ${row.color}20`,
                        borderRadius: 8, padding: "14px 8px", textAlign: "center",
                        cursor: "default",
                        boxShadow: val > 0 ? `0 0 12px ${row.color}15` : "none",
                      }}
                    >
                      <div style={{ color: row.color, fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>{p}% of zone</div>
                    </motion.div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 16 }}>
            {[
              { label: "Occupied",  color: "#DC2626" },
              { label: "Available", color: "#16A34A" },
              { label: "Reserved",  color: "#9333EA" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color, boxShadow: `0 0 6px ${l.color}40` }} />
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

    </motion.div>
  );
}
