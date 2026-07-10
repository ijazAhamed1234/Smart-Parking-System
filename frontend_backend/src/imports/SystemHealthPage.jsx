import React, { useState, useEffect } from "react";
import { useSensorZones, useSystemAlerts } from "../hooks/useFirebaseData";
import { Wifi, WifiOff, AlertTriangle, Activity, Server, Radio, Clock, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const EASE = [0.4, 0, 0.2, 1];
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };
const SENSOR_STALE_MS = 60000;

function StatusBadge({ status }) {
  const cfg = {
    online:  { bg: "rgba(22,163,74,0.07)",   border: "rgba(22,163,74,0.16)",   color: "#16A34A", label: "Online"  },
    offline: { bg: "rgba(220,38,38,0.07)",   border: "rgba(220,38,38,0.16)",   color: "#DC2626", label: "Offline" },
    warning: { bg: "rgba(201,162,39,0.07)",  border: "rgba(201,162,39,0.16)",  color: "#C9A227", label: "Warning" },
  }[status] || { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", label: status || "Unknown" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 20,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: 11, fontWeight: 500,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", display: "inline-block", background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function HealthDot({ health }) {
  const c = { good: "#16A34A", warn: "#C9A227", bad: "#DC2626" }[health] || "#DC2626";
  return <div style={{ width: 9, height: 9, borderRadius: "50%", background: c, boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }} />;
}

export default function SystemHealthPage() {
  const { data: sensorZones, loading: loadingZones } = useSensorZones();
  const { data: systemAlerts, loading: loadingAlerts } = useSystemAlerts();
  const [activeZone, setActiveZone] = useState("A");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (loadingZones || loadingAlerts) return (
    <div style={{ color: "rgba(212,175,55,0.35)", textAlign: "center", paddingTop: 80, fontSize: 13 }}>
      Connecting to Firebase…
    </div>
  );

  const allSensors = sensorZones.flatMap(z => z.sensors);
  const totalOnline = allSensors.filter(s => s.status === "online").length;
  const totalOffline = allSensors.filter(s => s.status === "offline").length;
  const totalWarning = allSensors.filter(s => s.status === "warning").length;
  const totalSensors = allSensors.length;

  const activeZoneData = sensorZones.find(z => z.id === activeZone);

  const severityColor = {
    critical: "#DC2626", warning: "#D4AF37", info: "#8B6914",
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 18, paddingBottom: 14,
        borderBottom: "1px solid rgba(212,175,55,0.07)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Activity size={13} style={{ color: "#C9A227" }} />
            <span style={{ color: "#C9A227", fontSize: 10, fontWeight: 500, letterSpacing: 1 }}>SYSTEM MONITORING</span>
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700 }}>System Health</div>
          <div style={{ color: "rgba(212,175,55,0.4)", fontSize: 12 }}>Real-time IoT Sensor Network Status</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            color: "rgba(255,255,255,0.5)", fontSize: 16,
            fontFamily: "'JetBrains Mono', monospace",
          }}>{time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
          <div style={{ color: "rgba(212,175,55,0.3)", fontSize: 10, marginTop: 2 }}>Auto-refresh every 5s</div>
        </div>
      </motion.div>

      {/* Sensor Status Cards */}
      <motion.div variants={container} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Sensors", value: totalSensors, color: "rgba(212,175,55,0.5)", Icon: Server, bg: "rgba(212,175,55,0.03)" },
          { label: "Online",        value: totalOnline,  color: "#16A34A", Icon: Wifi,        bg: "rgba(22,163,74,0.05)" },
          { label: "Offline",       value: totalOffline, color: "#DC2626", Icon: WifiOff,     bg: "rgba(220,38,38,0.05)" },
          { label: "Warnings",      value: totalWarning, color: "#D4AF37", Icon: AlertTriangle, bg: "rgba(212,175,55,0.05)" },
        ].map((s) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            whileHover={{ scale: 1.03, y: -3, boxShadow: `0 6px 24px ${s.color}12` }}
            style={{
              background: "#0d0d0d", border: `1px solid ${s.color}18`,
              borderRadius: 14, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 14,
              cursor: "default",
            }}
          >
            <motion.div
              whileHover={{ rotate: 8, scale: 1.1 }}
              style={{
                width: 42, height: 42, borderRadius: 12,
                background: s.bg, border: `1px solid ${s.color}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <s.Icon size={18} style={{ color: s.color }} />
            </motion.div>
            <div>
              <div style={{ color: "rgba(212,175,55,0.4)", fontSize: 10, letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
              <div style={{
                color: s.color, fontSize: 28, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}>{s.value}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Zone Tabs */}
      <motion.div
        variants={fadeUp}
        style={{
          display: "flex", gap: 0, marginBottom: 20,
          background: "rgba(212,175,55,0.03)",
          border: "1px solid rgba(212,175,55,0.1)",
          borderRadius: 12, padding: 4,
          position: "relative",
        }}
      >
        {sensorZones.map(zone => {
          const active = activeZone === zone.id;
          const online = zone.sensors.filter(s => s.status === "online").length;
          const offline = zone.sensors.filter(s => s.status === "offline").length;
          return (
            <motion.button
              key={zone.id}
              whileHover={{ background: active ? `${zone.color}12` : "rgba(212,175,55,0.03)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveZone(zone.id)}
              style={{
                flex: 1, padding: "12px 20px", borderRadius: 10, border: "none",
                background: active ? `${zone.color}12` : "rgba(0,0,0,0)",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 12,
                transition: "background 0.2s",
                boxShadow: active ? `inset 0 0 0 1px ${zone.color}28` : "none",
                position: "relative",
              }}
            >
              {active && (
                <motion.div
                  layoutId="healthZoneIndicator"
                  style={{
                    position: "absolute", bottom: 2, left: "20%", right: "20%", height: 2,
                    background: zone.color, borderRadius: 1,
                    boxShadow: `0 0 8px ${zone.color}60`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={active ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: active ? `${zone.color}22` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? zone.color + "44" : "rgba(212,175,55,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: active ? zone.color : "rgba(255,255,255,0.2)",
                  fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                }}
              >{zone.symbol}</motion.div>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  color: active ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 12, fontWeight: active ? 600 : 400,
                }}>{zone.name}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <span style={{
                    color: active ? "#16A34A" : "rgba(255,255,255,0.15)",
                    fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  }}>{online} on</span>
                  <span style={{
                    color: active ? "#DC2626" : "rgba(255,255,255,0.15)",
                    fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  }}>{offline} off</span>
                </div>
              </div>
              {active && (
                <motion.div
                  animate={{ boxShadow: [`0 0 4px ${zone.color}`, `0 0 12px ${zone.color}`, `0 0 4px ${zone.color}`] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: zone.color,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Sensor Table */}
        <motion.div
          whileHover={{ boxShadow: "0 4px 30px rgba(212,175,55,0.05)" }}
          style={{
            background: "#0d0d0d", border: "1px solid rgba(212,175,55,0.1)",
            borderRadius: 14, overflow: "hidden",
          }}
        >
          <div style={{
            padding: "18px 22px",
            borderBottom: "1px solid rgba(212,175,55,0.08)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600 }}>
              {activeZoneData.name} Sensors
            </div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                padding: "4px 12px", borderRadius: 8,
                background: `${activeZoneData.color}09`,
                border: `1px solid ${activeZoneData.color}18`,
                color: activeZoneData.color, fontSize: 10, fontWeight: 600,
              }}
            >LIVE</motion.div>
          </div>

          {/* Table Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 60px",
            padding: "10px 22px",
            background: "rgba(212,175,55,0.03)",
            borderBottom: "1px solid rgba(212,175,55,0.06)",
          }}>
            {["Sensor ID", "Status", "Last Updated", "Latency", "Health"].map(h => (
              <div key={h} style={{
                color: "rgba(212,175,55,0.35)", fontSize: 10, fontWeight: 600,
                letterSpacing: 1, textTransform: "uppercase",
              }}>{h}</div>
            ))}
          </div>

          {/* Table Rows */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeZone}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {activeZoneData.sensors.map((sensor, i) => {
                const hasTime = !!sensor.lastUpdated;
                const age = time.getTime() - (sensor.lastUpdated || 0);

                // Hardware detections are usually pushed on state change, not every second.
                // Use a longer stale threshold to avoid false offline status.
                const isStale = hasTime && age > SENSOR_STALE_MS;
                const firebaseOffline = sensor.status === "offline";
                const isOffline = firebaseOffline || isStale;

                const currentStatus = isOffline ? "offline" : (sensor.status === "warning" ? "warning" : "online");
                const currentHealth = isOffline ? "bad" : (sensor.health || "good");
                
                let updatedDisplay = sensor.updated;
                if (hasTime) {
                  if (age < 5000) updatedDisplay = "just now";
                  else if (age < 15000) updatedDisplay = "a few secs ago";
                  else if (age < 60000) updatedDisplay = `${Math.floor(age/1000)}s ago`;
                  else updatedDisplay = `${Math.floor(age/60000)}m ago`;
                }

                return (
                <motion.div
                  key={sensor.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ background: `${activeZoneData.color}06` }}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 60px",
                    padding: "12px 22px", alignItems: "center",
                    borderBottom: i < activeZoneData.sensors.length - 1 ? "1px solid rgba(212,175,55,0.04)" : "none",
                    cursor: "default",
                    background: "transparent",
                  }}
                >
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {sensor.id}
                    {sensor.id.startsWith("HW-") && (
                      <span style={{ fontSize: 7, background: "rgba(212,175,55,0.15)", color: "#D4AF37", padding: "1px 4px", borderRadius: 3, border: "1px solid rgba(212,175,55,0.2)" }}>BRIDGE</span>
                    )}
                  </div>
                  <div><StatusBadge status={currentStatus} /></div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{updatedDisplay}</div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                    color: (sensor.latency && !isOffline)
                      ? sensor.latency > 100 ? "#DC2626" : sensor.latency > 50 ? "#D4AF37" : "#16A34A"
                      : "rgba(255,255,255,0.15)",
                  }}>
                    {(sensor.latency && !isOffline) ? `${sensor.latency}ms` : "—"}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <HealthDot health={currentHealth} />
                  </div>
                </motion.div>
                )})}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Alerts Panel */}
        <motion.div
          whileHover={{ boxShadow: "0 4px 30px rgba(220,38,38,0.04)" }}
          style={{
            background: "#0d0d0d", border: "1px solid rgba(212,175,55,0.1)",
            borderRadius: 14, padding: "22px",
          }}
        >
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 16,
          }}>
            <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600 }}>System Alerts</div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                padding: "3px 10px", borderRadius: 12,
                background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)",
                color: "#DC2626", fontSize: 10, fontWeight: 600,
              }}
            >{systemAlerts.filter(a => a.severity === "critical").length} critical</motion.div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {systemAlerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.3 + i * 0.06 }}
                whileHover={{ x: 4, background: `${severityColor[alert.severity]}08` }}
                style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: `${severityColor[alert.severity]}05`,
                  border: `1px solid ${severityColor[alert.severity]}12`,
                  cursor: "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <motion.div
                    animate={{
                      boxShadow: [
                        `0 0 4px ${severityColor[alert.severity]}40`,
                        `0 0 10px ${severityColor[alert.severity]}80`,
                        `0 0 4px ${severityColor[alert.severity]}40`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: severityColor[alert.severity],
                      marginTop: 5, flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{alert.msg}</div>
                    <div style={{
                      display: "flex", justifyContent: "space-between", marginTop: 4,
                    }}>
                      <span style={{
                        color: severityColor[alert.severity], fontSize: 10,
                        textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 500,
                      }}>{alert.severity}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{alert.time}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Hardware Diagnostics */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            whileHover={{ borderColor: "rgba(212,175,55,0.15)" }}
            style={{
              marginTop: 16, padding: "16px", borderRadius: 10,
              background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ color: "rgba(212,175,55,0.5)", fontSize: 10, letterSpacing: 1 }}>HARDWARE DIAGNOSTICS</div>
              <Activity size={12} style={{ color: "rgba(212,175,55,0.3)" }} />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Sensor Detection A */}
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Ultrasonic (Zone A)</span>
                  <span style={{ color: sensorZones[0]?.sensors[0]?.status === "online" ? "#16A34A" : "#DC2626", fontSize: 10, fontWeight: 700 }}>
                    {sensorZones[0]?.sensors[0]?.status === "online" ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                  <motion.div 
                    animate={sensorZones[0]?.sensors[0]?.status === "online" ? { width: ["10%", "100%", "10%"] } : { width: "0%" }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ height: "100%", background: "#16A34A", opacity: 0.4 }}
                  />
                </div>
              </div>

              {/* CV Detection A */}
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>CV Confidence (Zone A)</span>
                  <span style={{ color: "#C084FC", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    98.4%
                  </span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "98.4%" }}
                    style={{ height: "100%", background: "#C084FC", opacity: 0.6 }}
                  />
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(212,175,55,0.05)", margin: "4px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Signal Strength</span>
                <span style={{ color: "#16A34A", fontSize: 10, fontWeight: 600 }}>-42 dBm</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Bridge Latency</span>
                <span style={{ color: "#D4AF37", fontSize: 10, fontWeight: 600 }}>12ms</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
