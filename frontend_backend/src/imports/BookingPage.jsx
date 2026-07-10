import React, { useState, useEffect } from "react";
import { useParkingZones, useSlotDetection } from "../hooks/useFirebaseData";
import { Car, Lock, Check, Clock, User, MapPin, CreditCard, CalendarCheck, X, TriangleAlert, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { ref, update } from "firebase/database";
import { sendWhatsAppTemplate } from "../hooks/useBookingManager";

const statusConfig = {
  occupied:  { color: "#DC2626", label: "Occupied" },
  available: { color: "#16A34A", label: "Available" },
  reserved:  { color: "#9333EA", label: "Reserved" },
};

const timeSlots = [
  "30 min", "1 hour", "2 hours", "3 hours", "4 hours", "Full Day",
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function BookingPage() {
  const { data: parkingZones, loading } = useParkingZones();
  const { sensorDetection, cvDetection } = useSlotDetection();
  const [selectedZone, setSelectedZone] = useState("A");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [vehicleNo, setVehicleNo] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [isLive, setIsLive] = useState(false);

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

  if (loading) return (
    <div style={{ color: "rgba(212,175,55,0.35)", textAlign: "center", paddingTop: 80, fontSize: 13 }}>
      Connecting to Firebase…
    </div>
  );

  const zone = parkingZones.find(z => z.id === selectedZone);

  const handleBook = async () => {
    if (!selectedSpot || !selectedZone || !selectedTime || !ownerName || !mobileNo) {
      alert("Please fill in all details and select a duration.");
      return;
    }

    // Find the index of the zone and spot in the array structure
    const zoneIndex = parkingZones.findIndex(z => z.id === selectedZone);
    if (zoneIndex === -1) return;
    
    const spotIndex = parkingZones[zoneIndex].spots.findIndex(s => s.id === selectedSpot.id);
    if (spotIndex === -1) return;

    try {
      const totalPrice = getPrice(selectedTime);
      const now = Date.now();
      
      // Calculate duration in ms
      const durationMap = {
        "30 min": 30 * 60 * 1000,
        "1 hour": 60 * 60 * 1000,
        "2 hours": 2 * 60 * 60 * 1000,
        "3 hours": 3 * 60 * 60 * 1000,
        "4 hours": 4 * 60 * 60 * 1000,
        "Full Day": 24 * 60 * 60 * 1000,
      };
      const durationMs = durationMap[selectedTime] || 3600000;

      const updates = {};
      updates[`parkingZones/${zoneIndex}/spots/${spotIndex}/status`] = "reserved";
      updates[`parkingZones/${zoneIndex}/spots/${spotIndex}/ownerName`] = ownerName;
      updates[`parkingZones/${zoneIndex}/spots/${spotIndex}/mobileNo`] = mobileNo;
      updates[`parkingZones/${zoneIndex}/spots/${spotIndex}/plate`] = vehicleNo;
      updates[`parkingZones/${zoneIndex}/spots/${spotIndex}/startTime`] = now;
      updates[`parkingZones/${zoneIndex}/spots/${spotIndex}/durationMs`] = durationMs;
      updates[`parkingZones/${zoneIndex}/spots/${spotIndex}/expiryTime`] = now + durationMs;
      updates[`parkingZones/${zoneIndex}/spots/${spotIndex}/totalPrice`] = totalPrice;

      await update(ref(db), updates);
      
      // Send WhatsApp Confirmation using Template
      const variables = {
        "1": selectedSpot.id,
        "2": selectedTime
      };
      sendWhatsAppTemplate(mobileNo, variables);

      setBookingConfirmed(true);
      setSelectedSpot(null);
      setSelectedTime(null);
      setVehicleNo("");
      setOwnerName("");
      setMobileNo("");
      setTimeout(() => setBookingConfirmed(false), 3000);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Failed to confirm booking. Please try again.");
    }
  };

  const getPrice = (duration) => {
    const base = zone.price;
    const prices = {
      "30 min": Math.round(base * 0.5),
      "1 hour": base,
      "2 hours": Math.round(base * 1.8),
      "3 hours": Math.round(base * 2.5),
      "4 hours": Math.round(base * 3),
      "Full Day": Math.round(base * 8),
    };
    return prices[duration] || base;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      {/* Booking Confirmed Toast */}
      <AnimatePresence>
        {bookingConfirmed && (
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: "fixed", top: 80, right: 28, zIndex: 200,
              background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)",
              borderRadius: 12, padding: "16px 24px",
              display: "flex", alignItems: "center", gap: 12,
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 30px rgba(22,163,74,0.12)",
            }}>
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
              <CalendarCheck size={20} style={{ color: "#16A34A" }} />
            </motion.div>
            <div>
              <div style={{ color: "#16A34A", fontSize: 13, fontWeight: 600 }}>Booking Confirmed!</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                Spot {selectedSpot?.id} reserved successfully
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone Selector */}
      <motion.div variants={fadeUp} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {parkingZones.map((z, idx) => {
          const avail = z.spots.filter(s => s.status === "available").length;
          const active = selectedZone === z.id;
          return (
            <motion.button
              key={z.id}
              whileHover={{ scale: 1.025, y: -3, boxShadow: active ? "0 6px 24px rgba(212,175,55,0.12)" : "0 4px 20px rgba(255,255,255,0.02)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSelectedZone(z.id); setSelectedSpot(null); setSelectedTime(null); }}
              style={{
                flex: 1, textAlign: "left",
                background: active ? "rgba(212,175,55,0.06)" : "#0d0d0d",
                border: active ? "1px solid rgba(212,175,55,0.25)" : "1px solid rgba(212,175,55,0.08)",
                borderRadius: 12, padding: "14px 18px", cursor: "pointer",
                transition: "background 0.25s, border-color 0.25s",
                position: "relative", overflow: "hidden",
              }}>
              {active && (
                <motion.div
                  layoutId="bookingZoneIndicator"
                  style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                    background: "linear-gradient(90deg, #D4AF37, transparent)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div style={{
                color: active ? "#D4AF37" : "rgba(255,255,255,0.35)",
                fontSize: 10, letterSpacing: 1.5, transition: "color 0.2s",
              }}>{z.name.toUpperCase()}</div>
              <div style={{
                color: "#FFFFFF", fontSize: 18, fontWeight: 700, marginTop: 4,
                fontFamily: "'JetBrains Mono', monospace",
              }}>{avail} <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 400 }}>available</span></div>
              <div style={{ color: "rgba(212,175,55,0.4)", fontSize: 11, marginTop: 2 }}>
                ₹{z.price}/hr
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Interactive Parking Grid */}
        <motion.div
          whileHover={{ boxShadow: "0 4px 30px rgba(212,175,55,0.05)" }}
          style={{
            background: "#0d0d0d", border: "1px solid rgba(212,175,55,0.1)",
            borderRadius: 14, padding: "22px",
          }}
        >
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 18,
          }}>
            <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600 }}>Select a Spot</div>
            <div style={{ display: "flex", gap: 10 }}>
              {/* Live Connection Indicator */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "2px 8px", borderRadius: 4,
                marginRight: 10,
                background: isLive ? "rgba(22,163,74,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isLive ? "rgba(22,163,74,0.2)" : "rgba(255,255,255,0.06)"}`,
                transition: "all 0.4s ease"
              }}>
                <motion.div
                  animate={isLive ? { opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: isLive ? "#16A34A" : "rgba(255,255,255,0.2)" }}
                />
                <span style={{ color: isLive ? "#16A34A" : "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 700, letterSpacing: 0.5 }}>
                  {isLive ? "LIVE HARDWARE" : "BRIDGE OFFLINE"}
                </span>
              </div>
              {Object.entries(statusConfig).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: v.color }} />
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedZone}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10,
              }}
            >
              {zone.spots.map((spot, sIdx) => {
                const isSelected = selectedSpot?.id === spot.id;
                const c = statusConfig[spot.status].color;
                const canBook = spot.status === "available";
                const isSensorSlot = sIdx === 0;

                return (
                  <motion.div
                    key={spot.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, delay: sIdx * 0.05, ease: "easeOut" }}
                    whileHover={canBook ? { scale: 1.06, zIndex: 5, boxShadow: `0 8px 24px ${c}28` } : {}}
                    whileTap={canBook ? { scale: 0.94 } : {}}
                    onClick={() => canBook && setSelectedSpot(isSelected ? null : spot)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 12,
                      border: isSelected
                        ? `2px solid ${c}`
                        : isSensorSlot ? `1px solid ${c}44` : `1px solid ${c}28`,
                      background: isSelected
                        ? `${c}18`
                        : canBook ? `${c}08` : `${c}04`,
                      cursor: canBook ? "pointer" : "not-allowed",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 6,
                      boxShadow: isSelected
                        ? `0 6px 20px rgba(0,0,0,0.5), inset 0 0 16px ${c}10`
                        : isSensorSlot ? `0 0 10px ${c}18` : "none",
                      opacity: canBook ? 1 : 0.45,
                      position: "relative",
                      transition: "border 0.2s, background 0.2s",
                    }}
                  >
                    {spot.status === "occupied"  && <Car   size={20} style={{ color: c, opacity: 0.9 }} />}
                    {spot.status === "reserved"  && <Lock  size={18} style={{ color: c, opacity: 0.9 }} />}
                    {spot.status === "available" && isSelected && <Check size={20} style={{ color: c }} />}
                    {spot.status === "available" && !isSelected && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, opacity: 0.5 }} />
                    )}
                    <div style={{
                      color: c, fontSize: 11, fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace", opacity: 0.8,
                      letterSpacing: 0.5,
                    }}>{spot.id}</div>
                    <div style={{
                      color: c, fontSize: 9, opacity: 0.5,
                      textTransform: "uppercase", letterSpacing: 0.5,
                    }}>
                      {spot.status === "occupied" ? "Occupied" : spot.status === "reserved" ? "Reserved" : "Available"}
                    </div>
                    {/* SN/CV source badges on sensor-controlled slot */}
                    {isSensorSlot && (
                      <div style={{ display: "flex", gap: 3, position: "absolute", bottom: 6 }}>
                        <div style={{
                          fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 3,
                          background: spot._sensorDetected ? "rgba(220,38,38,0.25)" : "rgba(255,255,255,0.05)",
                          color: spot._sensorDetected ? "#FF6B6B" : "rgba(255,255,255,0.2)",
                          border: `1px solid ${spot._sensorDetected ? "rgba(220,38,38,0.35)" : "rgba(255,255,255,0.08)"}`,
                        }}>SN</div>
                        <div style={{
                          fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 3,
                          background: spot._cvDetected ? "rgba(147,51,234,0.25)" : "rgba(255,255,255,0.05)",
                          color: spot._cvDetected ? "#C084FC" : "rgba(255,255,255,0.2)",
                          border: `1px solid ${spot._cvDetected ? "rgba(147,51,234,0.35)" : "rgba(255,255,255,0.08)"}`,
                        }}>CV</div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Booking Panel */}
        <motion.div
          whileHover={{ boxShadow: "0 4px 30px rgba(212,175,55,0.04)" }}
          style={{
            background: "#0d0d0d", border: "1px solid rgba(212,175,55,0.1)",
            borderRadius: 14, padding: "22px",
          }}
        >
          <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Book a Spot</div>

          <AnimatePresence mode="wait">
            {selectedSpot ? (
              <motion.div
                key={selectedSpot.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {/* Selected spot info */}
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  style={{
                    background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.12)",
                    borderRadius: 12, padding: "16px", marginBottom: 20, textAlign: "center",
                  }}
                >
                  <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Check size={24} style={{ color: "#16A34A", marginBottom: 6 }} />
                  </motion.div>
                  <div style={{
                    color: "#FFFFFF", fontSize: 22, fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{selectedSpot.id}</div>
                  <div style={{ color: "rgba(212,175,55,0.4)", fontSize: 11, marginTop: 4 }}>
                    {zone.name} · ₹{zone.price}/hr
                  </div>
                </motion.div>

                {/* Owner Name */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.06 }}
                  style={{ marginBottom: 12 }}
                >
                  <label style={{
                    color: "rgba(212,175,55,0.5)", fontSize: 11, display: "block", marginBottom: 6,
                  }}>Owner Name</label>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)",
                    borderRadius: 8, padding: "0 12px",
                  }}>
                    <User size={14} style={{ color: "rgba(212,175,55,0.3)" }} />
                    <input
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      placeholder="John Doe"
                      style={{
                        flex: 1, background: "transparent", border: "none",
                        padding: "10px 0", color: "#FFFFFF", fontSize: 13, outline: "none",
                      }}
                    />
                  </div>
                </motion.div>

                {/* Mobile Number */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 }}
                  style={{ marginBottom: 12 }}
                >
                  <label style={{
                    color: "rgba(212,175,55,0.5)", fontSize: 11, display: "block", marginBottom: 6,
                  }}>Mobile Number</label>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)",
                    borderRadius: 8, padding: "0 12px",
                  }}>
                    <Activity size={14} style={{ color: "rgba(212,175,55,0.3)" }} />
                    <input
                      value={mobileNo}
                      onChange={e => setMobileNo(e.target.value)}
                      placeholder="+91 98765 43210"
                      style={{
                        flex: 1, background: "transparent", border: "none",
                        padding: "10px 0", color: "#FFFFFF", fontSize: 13, outline: "none",
                      }}
                    />
                  </div>
                </motion.div>

                {/* Vehicle Number */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  style={{ marginBottom: 16 }}
                >
                  <label style={{
                    color: "rgba(212,175,55,0.5)", fontSize: 11, display: "block", marginBottom: 6,
                  }}>Vehicle Number</label>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)",
                    borderRadius: 8, padding: "0 12px",
                  }}>
                    <Car size={14} style={{ color: "rgba(212,175,55,0.3)" }} />
                    <input
                      value={vehicleNo}
                      onChange={e => setVehicleNo(e.target.value)}
                      placeholder="KA-01-XX-0000"
                      style={{
                        flex: 1, background: "transparent", border: "none",
                        padding: "11px 0", color: "#FFFFFF", fontSize: 13, outline: "none",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    />
                  </div>
                </motion.div>

                {/* Time Selection */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  style={{ marginBottom: 20 }}
                >
                  <label style={{
                    color: "rgba(212,175,55,0.5)", fontSize: 11, display: "block", marginBottom: 8,
                  }}>Duration</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                    {timeSlots.map((slot, i) => {
                      const active = selectedTime === slot;
                      return (
                        <motion.button
                          key={slot}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25, delay: 0.2 + i * 0.04 }}
                          whileHover={{ scale: 1.04, boxShadow: "0 0 12px rgba(212,175,55,0.1)" }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelectedTime(slot)}
                          style={{
                            padding: "10px", borderRadius: 8, cursor: "pointer",
                            background: active ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)",
                            border: active ? "1px solid rgba(212,175,55,0.28)" : "1px solid rgba(255,255,255,0.06)",
                            color: active ? "#D4AF37" : "rgba(255,255,255,0.4)",
                            fontSize: 12, fontWeight: active ? 600 : 400,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          <div>{slot}</div>
                          <div style={{
                            fontSize: 10, marginTop: 2, color: active ? "#D4AF37" : "rgba(255,255,255,0.2)",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>₹{getPrice(slot)}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Price Summary */}
                <AnimatePresence>
                  {selectedTime && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{
                        background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.08)",
                        borderRadius: 10, padding: "14px", marginBottom: 16,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Base Price</span>
                          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                            ₹{getPrice(selectedTime)}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Service Fee</span>
                          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>₹5</span>
                        </div>
                        <div style={{ height: 1, background: "rgba(212,175,55,0.08)", margin: "8px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}>Total</span>
                          <motion.span
                            key={selectedTime}
                            initial={{ scale: 1.3, color: "#FFFFFF" }}
                            animate={{ scale: 1, color: "#D4AF37" }}
                            transition={{ duration: 0.4 }}
                            style={{
                              fontSize: 16, fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >₹{getPrice(selectedTime) + 5}</motion.span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirm Button */}
                <motion.button
                  whileHover={(selectedTime && ownerName && mobileNo) ? { scale: 1.03, boxShadow: "0 0 28px rgba(212,175,55,0.3)" } : {}}
                  whileTap={(selectedTime && ownerName && mobileNo) ? { scale: 0.97 } : {}}
                  onClick={handleBook}
                  disabled={!selectedTime || !ownerName || !mobileNo}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 10, border: "none",
                    background: (selectedTime && ownerName && mobileNo)
                      ? "linear-gradient(135deg, #D4AF37, #8B6914)"
                      : "rgba(255,255,255,0.05)",
                    color: (selectedTime && ownerName && mobileNo) ? "#000000" : "rgba(255,255,255,0.2)",
                    fontSize: 13, fontWeight: 700, letterSpacing: 1,
                    cursor: (selectedTime && ownerName && mobileNo) ? "pointer" : "not-allowed",
                    boxShadow: (selectedTime && ownerName && mobileNo) ? "0 0 20px rgba(212,175,55,0.22)" : "none",
                    fontFamily: "'Inter', sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <CreditCard size={16} />
                  CONFIRM BOOKING
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center", color: "rgba(212,175,55,0.22)", paddingTop: 80 }}
              >
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  <MapPin size={36} style={{ marginBottom: 12 }} />
                </motion.div>
                <div style={{ fontSize: 13 }}>Select an available spot<br />from the grid to book</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
