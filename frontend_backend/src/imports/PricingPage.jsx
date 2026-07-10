import React, { useState, useEffect, useRef } from "react";
import { useParkingZones, useWeeklyPricingTrend, useDailyZonePricing } from "../hooks/useFirebaseData";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, LineController, BarController,
  Title, Tooltip, Legend, Filler
} from "chart.js";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, LineController, BarController,
  Title, Tooltip, Legend, Filler
);

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
};

const tooltipConfig = {
  backgroundColor: "rgba(5,5,5,0.96)",
  borderColor: "rgba(212,175,55,0.15)",
  borderWidth: 1,
  titleColor: "#FFFFFF",
  bodyColor: "rgba(255,255,255,0.7)",
  padding: 12,
  cornerRadius: 8,
  titleFont: { family: "'Inter', sans-serif", size: 12, weight: 600 },
  bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
  displayColors: true,
  boxPadding: 4,
};

function useChart(createConfig, deps = []) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const ctx = canvasRef.current.getContext("2d");
    chartRef.current = new ChartJS(ctx, createConfig());
    return () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, deps);
  return canvasRef;
}

const demandColor = {
  available: "#16A34A", occupied: "#DC2626", reserved: "#9333EA", error: "#D4AF37"
};

const zonePricingFallback = [
  { id: "A", name: "Zone Alpha", price: 25, demand: "low" },
  { id: "B", name: "Zone Beta",  price: 60, demand: "high" },
  { id: "C", name: "Zone Gamma", price: 40, demand: "medium" },
];

export default function PricingPage() {
  const { data: parkingZones, loading: lZon } = useParkingZones();
  const { data: weeklyPricingTrend, loading: lWpt } = useWeeklyPricingTrend();
  const { data: dailyZonePricing, loading: lDzp } = useDailyZonePricing();
  
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const getPriceColor = (price) => {
    if (price > 50) return "#DC2626";
    if (price < 30) return "#16A34A";
    return "#D4AF37";
  };

  const tickStyle = { color: "rgba(255,255,255,0.4)", font: { size: 10, family: "'JetBrains Mono'" } };
  const gridStyle = { color: "rgba(212,175,55,0.05)" };

  const rawZones = parkingZones[0]?.price !== undefined ? parkingZones : zonePricingFallback;
  const zoneOrder = ["A", "B", "C"];
  const pricingZones = [...rawZones].sort(
    (a, b) => zoneOrder.indexOf(a.id) - zoneOrder.indexOf(b.id)
  );

  const lineRef = useChart(() => ({
    type: "line",
    data: {
      labels: weeklyPricingTrend.labels,
      datasets: [
        {
          label: "Zone A", data: weeklyPricingTrend.zoneA,
          borderColor: "#16A34A",
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
            g.addColorStop(0, "rgba(22,163,74,0.1)");
            g.addColorStop(1, "rgba(22,163,74,0.0)");
            return g;
          },
          borderWidth: 2.5, tension: 0.4, fill: true,
          pointRadius: 4, pointBackgroundColor: "#16A34A",
          pointBorderColor: "#FFFFFF", pointBorderWidth: 2,
          pointHoverRadius: 7, pointHoverBorderColor: "#FFFFFF",
        },
        {
          label: "Zone B", data: weeklyPricingTrend.zoneB,
          borderColor: "#DC2626",
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
            g.addColorStop(0, "rgba(220,38,38,0.08)");
            g.addColorStop(1, "rgba(220,38,38,0.0)");
            return g;
          },
          borderWidth: 2.5, tension: 0.4, fill: true,
          pointRadius: 4, pointBackgroundColor: "#DC2626",
          pointBorderColor: "#FFFFFF", pointBorderWidth: 2,
          pointHoverRadius: 7, pointHoverBorderColor: "#FFFFFF",
        },
        {
          label: "Zone C", data: weeklyPricingTrend.zoneC,
          borderColor: "#D4AF37",
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
            g.addColorStop(0, "rgba(212,175,55,0.08)");
            g.addColorStop(1, "rgba(212,175,55,0.0)");
            return g;
          },
          borderWidth: 2.5, tension: 0.4, fill: true,
          pointRadius: 4, pointBackgroundColor: "#D4AF37",
          pointBorderColor: "#FFFFFF", pointBorderWidth: 2,
          pointHoverRadius: 7, pointHoverBorderColor: "#FFFFFF",
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1200, easing: "easeOutQuart", delay: (ctx) => ctx.dataIndex * 80 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { color: "rgba(255,255,255,0.45)", font: { size: 10 }, usePointStyle: true, pointStyle: "circle", padding: 16 },
        },
        tooltip: tooltipConfig,
      },
      scales: {
        x: { ticks: tickStyle, grid: gridStyle, border: { color: "rgba(212,175,55,0.05)" } },
        y: { ticks: tickStyle, grid: gridStyle, border: { color: "rgba(212,175,55,0.05)" } },
      },
    },
  }), [weeklyPricingTrend]);

  const barRef = useChart(() => ({
    type: "bar",
    data: {
      labels: dailyZonePricing.labels,
      datasets: [
        {
          label: "Morning", data: dailyZonePricing.morning,
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
            g.addColorStop(0, "rgba(212,175,55,0.75)");
            g.addColorStop(1, "rgba(212,175,55,0.2)");
            return g;
          },
          borderRadius: 6, borderSkipped: false,
        },
        {
          label: "Afternoon", data: dailyZonePricing.afternoon,
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
            g.addColorStop(0, "rgba(220,38,38,0.65)");
            g.addColorStop(1, "rgba(220,38,38,0.15)");
            return g;
          },
          borderRadius: 6, borderSkipped: false,
        },
        {
          label: "Evening", data: dailyZonePricing.evening,
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
            g.addColorStop(0, "rgba(139,105,20,0.8)");
            g.addColorStop(1, "rgba(139,105,20,0.2)");
            return g;
          },
          borderRadius: 6, borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1000, easing: "easeOutQuart", delay: (ctx) => ctx.dataIndex * 120 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { color: "rgba(255,255,255,0.45)", font: { size: 10 }, usePointStyle: true, pointStyle: "rectRounded", padding: 16 },
        },
        tooltip: tooltipConfig,
      },
      scales: {
        x: { ticks: tickStyle, grid: gridStyle, border: { color: "rgba(212,175,55,0.05)" } },
        y: { ticks: tickStyle, grid: gridStyle, border: { color: "rgba(212,175,55,0.05)" } },
      },
    },
  }), [dailyZonePricing]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">

      {/* ═══ Header ═══ */}
      <motion.div
        variants={itemVariants}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 24, paddingBottom: 18,
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <motion.div
              animate={{ boxShadow: ["0 0 4px #D4AF37", "0 0 14px #D4AF37", "0 0 4px #D4AF37"] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4AF37" }}
            />
            <span style={{ color: "#D4AF37", fontSize: 11, fontWeight: 500, letterSpacing: 1 }}>SYSTEM ACTIVE</span>
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700 }}>Pricing Monitoring</div>
          <div style={{ color: "rgba(212,175,55,0.4)", fontSize: 12 }}>Smart Parking · Real-time Dynamic Pricing</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, fontFamily: "'JetBrains Mono', monospace" }}>{time}</div>
          <div style={{ color: "rgba(212,175,55,0.3)", fontSize: 10, marginTop: 2 }}>Auto-refresh</div>
        </div>
      </motion.div>

      {/* ═══ Main Grid ═══ */}
      <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>

        {/* Zone Pricing Panel */}
        <motion.div
          whileHover={{ scale: 1.005 }}
          style={{
            background: "#0d0d0d", border: "1px solid rgba(212,175,55,0.1)",
            borderRadius: 14, padding: "22px",
          }}
        >
          <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Live Zone Pricing</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {pricingZones.map((zone, idx) => {
              const color = getPriceColor(zone.price);
              const maxPrice = 80;
              const pct = Math.round((zone.price / maxPrice) * 100);
              return (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.12 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{zone.name}</span>
                    <motion.span
                      animate={{ textShadow: [`0 0 8px ${color}40`, `0 0 16px ${color}80`, `0 0 8px ${color}40`] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ color, fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}
                    >₹{zone.price}</motion.span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.2, delay: 0.4 + idx * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ height: "100%", borderRadius: 4, background: color, boxShadow: `0 0 14px ${color}50` }}
                    />
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 6 }}>
                    Demand: <span style={{ color, textTransform: "capitalize", fontWeight: 500 }}>{zone.demand}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Slot Status Grid */}
        <motion.div
          whileHover={{ scale: 1.003 }}
          style={{
            background: "#0d0d0d", border: "1px solid rgba(212,175,55,0.1)",
            borderRadius: 14, padding: "22px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600 }}>Slot Status & Pricing</div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                padding: "4px 12px", borderRadius: 8,
                background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.18)",
                color: "#D4AF37", fontSize: 10, fontWeight: 600, letterSpacing: 1,
              }}
            >LIVE</motion.div>
          </div>

          <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
            {[
              { label: "Available", color: "#16A34A" },
              { label: "Occupied",  color: "#DC2626" },
              { label: "Reserved",  color: "#9333EA" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 3, background: l.color, boxShadow: `0 0 6px ${l.color}40` }} />
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{l.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {parkingZones.flatMap(z => z.spots).map((slot, idx) => {
              const color = demandColor[slot.status] || "#D4AF37";
              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.2 + idx * 0.04, ease: "easeOut" }}
                  whileHover={{ scale: 1.08, boxShadow: `0 0 20px ${color}30, inset 0 0 12px ${color}10` }}
                  style={{
                    height: 72, borderRadius: 10,
                    border: `1px solid ${color}30`,
                    boxShadow: `0 0 12px ${color}10, inset 0 0 8px ${color}05`,
                    background: `${color}07`,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    cursor: "default",
                  }}
                >
                  <span style={{ color, fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{slot.id}</span>
                  <span style={{ color, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2, opacity: 0.7 }}>{slot.status === "error" ? "offline" : slot.status}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* ═══ Demand Cards ═══ */}
      <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
        {[
          { 
            label: "Zone A Pricing",   
            value: "Zone A", 
            sub: `₹${pricingZones.find(z=>z.id==="A")?.price || 40}/hr · ${Math.round(((parkingZones.find(z=>z.id==="A")?.spots.filter(s=>s.status==="occupied").length || 0) / 5) * 100)}% occupied`, 
            color: "#D4AF37", 
            Icon: TrendingUp 
          },
          { 
            label: "Peak Demand Zone", 
            value: [...pricingZones].sort((a,b)=>b.price - a.price)[0]?.name || "Zone B", 
            sub: `₹${[...pricingZones].sort((a,b)=>b.price - a.price)[0]?.price || 60}/hr · High demand`, 
            color: "#DC2626", 
            Icon: TrendingUp 
          },
          { 
            label: "Low Demand Zone",  
            value: [...pricingZones].sort((a,b)=>a.price - b.price)[0]?.name || "Zone C", 
            sub: `₹${[...pricingZones].sort((a,b)=>a.price - b.price)[0]?.price || 25}/hr · Low demand`, 
            color: "#16A34A", 
            Icon: TrendingDown 
          },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            style={{
              background: "#0d0d0d", border: `1px solid ${c.color}18`,
              borderRadius: 14, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 14,
              cursor: "default",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${c.color}12`, border: `1px solid ${c.color}22`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <c.Icon size={18} style={{ color: c.color }} />
            </div>
            <div>
              <div style={{ color: "rgba(212,175,55,0.4)", fontSize: 10, letterSpacing: 1 }}>{c.label.toUpperCase()}</div>
              <div style={{ color: c.color, fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{c.value}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 2 }}>{c.sub}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ Charts ═══ */}
      <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <motion.div
          whileHover={{ scale: 1.005 }}
          style={{ background: "#0d0d0d", border: "1px solid rgba(212,175,55,0.1)", borderRadius: 14, padding: "22px" }}
        >
          <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Weekly Pricing Trend</div>
          <div style={{ color: "rgba(212,175,55,0.4)", fontSize: 11, marginBottom: 16 }}>Price per hour by zone</div>
          <div style={{ position: "relative", height: 240 }}>
            <canvas ref={lineRef} />
          </div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.005 }}
          style={{ background: "#0d0d0d", border: "1px solid rgba(212,175,55,0.1)", borderRadius: 14, padding: "22px" }}
        >
          <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Zone-wise Daily Pricing</div>
          <div style={{ color: "rgba(212,175,55,0.4)", fontSize: 11, marginBottom: 16 }}>By time of day</div>
          <div style={{ position: "relative", height: 240 }}>
            <canvas ref={barRef} />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
