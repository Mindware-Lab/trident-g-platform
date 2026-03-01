import { useState, useEffect, useRef } from "react";

const SCREENS = {
  WELCOME: "welcome",
  MODE: "mode",
  SETUP: "setup",
  HOME: "home",
  CHECK_A: "check_a",
  CHECK_B: "check_b",
  CHECK_C: "check_c",
  RESULTS: "results",
  RECOMMEND: "recommend",
  TRENDS: "trends",
  PROFILE: "profile",
};

// --- Vibrant palette from image ---
const C = {
  hotPink: "#f43bab",
  purple: "#c540cc",
  berry: "#b61c74",
  orchid: "#cc3dc7",
  lavender: "#ba89cc",
  plum: "#5d2c40",
  darkBg: "#1A0A14",
  cardBg: "rgba(255,255,255,0.06)",
  cardBgSolid: "#2A1222",
  cardBgLight: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(255,255,255,0.12)",
  text: "#FFFFFF",
  textSoft: "rgba(255,255,255,0.75)",
  textMuted: "rgba(255,255,255,0.45)",
  textDim: "rgba(255,255,255,0.28)",
  accentGlow: "rgba(244, 59, 171, 0.35)",
  greenGood: "#34D399",
  greenDim: "rgba(52, 211, 153, 0.15)",
  amberWarn: "#FBBF24",
  amberDim: "rgba(251, 191, 36, 0.15)",
  redAlert: "#F87171",
  redDim: "rgba(248, 113, 113, 0.12)",
};

const gradient = {
  main: "linear-gradient(135deg, #f43bab 0%, #cc3dc7 50%, #c540cc 100%)",
  subtle: "linear-gradient(135deg, #b61c7440 0%, #c540cc30 100%)",
  card: "linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
  bg: "radial-gradient(ellipse at 20% 0%, #b61c7430 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, #c540cc20 0%, transparent 50%), #1A0A14",
};

const ScreenShell = ({ children, style, glow }) => (
  <div style={{
    width: "100%", maxWidth: 390, minHeight: 740, margin: "0 auto",
    background: gradient.bg, borderRadius: 32, overflow: "hidden",
    position: "relative",
    fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif",
    color: C.text,
    boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(244,59,171,0.35)",
    ...style,
  }}>
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    {glow && <div style={{
      position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
      width: 300, height: 300, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(244,59,171,0.15) 0%, transparent 70%)",
      pointerEvents: "none", zIndex: 0,
    }} />}
    <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
  </div>
);

const GlassCard = ({ children, style, onClick, highlight }) => (
  <div onClick={onClick} style={{
    background: highlight ? gradient.card : C.cardBg,
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderRadius: 20, padding: 20,
    border: "1px solid " + (highlight ? C.glassBorder : "rgba(255,255,255,0.06)"),
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s ease", ...style,
  }}>{children}</div>
);

const Chip = ({ label, color, bg, small, glow, style }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: small ? "4px 10px" : "6px 14px",
    borderRadius: 99, fontSize: small ? 11 : 13, fontWeight: 600,
    color: color || C.text, background: bg || "rgba(244,59,171,0.2)",
    letterSpacing: 0.3,
    boxShadow: glow ? "0 0 16px rgba(244,59,171,0.35)" : "none",
    ...style,
  }}>{label}</span>
);

const Button = ({ children, primary, small, onClick, style, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: small ? "11px 20px" : "15px 28px",
    borderRadius: 16, border: primary ? "none" : "1.5px solid " + C.glassBorder,
    background: primary ? gradient.main : C.glass,
    color: C.text,
    fontSize: small ? 14 : 16, fontWeight: 600, cursor: disabled ? "default" : "pointer",
    fontFamily: "inherit", letterSpacing: 0.2, width: "100%",
    opacity: disabled ? 0.4 : 1,
    boxShadow: primary && !disabled ? "0 4px 24px rgba(244,59,171,0.35)" : "none",
    transition: "all 0.25s ease", ...style,
  }}>{children}</button>
);

const BottomNav = ({ active, onNavigate }) => {
  const items = [
    { key: SCREENS.HOME, label: "Home", icon: "\u2299" },
    { key: SCREENS.TRENDS, label: "Trends", icon: "\u2197" },
    { key: SCREENS.RECOMMEND, label: "Plan", icon: "\u25C8" },
    { key: SCREENS.PROFILE, label: "Profile", icon: "\u25CB" },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "10px 16px 28px",
      background: "rgba(26,10,20,0.85)", backdropFilter: "blur(20px)",
      borderTop: "1px solid " + C.glassBorder,
    }}>
      {items.map(it => (
        <button key={it.key} onClick={() => onNavigate(it.key)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          background: "none", border: "none", cursor: "pointer", padding: "6px 14px",
          fontFamily: "inherit", position: "relative",
        }}>
          {active === it.key && <div style={{
            position: "absolute", top: -10, width: 20, height: 3, borderRadius: 2,
            background: gradient.main,
            boxShadow: "0 0 10px rgba(244,59,171,0.4)",
          }} />}
          <span style={{
            fontSize: 20, lineHeight: 1,
            color: active === it.key ? C.hotPink : C.textDim,
            fontWeight: active === it.key ? 700 : 400,
            transition: "color 0.2s",
          }}>{it.icon}</span>
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: active === it.key ? C.textSoft : C.textDim,
          }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
};

const ProgressRing = ({ progress, size = 190, stroke = 10, color, children }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.hotPink} />
            <stop offset="100%" stopColor={C.orchid} />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color || "url(#ringGrad)"} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)", filter: "drop-shadow(0 0 8px rgba(244,59,171,0.35))" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>{children}</div>
    </div>
  );
};

const WelcomeScreen = ({ onNext }) => (
  <ScreenShell glow>
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: 740, padding: "40px 32px",
      textAlign: "center",
    }}>
      <div style={{
        width: 88, height: 88, borderRadius: 24,
        background: gradient.main,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 36, fontSize: 40,
        boxShadow: "0 8px 40px rgba(244,59,171,0.35)",
      }}>{"\u25CE"}</div>
      <h1 style={{
        fontFamily: "'Sora', sans-serif", fontSize: 38, fontWeight: 800,
        lineHeight: 1.1, margin: "0 0 14px", letterSpacing: -1,
        background: gradient.main, WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent", backgroundClip: "text",
      }}>Zone Coach</h1>
      <p style={{
        fontSize: 17, color: C.textSoft, lineHeight: 1.55,
        margin: "0 0 8px", maxWidth: 280, fontWeight: 400,
      }}>6-minute mind\u2013body check for your next best block.</p>
      <p style={{
        fontSize: 12, color: C.textDim, lineHeight: 1.5,
        margin: "0 0 52px", maxWidth: 260,
      }}>Not a medical device. Data stays on your device unless you choose to sync.</p>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <Button primary onClick={onNext}>Get started</Button>
        <Button>Sign in</Button>
      </div>
    </div>
  </ScreenShell>
);

const ModeScreen = ({ onNext }) => {
  const [selected, setSelected] = useState(null);
  const modes = [
    { key: "work", emoji: "\u2B21", label: "Work", desc: "Optimise focus & meetings", color: C.hotPink },
    { key: "longevity", emoji: "\u25C7", label: "Longevity", desc: "Sustain health & vitality", color: C.orchid },
    { key: "sport", emoji: "\u25B3", label: "Sport", desc: "Peak training readiness", color: C.lavender },
  ];
  return (
    <ScreenShell glow>
      <div style={{ padding: "60px 24px 40px" }}>
        <p style={{ fontSize: 12, color: C.hotPink, margin: "0 0 6px", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Step 1</p>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, margin: "0 0 8px", fontWeight: 700 }}>Choose your focus</h2>
        <p style={{ fontSize: 15, color: C.textSoft, margin: "0 0 32px", lineHeight: 1.5 }}>This shapes your recommendations. Same engine, tailored guidance.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {modes.map(m => (
            <GlassCard key={m.key} highlight={selected === m.key} onClick={() => setSelected(m.key)} style={{
              border: selected === m.key ? "2px solid " + m.color : "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
              boxShadow: selected === m.key ? "0 0 30px " + m.color + "20" : "none",
            }}>
              <span style={{
                width: 50, height: 50, borderRadius: 15,
                background: selected === m.key ? m.color + "30" : "rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, transition: "all 0.3s",
                color: selected === m.key ? m.color : C.textMuted,
              }}>{m.emoji}</span>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{m.desc}</div>
              </div>
            </GlassCard>
          ))}
        </div>
        <div style={{ marginTop: 32 }}>
          <Button primary disabled={!selected} onClick={onNext}>Continue</Button>
        </div>
      </div>
    </ScreenShell>
  );
};

const SetupScreen = ({ onNext }) => {
  const [connected, setConnected] = useState(false);
  return (
    <ScreenShell glow>
      <div style={{ padding: "60px 24px 40px" }}>
        <p style={{ fontSize: 12, color: C.hotPink, margin: "0 0 6px", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Step 2</p>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, margin: "0 0 8px", fontWeight: 700 }}>Connect your strap</h2>
        <p style={{ fontSize: 15, color: C.textSoft, margin: "0 0 28px", lineHeight: 1.5 }}>Zone Coach uses a Polar H10 chest strap for heart rate data.</p>
        <GlassCard highlight style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Polar H10</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                {connected ? "Connected \u2014 signal strong" : "Not connected"}
              </div>
            </div>
            <Chip
              label={connected ? "\u25CF Live" : "Searching\u2026"}
              color={connected ? C.greenGood : C.amberWarn}
              bg={connected ? C.greenDim : C.amberDim}
            />
          </div>
          {!connected && (
            <button onClick={() => setConnected(true)} style={{
              marginTop: 14, padding: "11px 0", width: "100%",
              background: "rgba(244,59,171,0.1)", border: "1px solid rgba(244,59,171,0.3)",
              borderRadius: 12, fontSize: 14, fontWeight: 500, color: C.hotPink,
              cursor: "pointer", fontFamily: "inherit",
            }}>Tap to simulate connect</button>
          )}
        </GlassCard>
        <GlassCard style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: C.textSoft }}>Wearing tips</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}>
            Moisten electrodes before wearing. Adjust snugly below the chest muscles. The strap should feel secure but comfortable.
          </div>
        </GlassCard>
        <GlassCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Data stays on device</div>
            <div style={{
              width: 46, height: 28, borderRadius: 14,
              background: "rgba(244,59,171,0.35)", position: "relative", cursor: "pointer",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11, background: C.hotPink,
                position: "absolute", top: 3, left: 21,
                boxShadow: "0 2px 8px rgba(244,59,171,0.35)", transition: "left 0.2s",
              }} />
            </div>
          </div>
        </GlassCard>
        <div style={{ marginTop: 32 }}>
          <Button primary disabled={!connected} onClick={onNext}>Continue</Button>
        </div>
      </div>
    </ScreenShell>
  );
};

const HomeScreen = ({ onStartCheck, onNavigate }) => (
  <ScreenShell glow>
    <div style={{ padding: "52px 20px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 13, color: C.textDim, fontWeight: 500 }}>Saturday, Mar 1</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, margin: "4px 0 0", fontWeight: 700 }}>Good morning</h2>
        </div>
        <div style={{
          padding: "6px 14px", borderRadius: 12,
          background: "rgba(244,59,171,0.1)", border: "1px solid rgba(244,59,171,0.2)",
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 14, fontWeight: 700, color: C.hotPink,
        }}>{"\uD83D\uDD25"} 5</div>
      </div>
      <div style={{
        borderRadius: 22, padding: 24, marginBottom: 16,
        background: gradient.main, position: "relative", overflow: "hidden",
        boxShadow: "0 8px 40px rgba(244,59,171,0.35)",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30, width: 120, height: 120,
          borderRadius: "50%", background: "rgba(255,255,255,0.1)",
        }} />
        <div style={{
          position: "absolute", bottom: -20, left: -20, width: 80, height: 80,
          borderRadius: "50%", background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>TODAY'S CHECK</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Ready when you are</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 20 }}>6-min mind\u2013body check \u00B7 H10 connected</div>
          <button onClick={onStartCheck} style={{
            padding: "13px 0", width: "100%", borderRadius: 14, border: "none",
            background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)",
            color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", letterSpacing: 0.3,
          }}>Start check \u2192</button>
        </div>
      </div>
      <GlassCard highlight style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>LAST RECOMMENDATION</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: "rgba(204,61,199,0.15)", border: "1px solid rgba(204,61,199,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: C.orchid,
          }}>{"\u25C8"}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Deep work block</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Yesterday \u00B7 2h recommended</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip label="In the Zone" small color={C.greenGood} bg={C.greenDim} />
          <Chip label="Aligned" small color={C.lavender} bg={"rgba(186,137,204,0.2)"} />
        </div>
      </GlassCard>
      <GlassCard style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, letterSpacing: 1, marginBottom: 14 }}>7-DAY TREND</div>
        <div style={{ display: "flex", alignItems: "end", gap: 7, height: 60 }}>
          {[0.4, 0.7, 0.85, 0.6, 0.9, 0.75, null].map((v, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 8,
              height: v ? (v * 100) + "%" : 0,
              background: v ? (v > 0.7
                ? "linear-gradient(180deg, #f43bab 0%, #cc3dc7 100%)"
                : "rgba(255,255,255,0.08)") : "none",
              border: !v ? "2px dashed rgba(255,255,255,0.15)" : "none",
              minHeight: !v ? 30 : 0,
              boxShadow: v && v > 0.7 ? "0 4px 12px rgba(244,59,171,0.35)" : "none",
              transition: "height 0.5s ease",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          {["M","T","W","T","F","S","S"].map((d,i) => (
            <span key={i} style={{
              flex: 1, textAlign: "center", fontSize: 11,
              color: i === 6 ? C.hotPink : C.textDim,
              fontWeight: i === 6 ? 700 : 400
            }}>{d}</span>
          ))}
        </div>
      </GlassCard>
      <div style={{ display: "flex", gap: 10 }}>
        <GlassCard highlight style={{ flex: 1, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>STREAK</div>
          <div style={{
            fontSize: 28, fontWeight: 800,
            background: gradient.main, WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>5</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>days</div>
        </GlassCard>
        <GlassCard highlight style={{ flex: 1, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>IN ZONE</div>
          <div style={{
            fontSize: 28, fontWeight: 800,
            background: gradient.main, WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>68%</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>this week</div>
        </GlassCard>
      </div>
    </div>
    <BottomNav active={SCREENS.HOME} onNavigate={onNavigate} />
  </ScreenShell>
);

const CheckSegment = ({ segment, onNext, onNavigate }) => {
  const [elapsed, setElapsed] = useState(0);
  const durations = { A: 180, B: 120, C: 60 };
  const duration = durations[segment];
  const intervalRef = useRef(null);

  useEffect(() => {
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev >= duration - 1) { clearInterval(intervalRef.current); return duration; }
        return prev + 1;
      });
    }, 40);
    return () => clearInterval(intervalRef.current);
  }, [segment, duration]);

  const progress = elapsed / duration;
  const remaining = duration - elapsed;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const configs = {
    A: { title: "Mind + Rest", subtitle: "Cognitive control check", instruction: "Phone flat on surface. Sit still. Focus on the task.", color: C.hotPink, step: "1 of 3", detail: "Recording CCC responses + resting RR intervals" },
    B: { title: "Light Challenge", subtitle: "Mobilisation check", instruction: "Stand up and march in place at a steady pace.", color: C.orchid, step: "2 of 3", detail: "Recording DFA \u03B11 under mild load" },
    C: { title: "Recovery", subtitle: "Settling check", instruction: "Stand or sit still. Breathe normally.", color: C.lavender, step: "3 of 3", detail: "Recording heart rate recovery" },
  };
  const cfg = configs[segment];

  const [hr, setHr] = useState(62);
  useEffect(() => {
    const t = setInterval(() => {
      const base = segment === "B" ? 95 : segment === "C" ? 72 : 62;
      setHr(base + Math.floor(Math.random() * 8 - 4));
    }, 800);
    return () => clearInterval(t);
  }, [segment]);

  return (
    <ScreenShell glow>
      <div style={{
        padding: "52px 24px 40px", display: "flex", flexDirection: "column",
        alignItems: "center", minHeight: 740,
      }}>
        <style>{"\n@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }\n"}</style>
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <Chip label={"Segment " + cfg.step} color={cfg.color} bg={cfg.color + "20"} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 4, background: C.greenGood,
              boxShadow: "0 0 8px rgba(52,211,153,0.6)",
              animation: "pulse 2s infinite",
            }} />
            <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>H10 live</span>
          </div>
        </div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, margin: "0 0 4px", fontWeight: 700, textAlign: "center" }}>{cfg.title}</h2>
        <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 32px", textAlign: "center" }}>{cfg.subtitle}</p>
        <ProgressRing progress={progress} size={200} stroke={10} color={cfg.color}>
          <div style={{ fontSize: 40, fontWeight: 300, fontFamily: "'Sora', sans-serif", letterSpacing: -1.5 }}>
            {mins}:{String(secs).padStart(2, "0")}
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>remaining</div>
        </ProgressRing>
        <div style={{
          marginTop: 20, display: "flex", alignItems: "center", gap: 8,
          padding: "8px 18px", borderRadius: 14, background: C.glass,
          border: "1px solid " + C.glassBorder,
        }}>
          <span style={{ color: C.hotPink, fontSize: 16 }}>{"\u2665"}</span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>{hr}</span>
          <span style={{ fontSize: 12, color: C.textMuted }}>bpm</span>
        </div>
        <GlassCard style={{ width: "100%", marginTop: 24, boxShadow: "none" }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{cfg.instruction}</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>{cfg.detail}</div>
        </GlassCard>
        {segment === "A" && (
          <GlassCard highlight style={{ width: "100%", marginTop: 12, textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12, fontWeight: 600, letterSpacing: 1 }}>CCC PROBE ACTIVE</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
              {["\u2190", "\u2192"].map((d,i) => (
                <button key={i} style={{
                  width: 68, height: 68, borderRadius: 18,
                  border: "2px solid " + C.glassBorder, background: C.glass,
                  fontSize: 26, cursor: "pointer", fontFamily: "inherit", color: C.text,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{d}</button>
              ))}
            </div>
          </GlassCard>
        )}
        <div style={{ width: "100%", marginTop: "auto", paddingTop: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: "center" }}>
            {["A","B","C"].map((s) => (
              <div key={s} style={{
                width: 36, height: 4, borderRadius: 2,
                background: s === segment ? cfg.color : s < segment ? "rgba(244,59,171,0.5)" : "rgba(255,255,255,0.1)",
                boxShadow: s === segment ? "0 0 10px " + cfg.color + "50" : "none",
              }} />
            ))}
          </div>
          {elapsed >= duration && (
            <Button primary onClick={onNext}>
              {segment === "C" ? "View results \u2192" : "Next segment \u2192"}
            </Button>
          )}
        </div>
      </div>
    </ScreenShell>
  );
};

const ResultsScreen = ({ onNext, onNavigate }) => (
  <ScreenShell glow>
    <div style={{ padding: "52px 20px 100px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: C.hotPink, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>CHECK COMPLETE</div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, margin: "8px 0 0", fontWeight: 700 }}>Your readiness</h2>
      </div>
      <div style={{
        borderRadius: 22, padding: 28, marginBottom: 16, textAlign: "center",
        background: gradient.card, border: "1px solid " + C.glassBorder,
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, marginBottom: 7, letterSpacing: 1 }}>MIND</div>
            <Chip label="In the Zone" glow color="#fff" style={{ fontSize: 14, padding: "8px 18px", background: gradient.main }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, marginBottom: 7, letterSpacing: 1 }}>BODY</div>
            <Chip label="Locked In" color={C.lavender} bg={"rgba(186,137,204,0.2)"} style={{ fontSize: 14, padding: "8px 18px" }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
          <Chip label="Aligned" small color={C.greenGood} bg={C.greenDim} />
          <Chip label="High confidence" small color={C.textSoft} bg="rgba(255,255,255,0.08)" />
        </div>
        <div style={{ width: 48, height: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 16px", borderRadius: 1 }} />
        <p style={{ fontSize: 15, color: C.textSoft, lineHeight: 1.6, margin: 0 }}>
          Mind is focused and body is mobilised with good regulation. Ideal window for demanding cognitive or physical work.
        </p>
      </div>
      <GlassCard highlight style={{ marginBottom: 12 }}>
        <details style={{ cursor: "pointer" }}>
          <summary style={{ fontSize: 14, fontWeight: 600, color: C.textSoft, listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Why this reading?</span>
            <span style={{ fontSize: 16, color: C.textDim }}>{"\uFE3F"}</span>
          </summary>
          <div style={{ marginTop: 12, fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}>
            <p style={{ margin: "0 0 8px" }}>CCC throughput and stability signatures are in the optimal band \u2014 control is flexible, not rigid.</p>
            <p style={{ margin: "0 0 8px" }}>Resting HR and lnRMSSD indicate good recovery reserve. DFA \u03B11 under load shows healthy regulation.</p>
            <p style={{ margin: 0 }}>Heart rate recovery was brisk, confirming parasympathetic rebound.</p>
          </div>
        </details>
      </GlassCard>
      <GlassCard style={{ marginBottom: 16 }}>
        <details style={{ cursor: "pointer" }}>
          <summary style={{ fontSize: 14, fontWeight: 600, color: C.textSoft, listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>See data</span>
            <span style={{ fontSize: 16, color: C.textDim }}>{"\uFE3F"}</span>
          </summary>
          <div style={{ marginTop: 12 }}>
            {[
              { label: "CCC bps", value: "3.2", range: "Zone: 2.8\u20134.0", good: true },
              { label: "Resting HR", value: "58", range: "Baseline: 56", good: true },
              { label: "lnRMSSD", value: "4.1", range: "Baseline: 3.9", good: true },
              { label: "DFA \u03B11", value: "0.78", range: "Zone: 0.5\u20131.0", good: true },
              { label: "HR recovery", value: "\u221216", range: "Good: > \u221212", good: true },
            ].map((m, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>{m.range}</div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.greenGood }}>{m.value}</div>
              </div>
            ))}
          </div>
        </details>
      </GlassCard>
      <Button primary onClick={onNext}>See recommendation \u2192</Button>
    </div>
    <BottomNav active={SCREENS.HOME} onNavigate={onNavigate} />
  </ScreenShell>
);

const RecommendScreen = ({ onNavigate, standalone }) => (
  <ScreenShell glow>
    <div style={{ padding: "52px 20px 100px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: C.hotPink, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>YOUR PLAN</div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, margin: "6px 0 0", fontWeight: 700 }}>Next best block</h2>
      </div>
      <div style={{
        borderRadius: 22, padding: 22, marginBottom: 16,
        background: "linear-gradient(160deg, rgba(244,59,171,0.1) 0%, rgba(204,61,199,0.06) 100%)",
        border: "2px solid rgba(244,59,171,0.35)",
        boxShadow: "0 0 40px rgba(244,59,171,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 15,
            background: gradient.main,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 20, fontWeight: 700,
            boxShadow: "0 4px 16px rgba(244,59,171,0.35)",
          }}>{"\u25C8"}</div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>Deep work</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Up to 2 hours \u00B7 High demand OK</div>
          </div>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: C.textSoft }}>Do this now</div>
          <div style={{ color: C.textMuted }}>
            Tackle your hardest cognitive task \u2014 writing, analysis, or creative problem-solving. Your control quality supports sustained effort.
          </div>
        </div>
        <div style={{
          padding: "11px 14px", borderRadius: 12,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 13, color: C.textMuted,
        }}>
          <span style={{ fontWeight: 600, color: C.textSoft }}>Stop rule:</span> If focus breaks twice in 10 min, take a 5-min break or switch tasks.
        </div>
      </div>
      <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>IF YOU CAN'T DO THAT\u2026</div>
      {[
        { icon: "\u25B3", title: "Simple physical session", desc: "Zone 2 cardio or fixed circuit \u2014 45 min", color: C.orchid },
        { icon: "\u25CB", title: "Light admin & routine", desc: "Email, scheduling, low-error tasks \u2014 1h", color: C.lavender },
      ].map((alt, i) => (
        <GlassCard key={i} style={{ marginBottom: 10, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: alt.color + "20", border: "1px solid " + alt.color + "30",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: alt.color,
            }}>{alt.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{alt.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{alt.desc}</div>
            </div>
          </div>
        </GlassCard>
      ))}
      <div style={{ marginTop: 20 }}>
        <Button small style={{ background: "rgba(255,255,255,0.06)", border: "1px solid " + C.glassBorder }}>
          Quick re-check (75s)
        </Button>
      </div>
    </div>
    <BottomNav active={standalone ? SCREENS.RECOMMEND : SCREENS.HOME} onNavigate={onNavigate} />
  </ScreenShell>
);

const TrendsScreen = ({ onNavigate }) => {
  const days = [
    { d: "24", zone: true }, { d: "25", zone: true }, { d: "26", zone: false },
    { d: "27", zone: true }, { d: "28", zone: true }, { d: "1", zone: null, today: true },
  ];
  const chartData = [3.1, 3.4, 2.6, 3.0, 3.5, 3.2, 2.9, 3.3, 2.4, 3.1, 3.6, 3.2, 2.8, 3.4];
  const max = Math.max(...chartData);
  const min = Math.min(...chartData);
  const range = max - min || 1;
  return (
    <ScreenShell glow>
      <div style={{ padding: "52px 20px 100px" }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, margin: "0 0 24px", fontWeight: 700 }}>Trends</h2>
        <GlassCard highlight style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, letterSpacing: 1 }}>FEB \u2014 MAR</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["Mind", "Body"].map((t,i) => (
                <Chip key={t} label={t} small
                  color={i === 0 ? C.hotPink : C.textDim}
                  bg={i === 0 ? "rgba(244,59,171,0.15)" : "rgba(255,255,255,0.06)"}
                />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 8 }}>
            {days.map((d, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 10,
                background: d.today ? "rgba(244,59,171,0.1)" : "none",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 4, margin: "0 auto 4px",
                  background: d.zone === null ? C.textDim : d.zone ? C.hotPink : C.amberWarn,
                  boxShadow: d.zone ? "0 0 6px rgba(244,59,171,0.4)" : "none",
                }} />
                <span style={{ fontSize: 12, fontWeight: d.today ? 700 : 400, color: d.today ? C.hotPink : C.textMuted }}>{d.d}</span>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard highlight style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, letterSpacing: 1, marginBottom: 14 }}>CCC THROUGHPUT (14 DAYS)</div>
          <svg width="100%" viewBox="0 0 320 100" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="chartLine2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={C.hotPink} />
                <stop offset="100%" stopColor={C.orchid} />
              </linearGradient>
              <linearGradient id="chartFill2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={C.hotPink} stopOpacity="0.2" />
                <stop offset="100%" stopColor={C.hotPink} stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="0" y="15" width="320" height="55" fill="rgba(244,59,171,0.05)" rx="4" />
            <text x="324" y="25" fill={C.textDim} fontSize="9" fontFamily="Sora">zone</text>
            <path
              d={"M0," + (95 - ((chartData[0] - min) / range) * 85) + " " + chartData.map((v, i) => "L" + ((i / (chartData.length - 1)) * 320) + "," + (95 - ((v - min) / range) * 85)).join(" ") + " L320,100 L0,100 Z"}
              fill="url(#chartFill2)"
            />
            <polyline
              fill="none" stroke="url(#chartLine2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              points={chartData.map((v, i) => ((i / (chartData.length - 1)) * 320) + "," + (95 - ((v - min) / range) * 85)).join(" ")}
              style={{ filter: "drop-shadow(0 2px 6px rgba(244,59,171,0.35))" }}
            />
            {chartData.map((v, i) => (
              <circle key={i} cx={(i / (chartData.length - 1)) * 320} cy={95 - ((v - min) / range) * 85}
                r="3.5" fill={C.darkBg} stroke={C.hotPink} strokeWidth="2" />
            ))}
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: C.textDim }}>Feb 16</span>
            <span style={{ fontSize: 11, color: C.textDim }}>Mar 1</span>
          </div>
        </GlassCard>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "AVG CCC", val: "3.1", unit: "bps" },
            { label: "ZONE RATE", val: "68%", unit: "14 days" },
            { label: "RECOVERY", val: "1.2", unit: "days avg" },
          ].map((s,i) => (
            <GlassCard key={i} highlight style={{ flex: 1, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
              <div style={{
                fontSize: 22, fontWeight: 800,
                background: gradient.main, WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{s.val}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{s.unit}</div>
            </GlassCard>
          ))}
        </div>
        <GlassCard highlight style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>{"\u2605"}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Recovered Fast</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Back to zone in 1 day after Thursday's dip</div>
          </div>
        </GlassCard>
      </div>
      <BottomNav active={SCREENS.TRENDS} onNavigate={onNavigate} />
    </ScreenShell>
  );
};

const ProfileScreen = ({ onNavigate }) => (
  <ScreenShell glow>
    <div style={{ padding: "52px 20px 100px" }}>
      <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, margin: "0 0 24px", fontWeight: 700 }}>Profile</h2>
      <GlassCard highlight style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 17,
          background: gradient.main,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 700, color: "#fff",
          boxShadow: "0 4px 16px rgba(244,59,171,0.35)",
        }}>JR</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Jamie R.</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>Work mode \u00B7 Since Feb 2026</div>
        </div>
      </GlassCard>
      {[
        { label: "Device", value: "Polar H10", sub: "Connected" },
        { label: "Mode", value: "Work", sub: "Tap to change" },
        { label: "Data storage", value: "Local only", sub: "" },
        { label: "Export data", value: "CSV / JSON", sub: "" },
      ].map((item, i) => (
        <GlassCard key={i} style={{ marginBottom: 8, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</div>
            {item.sub && <div style={{ fontSize: 12, color: C.textDim }}>{item.sub}</div>}
          </div>
          <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 500 }}>{item.value}</div>
        </GlassCard>
      ))}
      <GlassCard highlight style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>BADGES</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { icon: "\uD83D\uDD25", label: "7-Day Starter", color: C.hotPink },
            { icon: "\u27F3", label: "Consistency", color: C.orchid },
            { icon: "\u2191", label: "Fast Recovery", color: C.greenGood },
          ].map((b, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 13px", borderRadius: 12,
              background: b.color + "15", border: "1px solid " + b.color + "25",
              fontSize: 12, fontWeight: 600, color: b.color,
            }}>
              <span>{b.icon}</span>{b.label}
            </div>
          ))}
        </div>
      </GlassCard>
      <p style={{
        fontSize: 12, color: C.textDim, textAlign: "center",
        marginTop: 28, lineHeight: 1.5,
      }}>
        Zone Coach is a readiness and self-regulation tool, not a medical device. v1.0.0
      </p>
    </div>
    <BottomNav active={SCREENS.PROFILE} onNavigate={onNavigate} />
  </ScreenShell>
);

export default function ZoneCoachApp() {
  const [screen, setScreen] = useState(SCREENS.WELCOME);
  const [checkSegment, setCheckSegment] = useState("A");

  const navigate = (s) => setScreen(s);
  const startCheck = () => { setCheckSegment("A"); setScreen(SCREENS.CHECK_A); };
  const nextSegment = () => {
    if (checkSegment === "A") { setCheckSegment("B"); setScreen(SCREENS.CHECK_B); }
    else if (checkSegment === "B") { setCheckSegment("C"); setScreen(SCREENS.CHECK_C); }
    else { setScreen(SCREENS.RESULTS); }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, rgba(182,28,116,0.1) 0%, transparent 60%), #1A0A14",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px 12px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{
            fontSize: 11, color: "rgba(255,255,255,0.28)", fontFamily: "'Sora', sans-serif",
            letterSpacing: 2, textTransform: "uppercase", fontWeight: 500,
          }}>Zone Coach \u2014 UI Prototype</span>
        </div>
        {screen === SCREENS.WELCOME && <WelcomeScreen onNext={() => setScreen(SCREENS.MODE)} />}
        {screen === SCREENS.MODE && <ModeScreen onNext={() => setScreen(SCREENS.SETUP)} />}
        {screen === SCREENS.SETUP && <SetupScreen onNext={() => setScreen(SCREENS.HOME)} />}
        {screen === SCREENS.HOME && <HomeScreen onStartCheck={startCheck} onNavigate={navigate} />}
        {screen === SCREENS.CHECK_A && <CheckSegment segment="A" onNext={nextSegment} onNavigate={navigate} />}
        {screen === SCREENS.CHECK_B && <CheckSegment segment="B" onNext={nextSegment} onNavigate={navigate} />}
        {screen === SCREENS.CHECK_C && <CheckSegment segment="C" onNext={nextSegment} onNavigate={navigate} />}
        {screen === SCREENS.RESULTS && <ResultsScreen onNext={() => setScreen(SCREENS.RECOMMEND)} onNavigate={navigate} />}
        {screen === SCREENS.RECOMMEND && <RecommendScreen onNavigate={navigate} standalone={true} />}
        {screen === SCREENS.TRENDS && <TrendsScreen onNavigate={navigate} />}
        {screen === SCREENS.PROFILE && <ProfileScreen onNavigate={navigate} />}
      </div>
    </div>
  );
}
