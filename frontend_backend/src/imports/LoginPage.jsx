import React, { useState, useEffect } from "react";
import { Lock, Mail, ArrowRight, Zap } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = () => {
    setError("");
    setLoading(true);
    
    // Validate against specified credentials
    setTimeout(() => {
      setLoading(false);
      if (email === "ijasahamed0123@gmail.com" && pass === "123456") {
        onLogin();
      } else {
        setError("Invalid email or password. Please try again.");
      }
    }, 1000);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      fontFamily: "'Inter', sans-serif",
      background: "#050505",
    }}>
      {/* ═══ LEFT BRANDING PANEL ═══ */}
      <div style={{
        flex: 1, position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", padding: 60,
        background: "linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #050505 100%)",
      }}>
        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        {/* Glow orbs */}
        <div style={{
          position: "absolute", top: "15%", left: "20%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "10%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,105,20,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          {/* Logo */}
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: "linear-gradient(135deg, #D4AF37, #8B6914)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, fontWeight: 900, color: "#000000",
            margin: "0 auto 24px",
            boxShadow: "0 0 40px rgba(212,175,55,0.4), 0 0 80px rgba(212,175,55,0.15)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>P</div>

          <h1 style={{
            color: "#D4AF37", fontSize: 36, fontWeight: 800,
            letterSpacing: 4, margin: "0 0 8px",
            textShadow: "0 0 30px rgba(212,175,55,0.3)",
          }}>PARKOS</h1>
          <p style={{
            color: "rgba(212,175,55,0.4)", fontSize: 13,
            letterSpacing: 3, margin: 0, textTransform: "uppercase",
          }}>Smart Parking Infrastructure</p>

          <div style={{
            marginTop: 48, display: "flex", flexDirection: "column", gap: 16,
          }}>
            {[
              { icon: "🅿️", text: "Real-time parking demand prediction" },
              { icon: "📊", text: "AI-powered occupancy analytics" },
              { icon: "⚡", text: "Dynamic pricing optimization" },
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 20px", borderRadius: 12,
                background: "rgba(212,175,55,0.04)",
                border: "1px solid rgba(212,175,55,0.12)",
              }}>
                <span style={{ fontSize: 18 }}>{f.icon}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT LOGIN FORM ═══ */}
      <div style={{
        width: 520, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", padding: 60,
        background: "#050505",
        borderLeft: "1px solid rgba(212,175,55,0.12)",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              color: "#FFFFFF", fontSize: 24, fontWeight: 700, margin: "0 0 6px",
            }}>{isSignUp ? "Create Account" : "Welcome Back"}</h2>
            <p style={{
              color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0,
            }}>{isSignUp ? "Set up your PARKOS account" : "Sign in to your PARKOS dashboard"}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: 8, padding: "10px 14px",
              color: "#EF4444", fontSize: 12, marginBottom: 20,
              display: "flex", alignItems: "center", gap: 8
            }}>
              <Zap size={14} />
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 18 }}>
            <label style={{
              color: "rgba(212,175,55,0.5)", fontSize: 12, fontWeight: 500,
              display: "block", marginBottom: 8, letterSpacing: 0.5,
            }}>Email Address</label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(212,175,55,0.04)",
              border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: 10, padding: "0 14px",
            }}>
              <Mail size={16} style={{ color: "rgba(212,175,55,0.35)", flexShrink: 0 }} />
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  flex: 1, background: "transparent", border: "none",
                  padding: "13px 0", color: "#FFFFFF", fontSize: 14,
                  outline: "none", fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 10 }}>
            <label style={{
              color: "rgba(212,175,55,0.5)", fontSize: 12, fontWeight: 500,
              display: "block", marginBottom: 8, letterSpacing: 0.5,
            }}>Password</label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(212,175,55,0.04)",
              border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: 10, padding: "0 14px",
            }}>
              <Lock size={16} style={{ color: "rgba(212,175,55,0.35)", flexShrink: 0 }} />
              <input
                type="password" value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Enter your password"
                style={{
                  flex: 1, background: "transparent", border: "none",
                  padding: "13px 0", color: "#FFFFFF", fontSize: 14,
                  outline: "none", fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
          </div>

          {!isSignUp && (
            <div style={{ textAlign: "right", marginBottom: 24 }}>
              <span style={{ color: "#D4AF37", fontSize: 12, cursor: "pointer" }}>Forgot password?</span>
            </div>
          )}
          {isSignUp && <div style={{ marginBottom: 24 }} />}

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #D4AF37, #8B6914)",
              color: loading ? "rgba(255,255,255,0.3)" : "#000000",
              fontSize: 14, fontWeight: 700, letterSpacing: 1,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: loading ? "none" : "0 0 30px rgba(212,175,55,0.3), 0 0 60px rgba(212,175,55,0.1)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)",
                  borderTopColor: "#D4AF37", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                AUTHENTICATING...
              </>
            ) : (
              <>{isSignUp ? "CREATE ACCOUNT" : "SIGN IN"} <ArrowRight size={16} /></>
            )}
          </button>

          {/* Toggle */}
          <div style={{
            textAlign: "center", marginTop: 24, color: "rgba(255,255,255,0.4)", fontSize: 13,
          }}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <span
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ color: "#D4AF37", cursor: "pointer", fontWeight: 500 }}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </span>
          </div>

          <div style={{
            textAlign: "center", marginTop: 36,
            color: "rgba(212,175,55,0.2)", fontSize: 11, letterSpacing: 0.5,
          }}>
            Secured by ParkOS Enterprise v3.2
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
