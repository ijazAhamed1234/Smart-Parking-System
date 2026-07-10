import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  Home, LayoutDashboard, BarChart3, DollarSign, Activity,
  CalendarCheck, LogOut, Menu, ChevronRight, Bell, User, Settings, Shield, Lock,
  Cpu, Eye
} from "lucide-react";
import { useParkingZones, useSlotDetection } from "../../hooks/useFirebaseData";
import { motion, AnimatePresence } from "motion/react";
import { useBookingManager, sendWhatsAppMessage } from "../../hooks/useBookingManager";

const NAV_ITEMS = [
  { path: "/",             icon: Home,            label: "Dashboard"    },
  { path: "/parking",      icon: LayoutDashboard, label: "Parking Grid" },
  { path: "/booking",      icon: CalendarCheck,   label: "Slot Booking" },
  { path: "/analytics",    icon: BarChart3,       label: "Analytics"    },
  { path: "/pricing",      icon: DollarSign,      label: "Pricing"      },
  { path: "/system-health",icon: Activity,        label: "System Health"},
];

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      color: "rgba(212,175,55,0.55)",
      fontSize: 12, letterSpacing: 0.5,
    }}>
      {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}
function StatusPills() {
  const { sensorDetection, cvDetection } = useSlotDetection();
  const [status, setStatus] = useState({ hw: false, cv: false });

  useEffect(() => {
    const checkLive = () => {
      const now = Date.now();
      const hwLast = Math.max(0, ...Object.values(sensorDetection).map((d: any) => d?.updatedAt || 0));
      const cvLast = Math.max(0, ...Object.values(cvDetection).map((d: any) => d?.updatedAt || 0));
      setStatus({
        hw: hwLast > 0 && (now - hwLast) < 60000,
        cv: cvLast > 0 && (now - cvLast) < 60000
      });
    };
    checkLive();
    const int = setInterval(checkLive, 5000);
    return () => clearInterval(int);
  }, [sensorDetection, cvDetection]);

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 20,
        background: status.hw ? "rgba(22,163,74,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${status.hw ? "rgba(22,163,74,0.2)" : "rgba(255,255,255,0.06)"}`,
        transition: "all 0.4s ease"
      }}>
        <Cpu size={12} style={{ color: status.hw ? "#16A34A" : "rgba(255,255,255,0.2)" }} />
        <span style={{ color: status.hw ? "#16A34A" : "rgba(255,255,255,0.3)", fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5 }}>HARDWARE</span>
      </div>
      
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 20,
        background: status.cv ? "rgba(147,51,234,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${status.cv ? "rgba(147,51,234,0.2)" : "rgba(255,255,255,0.06)"}`,
        transition: "all 0.4s ease"
      }}>
        <Eye size={12} style={{ color: status.cv ? "#C084FC" : "rgba(255,255,255,0.2)" }} />
        <span style={{ color: status.cv ? "#C084FC" : "rgba(255,255,255,0.3)", fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5 }}>VISION</span>
      </div>
    </div>
  );
}

export default function Layout() {
  useBookingManager(); // Start global expiry checker
  const location = useLocation();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [expiredNotification, setExpiredNotification] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileView, setProfileView] = useState("main"); // "main" or "settings"

  // Close profile menu on click outside and reset view
  useEffect(() => {
    if (!showProfileMenu) return;
    const close = () => {
      setShowProfileMenu(false);
      setProfileView("main");
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showProfileMenu]);

  const handleSignOut = () => {
    // Add logout logic here if needed
    window.location.href = "/login";
  };

  useEffect(() => {
    const handleExpired = (e: any) => {
      setExpiredNotification(e.detail);
    };
    window.addEventListener("parking-expired", handleExpired);
    return () => window.removeEventListener("parking-expired", handleExpired);
  }, []);

  const handleSendBill = () => {
    if (!expiredNotification) return;
    const variables = {
      "1": expiredNotification.slotId,
      "2": `Total Bill: ₹${expiredNotification.bill}`
    };
    sendWhatsAppTemplate(expiredNotification.phone, variables);
    setExpiredNotification(null);
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getPageTitle = () => {
    const item = NAV_ITEMS.find(n => isActive(n.path));
    return item?.label || "Dashboard";
  };

  const sidebarWidth = collapsed ? 64 : 232;

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#050505", color: "#FFFFFF",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ═══ SIDEBAR ═══ */}
      <aside style={{
        width: sidebarWidth,
        background: "#070707",
        borderRight: "1px solid rgba(212,175,55,0.08)",
        display: "flex", flexDirection: "column",
        position: "fixed", height: "100vh",
        left: 0, top: 0, zIndex: 100,
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "18px 14px" : "18px 18px",
          borderBottom: "1px solid rgba(212,175,55,0.07)",
          display: "flex", alignItems: "center", gap: 10,
          minHeight: 64,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(145deg, #C9A227, #7A5C10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#000",
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
          }}>P</div>
          {!collapsed && (
            <div>
              <div style={{ color: "#C9A227", fontSize: 14, fontWeight: 700, letterSpacing: 2.5 }}>PARKOS</div>
              <div style={{ color: "rgba(212,175,55,0.28)", fontSize: 8, letterSpacing: 2.5, marginTop: 1 }}>SMART PARKING</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1, padding: collapsed ? "12px 8px" : "12px 10px",
          display: "flex", flexDirection: "column", gap: 2,
          overflowY: "auto",
        }}>
          {NAV_ITEMS.map((item) => {
            const active  = isActive(item.path);
            const Icon    = item.icon;
            const hovered = hoveredNav === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onMouseEnter={() => setHoveredNav(item.path)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  display: "flex", alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "10px 0" : "9px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 8,
                  background: active ? "rgba(201,162,39,0.09)" : hovered ? "rgba(255,255,255,0.03)" : "transparent",
                  border: active ? "1px solid rgba(201,162,39,0.18)" : "1px solid transparent",
                  color: active ? "#C9A227" : hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.38)",
                  textDecoration: "none",
                  fontSize: 12.5, fontWeight: active ? 600 : 400,
                  transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
                  position: "relative",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="sidebarIndicator"
                    style={{
                      position: "absolute", left: 0, top: "20%", bottom: "20%",
                      width: 2.5,
                      background: "linear-gradient(180deg, #C9A227 0%, #7A5C10 100%)",
                      borderRadius: "0 2px 2px 0",
                    }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
                <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: collapsed ? "10px 8px" : "10px 10px",
          borderTop: "1px solid rgba(212,175,55,0.07)",
        }}>
          {!collapsed && (
            <div style={{
              color: "rgba(212,175,55,0.18)", fontSize: 9,
              textAlign: "center", letterSpacing: 1,
              padding: "4px 0",
            }}>
              ParkOS v3.2 Enterprise
            </div>
          )}
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div style={{ flex: 1, marginLeft: sidebarWidth, transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
        {/* ═══ TOPBAR ═══ */}
        <header style={{
          height: 56,
          background: "rgba(7,7,7,0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(212,175,55,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 22px",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: "none", border: "none",
                color: "rgba(212,175,55,0.4)",
                cursor: "pointer", padding: 4, display: "flex",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(212,175,55,0.75)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(212,175,55,0.4)")}
            >
              {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
            </button>
            <div>
              <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{getPageTitle()}</div>
              <div style={{ color: "rgba(212,175,55,0.35)", fontSize: 10, letterSpacing: 0.5 }}>Smart Parking Infrastructure</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <LiveClock />

            <StatusPills />

            {/* Avatar & Profile Menu */}
            <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(145deg, #C9A227, #7A5C10)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#000",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  border: "none", cursor: "pointer",
                  outline: "none",
                }}
              >
                A
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{
                      position: "absolute", top: 40, right: 0,
                      width: 240, background: "#0d0d0d",
                      border: "1px solid rgba(212,175,55,0.12)",
                      borderRadius: 12, padding: "8px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                      zIndex: 1000,
                    }}
                  >
                    {profileView === "main" ? (
                      <>
                        {/* User Info */}
                        <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 6 }}>
                          <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}>Ijas Ahamed</div>
                          <div style={{ color: "rgba(212,175,55,0.4)", fontSize: 10 }}>ijasahamed0123@gmail.com</div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setProfileView("settings"); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                              fontSize: 12, color: "rgba(255,255,255,0.65)", borderRadius: 8,
                              background: "transparent", border: "none", cursor: "pointer",
                              textAlign: "left", width: "100%", transition: "background 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <Settings size={14} />
                            <span>Profile Settings</span>
                          </button>
                        </div>

                        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "6px 0" }} />

                        {/* Logout */}
                        <button
                          onClick={handleSignOut}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 12px", borderRadius: 8,
                            color: "#DC2626", fontSize: 12, fontWeight: 600,
                            background: "rgba(220,38,38,0.03)", border: "none",
                            width: "100%", cursor: "pointer", textAlign: "left"
                          }}
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </>
                    ) : profileView === "settings" ? (
                      <>
                        {/* Settings View */}
                        <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setProfileView("main"); }}
                            style={{ background: "none", border: "none", color: "rgba(212,175,55,0.5)", cursor: "pointer", padding: 0 }}
                          >
                            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
                          </button>
                          <div style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600 }}>Profile Details</div>
                        </div>

                        <div style={{ padding: "4px 12px 12px" }}>
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Email Address</div>
                            <div style={{ color: "rgba(212,175,55,0.7)", fontSize: 11, wordBreak: "break-all" }}>ijasahamed0123@gmail.com</div>
                          </div>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); setProfileView("reset"); }}
                            style={{
                              width: "100%", padding: "8px", borderRadius: 6,
                              background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
                              color: "#D4AF37", fontSize: 11, fontWeight: 600,
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                            }}
                          >
                            <Lock size={12} />
                            RESET PASSWORD
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Reset Password View */}
                        <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setProfileView("settings"); }}
                            style={{ background: "none", border: "none", color: "rgba(212,175,55,0.5)", cursor: "pointer", padding: 0 }}
                          >
                            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
                          </button>
                          <div style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600 }}>Reset Password</div>
                        </div>

                        <div style={{ padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                          <div>
                            <label style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Old Password</label>
                            <input type="password" placeholder="••••••" style={{ width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px", color: "#FFF", fontSize: 11, outline: "none" }} />
                          </div>
                          <div>
                            <label style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, textTransform: "uppercase", display: "block", marginBottom: 4 }}>New Password</label>
                            <input type="password" placeholder="••••••" style={{ width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px", color: "#FFF", fontSize: 11, outline: "none" }} />
                          </div>
                          <div>
                            <label style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Re-enter New Password</label>
                            <input type="password" placeholder="••••••" style={{ width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px", color: "#FFF", fontSize: 11, outline: "none" }} />
                          </div>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); setProfileView("settings"); alert("Password reset successfully!"); }}
                            style={{
                              width: "100%", padding: "10px", borderRadius: 8,
                              background: "linear-gradient(135deg, #D4AF37, #8B6914)", border: "none",
                              color: "#000", fontSize: 11, fontWeight: 700,
                              cursor: "pointer", marginTop: 4
                            }}
                          >
                            CONFIRM RESET
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ═══ CONTENT ═══ */}
        <div style={{ padding: "20px", maxWidth: 1400, margin: "0 auto" }}>
          <Outlet />
        </div>

        {/* Expiry / Billing Toast */}
        <AnimatePresence>
          {expiredNotification && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              style={{
                position: "fixed", bottom: 24, right: 24, zIndex: 1000,
                background: "#0d0d0d", border: "1px solid #DC2626",
                borderRadius: 12, padding: "16px", width: 300,
                boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
              }}>
              <div style={{ color: "#DC2626", fontSize: 13, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={14} /> TIME COMPLETED
              </div>
              <div style={{ color: "#FFFFFF", fontSize: 12, marginBottom: 12 }}>
                Slot <strong>{expiredNotification.slotId}</strong> duration ended.
                <br />Bill: <strong>₹{expiredNotification.bill}</strong>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleSendBill}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 6, border: "none",
                    background: "#16A34A", color: "#FFFFFF", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                  }}>
                  <DollarSign size={12} /> SEND BILL (WA)
                </button>
                <button
                  onClick={() => setExpiredNotification(null)}
                  style={{
                    padding: "8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 11,
                    cursor: "pointer"
                  }}>
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,162,39,0.15); border-radius: 2px; }
        body { margin: 0; background: #050505; color: #FFFFFF; }
        a { transition: color 0.22s cubic-bezier(0.4,0,0.2,1); }
      `}</style>
    </div>
  );
}