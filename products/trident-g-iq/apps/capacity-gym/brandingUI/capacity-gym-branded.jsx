import { useState, useEffect, useRef } from "react";

// ─── Brand Tokens (mapped directly from brand.css :root) ───
const B = {
  // Palette raw
  p0: "#0b1118",
  p1: "#0f121a",
  p2: "#1d2230",
  p3: "#2a3345",
  pageLight: "#dfe3e8",
  ink: "#0b0b0d",

  // Text
  t0: "#edf0f7",
  t1: "#d5dceb",
  t2: "#b7c2d6",
  t3: "#93a0b4",

  // Colors
  blue500: "#4ea0e8",
  blue400: "#6ec6ff",
  blue200: "#d9ecff",
  lime500: "#beef4e",
  lime400: "#ccff66",
  lime200: "#eaffb7",
  red300: "#ffb3c8",
  red400: "#ff8c8c",
  amber400: "#ffc478",
  sky400: "#78b4ff",

  // Semantic
  primary: "#ccff66",
  primaryStrong: "#beef4e",
  primarySoft: "rgba(204,255,102,.12)",
  info: "#6ec6ff",
  infoStrong: "#4ea0e8",
  infoSoft: "rgba(110,198,255,.10)",
  white: "#ffffff",
  textOnBright: "#0b0b0d",

  // Surfaces
  bgShell: "#0d1118",
  surfaceCard: "rgba(15,18,26,.92)",
  surfaceSoft: "rgba(255,255,255,.03)",
  surfaceElevated: "#1d2230",
  border: "rgba(255,255,255,.10)",
  borderSoft: "rgba(255,255,255,.07)",
  borderCrisp: "rgba(255,255,255,.14)",

  // Shadows
  shadow: "0 10px 24px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.03)",
  shadowSoft: "0 8px 18px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.02)",
  shadowInfo: "0 0 0 1px rgba(110,198,255,.18), 0 8px 22px rgba(78,160,232,.16)",
  shadowPrimary: "0 0 0 1px rgba(204,255,102,.14), 0 8px 22px rgba(190,239,78,.14)",

  // Radii
  radius: 16,
  radiusSm: 12,
  radiusXs: 10,
  radiusXl: 20,

  // Font
  font: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`,
};

// Derived convenience
const green = "#3dd9a0";
const greenSoft = "rgba(61,217,160,.14)";

// ─── Card background (matches .card from brand.css) ───
const cardBg = `radial-gradient(1000px 340px at -10% -20%, rgba(110,198,255,.10), transparent 55%), linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.012)), ${B.surfaceCard}`;
const cardGlassBg = `radial-gradient(1100px 360px at -10% -20%, rgba(110,198,255,.14), transparent 55%), linear-gradient(165deg, rgba(78,160,232,.12), rgba(15,18,26,.96) 55%)`;
const panelBg = `linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,.016))`;

// ─── Shared Components ───
function Pill({ children, color = B.info, bg = B.infoSoft, style }) {
  return (
    <span style={{
      color, background: bg, padding: "4px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 700, fontFamily: B.font,
      border: `1px solid ${B.borderSoft}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.02)",
      ...style,
    }}>
      {children}
    </span>
  );
}

function PillPrimary({ children, style }) {
  return (
    <span style={{
      color: B.textOnBright, background: B.primary,
      padding: "4px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 900, fontFamily: B.font,
      letterSpacing: "0.04em",
      border: `1px solid rgba(0,0,0,.08)`,
      boxShadow: B.shadowPrimary,
      ...style,
    }}>
      {children}
    </span>
  );
}

function StatBox({ label, value, color = B.t0, small }) {
  return (
    <div style={{
      flex: 1, border: `1px solid ${B.borderSoft}`, borderRadius: B.radiusSm,
      background: panelBg,
      padding: small ? "10px 10px" : "12px 14px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.02)",
    }}>
      <div style={{ color: B.t3, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: B.font }}>{label}</div>
      <div style={{ color, fontSize: small ? 15 : 17, fontWeight: 800, marginTop: 2, fontFamily: B.font }}>{value}</div>
    </div>
  );
}

function BtnPrimary({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "14px 16px", minHeight: 44,
      borderRadius: B.radiusSm, border: `1px solid ${B.primary}`,
      background: B.primary, color: B.textOnBright,
      fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: B.font,
      boxShadow: B.shadowPrimary,
      transition: "transform .08s ease, filter .12s ease",
      ...style,
    }}>
      {children}
    </button>
  );
}

function BtnInfo({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "14px 16px", minHeight: 44,
      borderRadius: B.radiusSm, border: `1px solid ${B.info}`,
      background: B.info, color: B.textOnBright,
      fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: B.font,
      boxShadow: B.shadowInfo,
      transition: "transform .08s ease, filter .12s ease",
      ...style,
    }}>
      {children}
    </button>
  );
}

function BtnSecondary({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "14px 16px", minHeight: 44,
      borderRadius: B.radiusSm,
      border: `1px solid ${B.border}`,
      background: `linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.02))`,
      color: B.t0, fontSize: 15, fontWeight: 700,
      cursor: "pointer", fontFamily: B.font,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
      ...style,
    }}>
      {children}
    </button>
  );
}

function BtnGhost({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "14px 16px", minHeight: 44,
      borderRadius: B.radiusSm,
      border: `1px solid ${B.border}`,
      background: "transparent", color: B.t1,
      fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: B.font,
      ...style,
    }}>
      {children}
    </button>
  );
}

function Kicker({ children, style }) {
  return (
    <p style={{
      margin: 0, color: B.blue200, fontWeight: 700, fontSize: 12,
      letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: B.font,
      ...style,
    }}>
      {children}
    </p>
  );
}

function MiniGraph({ data, color = B.info, height = 60, showDots = true, yMin = 0, yMax }) {
  const max = yMax ?? Math.max(...data, 1);
  const min = yMin;
  const range = max - min || 1;
  const svgW = 280;
  const pad = 12;
  const plotW = svgW - pad * 2;
  const plotH = height - 12;
  const points = data.map((v, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * plotW,
    y: 6 + plotH - ((v - min) / range) * plotH,
    v,
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${svgW} ${height}`} style={{ display: "block" }}>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={pad} x2={svgW - pad} y1={6 + plotH - f * plotH} y2={6 + plotH - f * plotH}
          stroke={B.borderSoft} strokeWidth="0.5" strokeDasharray="3,3" />
      ))}
      <path d={`${line} L${points[points.length - 1]?.x},${6 + plotH} L${points[0]?.x},${6 + plotH} Z`}
        fill={`${color}10`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {showDots && points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />)}
    </svg>
  );
}

function BarChart({ data, labels, colors: barColors, height = 80 }) {
  const max = Math.max(...data, 1);
  const barW = 22;
  const gap = 6;
  const totalW = data.length * (barW + gap) - gap;
  const svgW = 280;
  const offsetX = (svgW - totalW) / 2;
  return (
    <svg width="100%" height={height + 28} viewBox={`0 0 ${svgW} ${height + 28}`} style={{ display: "block" }}>
      {data.map((v, i) => {
        const barH = Math.max((v / max) * height, 2);
        const x = offsetX + i * (barW + gap);
        return (
          <g key={i}>
            <rect x={x} y={height - barH} width={barW} height={barH} rx={4}
              fill={barColors?.[i] || B.info} opacity={0.85} />
            <text x={x + barW / 2} y={height - barH - 4} textAnchor="middle"
              fill={B.t2} fontSize="9" fontWeight="700" fontFamily={B.font}>{v}</text>
            {labels?.[i] && (
              <text x={x + barW / 2} y={height + 14} textAnchor="middle"
                fill={B.t3} fontSize="9" fontFamily={B.font}>{labels[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function PhoneFrame({ children }) {
  return (
    <div style={{
      width: 375, height: 760, borderRadius: 40,
      background: B.p0,
      border: `1.5px solid ${B.borderCrisp}`,
      overflow: "hidden", position: "relative",
      boxShadow: `0 0 60px rgba(110,198,255,.08), 0 25px 60px rgba(0,0,0,0.55)`,
    }}>
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 148, height: 26, background: B.p0, borderRadius: "0 0 18px 18px", zIndex: 20,
      }} />
      <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>{children}</div>
    </div>
  );
}

// ─── Topbar (matches .topbar from brand.css) ───
function Topbar({ streak = 3, units = 47 }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      padding: "14px 20px",
      background: `linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.008)), rgba(10,14,20,.88)`,
      borderBottom: `1px solid ${B.borderSoft}`,
      backdropFilter: "blur(8px) saturate(110%)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03)), ${B.surfaceElevated}`,
          border: `1px solid rgba(110,198,255,.22)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,.05), 0 4px 12px rgba(0,0,0,.2)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 120 120">
            <line x1="60" y1="20" x2="95" y2="55" stroke={B.info} strokeWidth="3" />
            <line x1="60" y1="20" x2="25" y2="55" stroke={B.info} strokeWidth="3" />
            <circle cx="60" cy="20" r="7" fill={B.info} />
            <circle cx="95" cy="55" r="7" fill={B.info} />
            <circle cx="25" cy="55" r="7" fill={B.info} />
          </svg>
        </div>
        <span style={{ color: B.t0, fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em", fontFamily: B.font }}>
          Capacity
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: B.amber400, fontSize: 13, fontWeight: 700, fontFamily: B.font }}>🔥 {streak}</span>
        <PillPrimary>Ψ {units}</PillPrimary>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// SCREENS
// ════════════════════════════════════════════

// 1. SPLASH
function SplashScreen() {
  const [pulse, setPulse] = useState(true);
  useEffect(() => { const i = setInterval(() => setPulse(p => !p), 1400); return () => clearInterval(i); }, []);
  return (
    <div style={{
      height: 760, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse at 50% 40%, rgba(110,198,255,.06), ${B.p0} 70%)`,
    }}>
      <div style={{ position: "relative", width: 120, height: 120, marginBottom: 28 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          {[[60,20,95,55],[60,20,25,55],[25,55,40,95],[95,55,80,95],[40,95,80,95]].map(([x1,y1,x2,y2],i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={B.info} strokeWidth="1" opacity="0.3" />
          ))}
          {[[60,20],[95,55],[25,55],[80,95],[40,95]].map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r={pulse && i%2===0 ? 6 : 4.5}
              fill={B.info} opacity={pulse && i%2===0 ? 1 : 0.55}
              style={{ transition: "all 1.1s ease" }} />
          ))}
        </svg>
      </div>
      <h1 style={{ fontFamily: B.font, fontSize: 28, fontWeight: 900, color: B.t0, letterSpacing: "-0.03em", margin: 0 }}>
        Capacity
      </h1>
      <p style={{ fontFamily: B.font, fontSize: 12, color: B.t3, marginTop: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Train your mind
      </p>
      <p style={{ fontFamily: B.font, fontSize: 11, color: B.t3, marginTop: 36, opacity: 0.6 }}>
        Tap anywhere or press Space
      </p>
    </div>
  );
}

// 2. HOME
function HomeScreen({ tier = 0, unlocked = false }) {
  const tier1 = tier === 1;
  const steps = tier1
    ? [
        { id: "reset", label: "Start any session", done: true },
        { id: "control", label: "Complete a Hub session", done: false, active: true },
        { id: "reason", label: "Complete a Relational session", done: false },
      ]
    : [{ id: "control", label: "Complete a Hub session", done: false, active: true }];

  return (
    <div style={{ minHeight: 760, background: B.p0, display: "flex", flexDirection: "column", fontFamily: B.font }}>
      <Topbar />
      <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        {/* Greeting */}
        <div>
          <h1 style={{ margin: "0 0 2px", font: `900 clamp(22px,4vw,28px)/1.05 ${B.font}`, letterSpacing: "-0.03em", color: B.t0 }}>
            Good morning
          </h1>
          <p style={{ margin: 0, color: B.t2, fontSize: 14 }}>
            {tier1 ? "Tier 1 — Reset · Control · Reason" : "Complete a Hub session today"}
          </p>
        </div>

        {/* Mission card (.card style) */}
        <div style={{
          borderRadius: B.radiusXl, padding: "22px 20px 18px",
          border: `1px solid ${B.border}`,
          background: cardBg,
          boxShadow: B.shadow,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Kicker>Daily Mission{tier1 ? " · Tier 1" : ""}</Kicker>
            <Pill color={B.lime400} bg={B.primarySoft} style={{ border: `1px solid rgba(204,255,102,.18)` }}>+3 bonus</Pill>
          </div>
          {steps.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${s.done ? B.lime400 : s.active ? B.info : B.borderCrisp}`,
                background: s.done ? B.lime400 : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: B.ink, flexShrink: 0,
              }}>
                {s.done && "✓"}
              </div>
              <span style={{
                color: s.done ? B.t3 : B.t0, fontSize: 14, fontWeight: s.active ? 700 : 400,
                textDecoration: s.done ? "line-through" : "none",
              }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <BtnPrimary>Start Recommended Session</BtnPrimary>
        <p style={{ color: B.t3, fontSize: 11, textAlign: "center", marginTop: -8 }}>
          ~10 min · Hub (category) · Level 2 recommended
        </p>

        {/* Mode selection */}
        <Kicker style={{ marginTop: 4 }}>Choose a mode</Kicker>

        {/* Hub modes */}
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { name: "Hub (category)", short: "cat" },
            { name: "Hub (non-cat)", short: "noncat" },
          ].map(m => (
            <div key={m.short} style={{
              flex: 1, borderRadius: B.radiusSm, padding: "14px 12px",
              border: `1px solid ${B.borderSoft}`, background: panelBg,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.02)", cursor: "pointer",
            }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>◉</div>
              <div style={{ color: B.t0, fontSize: 13, fontWeight: 700 }}>{m.name}</div>
              <div style={{ color: B.lime400, fontSize: 10, fontWeight: 700, marginTop: 2 }}>Available</div>
            </div>
          ))}
        </div>

        {/* Relational modes */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { name: "Transitive", icon: "⇋" },
            { name: "Graph", icon: "◈" },
            { name: "Propositional", icon: "⊃" },
          ].map(m => (
            <div key={m.name} style={{
              flex: 1, borderRadius: B.radiusSm, padding: "12px 6px", textAlign: "center",
              border: `1px solid ${B.borderSoft}`, background: unlocked ? panelBg : "transparent",
              opacity: unlocked ? 1 : 0.4, cursor: unlocked ? "pointer" : "default",
            }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{m.icon}</div>
              <div style={{ color: B.t0, fontSize: 11, fontWeight: 700 }}>{m.name}</div>
              {!unlocked && <div style={{ color: B.t3, fontSize: 9, marginTop: 2 }}>🔒</div>}
            </div>
          ))}
        </div>

        {/* Unlock progress (.note style) */}
        {!unlocked && (
          <div style={{
            borderRadius: B.radiusSm, padding: "12px 14px",
            border: `1px solid rgba(110,198,255,.28)`,
            background: `rgba(110,198,255,.08)`,
            color: B.t0,
          }}>
            <p style={{ fontSize: 12, margin: 0, fontFamily: B.font }}>
              <span style={{ color: B.lime400 }}>✓</span> Hub (cat) qualified&nbsp;&nbsp;
              <span style={{ color: B.t3 }}>○</span> Hub (non-cat) in progress
            </p>
            <p style={{ color: B.t3, fontSize: 11, margin: "3px 0 0" }}>
              Qualify in both Hub modes to unlock Relational
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. BRIEFING
function BriefingScreen({ blockNum = 1, n = 2, speed = "Slow", wrapper = "Category", interference = "None" }) {
  const isFirst = blockNum === 1;
  return (
    <div style={{
      height: 760, background: B.p0, display: "flex", flexDirection: "column",
      justifyContent: "flex-end", fontFamily: B.font,
    }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.1 }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="none" stroke={B.info} strokeWidth="1.5" />
          {[0,90,180,270].map(a => {
            const r2 = (a * Math.PI) / 180;
            return <circle key={a} cx={100+80*Math.cos(r2-Math.PI/2)} cy={100+80*Math.sin(r2-Math.PI/2)} r="10"
              fill={B.surfaceElevated} stroke={B.borderSoft} strokeWidth="1" />;
          })}
        </svg>
      </div>
      <div style={{
        borderRadius: `${B.radiusXl}px ${B.radiusXl}px 0 0`,
        borderTop: `1px solid ${B.border}`,
        background: cardGlassBg,
        boxShadow: `0 -14px 34px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.04)`,
        padding: isFirst ? "26px 24px 36px" : "18px 24px 30px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isFirst ? 16 : 10 }}>
          <span style={{ color: B.t2, fontSize: 13, fontWeight: 700 }}>Block {blockNum} of 10</span>
          <span style={{ color: B.t3, fontSize: 11 }}>T = {20 + n} trials</span>
        </div>
        {isFirst ? (
          <>
            <h3 style={{ color: B.t0, fontSize: 20, fontWeight: 900, margin: "0 0 5px", letterSpacing: "-0.02em" }}>
              Remember locations
            </h3>
            <p style={{ color: B.t1, fontSize: 14, margin: "0 0 20px", lineHeight: 1.45 }}>
              Watch where the dot appears. Press <strong style={{ color: B.t0 }}>Match</strong> when it's in the same position as {n} back.
            </p>
          </>
        ) : (
          <p style={{ color: B.t0, fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>
            {wrapper} · Level {n}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: isFirst ? 22 : 16 }}>
          {[
            { label: "Level", value: String(n) },
            { label: "Speed", value: speed },
            { label: "Type", value: wrapper },
            ...(interference !== "None" ? [{ label: "Lures", value: interference }] : []),
          ].map(d => (
            <div key={d.label} style={{
              background: B.p1, borderRadius: B.radiusXs, padding: "8px 14px",
              border: `1px solid ${B.borderSoft}`,
            }}>
              <div style={{ color: B.t3, fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>{d.label}</div>
              <div style={{ color: B.t0, fontSize: 16, fontWeight: 800 }}>{d.value}</div>
            </div>
          ))}
        </div>
        <BtnInfo>Start Block</BtnInfo>
      </div>
    </div>
  );
}

// 4. CUE PHASE
function CueScreen() {
  return (
    <div style={{
      height: 760, background: B.p0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", fontFamily: B.font,
    }}>
      <div style={{
        position: "absolute", top: 50, left: 22, right: 22,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: B.t3, fontSize: 12 }}>Block 2/10</span>
        <span style={{ color: B.t3, fontSize: 12 }}>Level 3</span>
        <PillPrimary style={{ fontSize: 11 }}>Ψ 12</PillPrimary>
      </div>
      <div style={{
        background: B.infoSoft, border: `1px solid rgba(110,198,255,.28)`,
        borderRadius: B.radius, padding: "24px 40px", textAlign: "center",
      }}>
        <Kicker style={{ marginBottom: 6 }}>Target</Kicker>
        <p style={{ color: B.info, fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: "-0.01em" }}>
          LOCATION
        </p>
      </div>
      <p style={{ color: B.t3, fontSize: 12, marginTop: 16 }}>Starting in 2s…</p>
    </div>
  );
}

// 5. GAMEPLAY
function GameplayScreen() {
  const [activePos, setActivePos] = useState(0);
  const [trial, setTrial] = useState(5);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const i = setInterval(() => {
      setActivePos(Math.floor(Math.random() * 4));
      setTrial(t => Math.min(t + 1, 23));
    }, 2400);
    return () => clearInterval(i);
  }, []);

  const positions = [
    { x: 150, y: 42 }, { x: 258, y: 150 }, { x: 150, y: 258 }, { x: 42, y: 150 },
  ];
  const totalTrials = 23;
  const progress = trial / totalTrials;

  return (
    <div style={{ height: 760, background: B.p0, display: "flex", flexDirection: "column", fontFamily: B.font }}>
      <div style={{ padding: "52px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: B.t3, fontSize: 12 }}>Block 2/10</span>
        <span style={{ color: B.t3, fontSize: 12 }}>Level 3</span>
        <PillPrimary style={{ fontSize: 11 }}>Ψ 12</PillPrimary>
      </div>
      {/* Trial progress */}
      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ height: 3, background: B.p2, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress*100}%`, background: B.info, borderRadius: 2, transition: "width 0.3s ease" }} />
        </div>
        <span style={{ color: B.t3, fontSize: 10, marginTop: 3, display: "block" }}>Trial {trial}/{totalTrials}</span>
      </div>

      {/* Circle */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="300" height="300" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r="120" fill="none"
            stroke={flash === "green" ? `${B.lime400}50` : B.borderSoft} strokeWidth="1.5"
            style={{ transition: "stroke 0.2s ease" }} />
          <circle cx="150" cy="150" r="38" fill="none" stroke={B.borderSoft} strokeWidth="0.5" opacity="0.2" />
          {positions.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={activePos === i ? 22 : 14}
                fill={activePos === i ? B.info : B.surfaceElevated}
                stroke={activePos === i ? B.blue400 : B.borderSoft}
                strokeWidth={activePos === i ? 2 : 1}
                style={{ transition: "all 0.15s ease" }} />
              {activePos === i && (
                <circle cx={p.x} cy={p.y} r={30} fill="none" stroke={B.info} strokeWidth="1" opacity="0.2" />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Coach notice */}
      <div style={{ padding: "0 28px 8px", textAlign: "center" }}>
        <span style={{ color: B.t3, fontSize: 11, fontStyle: "italic" }}>Stabilise block</span>
      </div>

      {/* Match button */}
      <div style={{ padding: "0 28px 44px" }}>
        <button onClick={() => { setFlash("green"); setTimeout(() => setFlash(null), 280); }}
          style={{
            width: "100%", padding: "20px 0", borderRadius: B.radiusSm,
            border: `2px solid ${flash === "green" ? B.lime400 : `rgba(110,198,255,.35)`}`,
            background: flash === "green" ? `rgba(204,255,102,.10)` : B.infoSoft,
            color: flash === "green" ? B.lime400 : B.t0,
            fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: B.font,
            letterSpacing: "0.05em", textTransform: "uppercase",
            transition: "all 0.15s ease",
          }}>
          Match
        </button>
      </div>
    </div>
  );
}

// 6. QUIZ (Relational)
function QuizScreen() {
  const [sel, setSel] = useState(null);
  return (
    <div style={{ height: 760, background: B.p0, display: "flex", flexDirection: "column", fontFamily: B.font, padding: "52px 22px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ color: B.t3, fontSize: 12 }}>Block 4/10</span>
        <Pill color={B.amber400} bg="rgba(255,196,120,.12)" style={{ border: `1px solid rgba(255,196,120,.2)` }}>Quiz</Pill>
      </div>
      <p style={{ color: B.t3, fontSize: 11, margin: "0 0 20px" }}>Question 1 of 2</p>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          borderRadius: B.radiusXl, border: `1px solid ${B.border}`, padding: "24px 24px",
          background: cardBg, boxShadow: B.shadow,
          textAlign: "center", marginBottom: 32, width: "100%",
        }}>
          <Kicker style={{ marginBottom: 10 }}>Is this true?</Kicker>
          <p style={{ color: B.t0, fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.4 }}>
            A &gt; B, &nbsp; B &gt; C
          </p>
          <p style={{ color: B.info, fontSize: 17, fontWeight: 700, margin: "12px 0 0" }}>
            Therefore A &gt; C?
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          {["True", "False"].map(opt => (
            <button key={opt} onClick={() => setSel(opt)} style={{
              flex: 1, padding: "18px 0", borderRadius: B.radiusSm, fontFamily: B.font,
              border: `2px solid ${sel === opt ? (opt === "True" ? B.lime400 : B.red400) : B.border}`,
              background: sel === opt ? (opt === "True" ? B.primarySoft : "rgba(255,140,140,.10)") :
                `linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.02))`,
              color: sel === opt ? (opt === "True" ? B.lime400 : B.red400) : B.t0,
              fontSize: 16, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s ease",
            }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ height: 3, background: B.p2, borderRadius: 2 }}>
          <div style={{ height: "100%", width: "65%", background: B.amber400, borderRadius: 2 }} />
        </div>
        <p style={{ color: B.t3, fontSize: 10, margin: "4px 0 0", textAlign: "right" }}>6.5s remaining</p>
      </div>
    </div>
  );
}

// 7. BLOCK RESULT — HUB
function BlockResultHub({ showOverride = true }) {
  const hits = 6, misses = 1, fas = 1, crs = 15;
  const total = hits + misses + fas + crs;
  const acc = Math.round(((hits + crs) / total) * 100);
  const ringColor = acc >= 90 ? B.lime400 : acc >= 75 ? B.info : B.red400;
  const r = 54;

  return (
    <div style={{ minHeight: 760, background: B.p0, padding: "52px 20px 28px", display: "flex", flexDirection: "column", fontFamily: B.font }}>
      <div style={{ flex: 1 }}>
        <Kicker style={{ marginBottom: 6 }}>Block 5 Complete</Kicker>
        <h2 style={{ color: B.t0, fontSize: 24, fontWeight: 900, margin: "0 0 20px", letterSpacing: "-0.03em" }}>
          Solid round
        </h2>

        {/* Accuracy ring */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ position: "relative", width: 130, height: 130 }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r={r} fill="none" stroke={B.surfaceElevated} strokeWidth="7" />
              <circle cx="65" cy="65" r={r} fill="none" stroke={ringColor}
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*r*(acc/100)} ${2*Math.PI*r}`}
                transform="rotate(-90 65 65)" />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: B.t0, fontSize: 30, fontWeight: 900 }}>{acc}%</span>
              <span style={{ color: B.t3, fontSize: 10 }}>accuracy</span>
            </div>
          </div>
        </div>

        {/* Outcome */}
        <div style={{
          borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`, background: panelBg,
          padding: "14px 16px", marginBottom: 10, textAlign: "center",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.02)",
        }}>
          <p style={{ color: B.t0, fontSize: 14, fontWeight: 700, margin: 0 }}>
            {acc >= 90 ? "⬆ Level up to 4" : acc >= 75 ? "Level stays at 3" : "⬇ Level drops to 2"}
          </p>
          <p style={{ color: B.t3, fontSize: 11, margin: "3px 0 0" }}>
            {acc >= 90 ? "Great accuracy — moving up" : "Reach 90% to level up"}
          </p>
        </div>

        {/* Hit/Miss/FA */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <StatBox label="Hits" value={hits} color={B.lime400} small />
          <StatBox label="Misses" value={misses} color={B.red400} small />
          <StatBox label="False Alarms" value={fas} color={B.amber400} small />
        </div>

        {/* RT + Lures + Lapses */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <StatBox label="Avg RT" value="842ms" small />
          <StatBox label="Lure FAs" value="1/3" color={B.amber400} small />
          <StatBox label="Lapses" value="0" color={B.lime400} small />
        </div>

        {/* Clean block */}
        {misses === 0 && fas === 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            background: B.primarySoft, border: `1px solid rgba(204,255,102,.18)`,
            borderRadius: B.radiusSm, padding: "10px 14px", marginBottom: 10,
          }}>
            <span style={{ fontSize: 15 }}>✦</span>
            <div>
              <p style={{ color: B.lime400, fontSize: 12, fontWeight: 700, margin: 0 }}>Clean Block</p>
              <p style={{ color: B.t3, fontSize: 10, margin: 0 }}>No lapses, no error bursts</p>
            </div>
          </div>
        )}

        {/* Earned */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`, background: panelBg,
          padding: "10px 14px", marginBottom: 12,
        }}>
          <span style={{ color: B.t3, fontSize: 12 }}>Block earned</span>
          <span style={{ color: B.lime400, fontSize: 14, fontWeight: 800 }}>
            {acc >= 90 ? "+2 Ψ" : acc >= 75 ? "+1 Ψ" : "+0 Ψ"}
          </span>
        </div>

        {/* Coach override */}
        {showOverride && (
          <div style={{
            borderRadius: B.radiusSm, padding: "14px 16px", marginBottom: 12,
            border: `1px solid rgba(110,198,255,.28)`, background: `rgba(110,198,255,.08)`,
          }}>
            <Kicker style={{ marginBottom: 5, fontSize: 10 }}>Coach suggests</Kicker>
            <p style={{ color: B.t0, fontSize: 13, fontWeight: 700, margin: "0 0 3px" }}>
              Speed pulse next block
            </p>
            <p style={{ color: B.t2, fontSize: 11, margin: "0 0 12px" }}>
              Next: Level 3 · Fast · Category
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <BtnInfo style={{ padding: "11px 0", fontSize: 13 }}>Accept Coach</BtnInfo>
              <BtnSecondary style={{ padding: "11px 0", fontSize: 13 }}>Try Alternative</BtnSecondary>
            </div>
          </div>
        )}
      </div>
      <BtnPrimary>Next Block</BtnPrimary>
    </div>
  );
}

// 8. BLOCK RESULT — RELATIONAL
function BlockResultRelational() {
  const acc = 82;
  const r = 54;
  return (
    <div style={{ minHeight: 760, background: B.p0, padding: "52px 20px 28px", display: "flex", flexDirection: "column", fontFamily: B.font }}>
      <div style={{ flex: 1 }}>
        <Kicker style={{ marginBottom: 6 }}>Block 3 Complete · Transitive</Kicker>
        <h2 style={{ color: B.t0, fontSize: 24, fontWeight: 900, margin: "0 0 20px", letterSpacing: "-0.03em" }}>
          Good effort
        </h2>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ position: "relative", width: 130, height: 130 }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r={r} fill="none" stroke={B.surfaceElevated} strokeWidth="7" />
              <circle cx="65" cy="65" r={r} fill="none" stroke={B.info}
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*r*(acc/100)} ${2*Math.PI*r}`}
                transform="rotate(-90 65 65)" />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: B.t0, fontSize: 30, fontWeight: 900 }}>{acc}%</span>
              <span style={{ color: B.t3, fontSize: 10 }}>accuracy</span>
            </div>
          </div>
        </div>
        <div style={{
          borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`, background: panelBg,
          padding: "14px 16px", marginBottom: 10, textAlign: "center",
        }}>
          <p style={{ color: B.t0, fontSize: 14, fontWeight: 700, margin: 0 }}>Level stays at 2</p>
          <p style={{ color: B.t3, fontSize: 11, margin: "3px 0 0" }}>Relational max level: 3</p>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <StatBox label="Hits" value="5" color={B.lime400} small />
          <StatBox label="Misses" value="1" color={B.red400} small />
          <StatBox label="False Alarms" value="2" color={B.amber400} small />
        </div>
        {/* Quiz score */}
        <div style={{
          background: "rgba(255,196,120,.08)", border: `1px solid rgba(255,196,120,.22)`,
          borderRadius: B.radiusSm, padding: "12px 16px", marginBottom: 8,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ color: B.amber400, fontSize: 12, fontWeight: 700, margin: 0 }}>Quiz Score</p>
            <p style={{ color: B.t3, fontSize: 10, margin: "2px 0 0" }}>Relational reasoning check</p>
          </div>
          <span style={{ color: B.amber400, fontSize: 22, fontWeight: 900 }}>2/2</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <StatBox label="Avg RT" value="1.2s" small />
          <StatBox label="Lapses" value="0" color={B.lime400} small />
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`, background: panelBg,
          padding: "10px 14px",
        }}>
          <span style={{ color: B.t3, fontSize: 12 }}>Block earned</span>
          <span style={{ color: B.lime400, fontSize: 14, fontWeight: 800 }}>+1 Ψ</span>
        </div>
      </div>
      <BtnPrimary style={{ marginTop: 16 }}>Next Block</BtnPrimary>
    </div>
  );
}

// 9. SESSION COMPLETE
function SessionCompleteScreen() {
  const nData = [2,2,3,3,3,4,4,3,3,3];
  const accData = [95,87,91,83,78,92,88,72,85,87];
  const outcomes = ["UP","HOLD","UP","HOLD","HOLD","UP","HOLD","DOWN","HOLD","HOLD"];
  const oColors = outcomes.map(o => o === "UP" ? B.lime400 : o === "DOWN" ? B.red400 : B.info);

  return (
    <div style={{
      minHeight: 760,
      background: `radial-gradient(ellipse at 50% 20%, rgba(110,198,255,.06), ${B.p0} 65%)`,
      padding: "52px 20px 28px", display: "flex", flexDirection: "column", fontFamily: B.font,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>✨</div>
          <h2 style={{ color: B.t0, fontSize: 24, fontWeight: 900, margin: "0 0 3px", letterSpacing: "-0.03em" }}>
            Session Complete
          </h2>
          <p style={{ color: B.t2, fontSize: 13, margin: 0 }}>Hub (category) · 10 blocks</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Peak Level", value: "4", color: B.info },
            { label: "Final Level", value: "3", color: B.t0 },
            { label: "Stability", value: "7/10", color: B.lime400 },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`,
              background: panelBg, padding: "12px 8px", textAlign: "center",
            }}>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 900 }}>{s.value}</div>
              <div style={{ color: B.t3, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 3 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* N-level graph */}
        <div style={{
          borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`, background: panelBg,
          padding: "14px 14px 8px", marginBottom: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ color: B.t3, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Level across blocks
            </span>
            <span style={{ color: B.info, fontSize: 11, fontWeight: 700 }}>Peak: 4</span>
          </div>
          <MiniGraph data={nData} color={B.info} height={54} yMin={1} yMax={5} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 12px 0" }}>
            <span style={{ color: B.t3, fontSize: 9 }}>B1</span>
            <span style={{ color: B.t3, fontSize: 9 }}>B10</span>
          </div>
        </div>

        {/* Accuracy bars */}
        <div style={{
          borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`, background: panelBg,
          padding: "14px 14px 4px", marginBottom: 12,
        }}>
          <span style={{ color: B.t3, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Accuracy by block
          </span>
          <BarChart data={accData} labels={["1","2","3","4","5","6","7","8","9","10"]} colors={oColors} height={60} />
          <div style={{ display: "flex", gap: 14, justifyContent: "center", padding: "4px 0 4px" }}>
            {[["⬆","Up",B.lime400],["—","Hold",B.info],["⬇","Down",B.red400]].map(([ic,lb,c]) => (
              <span key={lb} style={{ color: c, fontSize: 9, fontWeight: 700 }}>{ic} {lb}</span>
            ))}
          </div>
        </div>

        {/* Economy */}
        <div style={{
          borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`, background: panelBg,
          padding: "14px 16px", marginBottom: 10,
        }}>
          {[["Session earned","+12 Ψ",B.t0],["Mission bonus","+3 Ψ",B.lime400]].map(([l,v,c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: B.t3, fontSize: 12 }}>{l}</span>
              <span style={{ color: c, fontSize: 13, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
          <div style={{ height: 1, background: B.borderSoft, margin: "5px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: B.t0, fontSize: 13, fontWeight: 700 }}>Total bank</span>
            <span style={{ color: B.lime400, fontSize: 15, fontWeight: 900 }}>Ψ 62</span>
          </div>
        </div>

        {/* Streak */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "10px", background: "rgba(255,196,120,.08)", borderRadius: B.radiusSm,
          border: `1px solid rgba(255,196,120,.18)`,
        }}>
          <span style={{ fontSize: 17 }}>🔥</span>
          <span style={{ color: B.amber400, fontSize: 14, fontWeight: 700 }}>4 day streak</span>
          <span style={{ color: B.t3, fontSize: 11 }}>(best: 5)</span>
        </div>
      </div>
      <BtnPrimary style={{ marginTop: 14 }}>Done</BtnPrimary>
    </div>
  );
}

// 10. UNLOCK
function UnlockScreen() {
  return (
    <div style={{
      height: 760,
      background: `radial-gradient(ellipse at 50% 40%, rgba(110,198,255,.08), ${B.p0} 60%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: B.font, padding: "0 28px", textAlign: "center",
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(110,198,255,.18) 0%, transparent 70%)`,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
      }}>
        <div style={{ fontSize: 42 }}>🎉</div>
      </div>
      <h2 style={{ color: B.t0, fontSize: 26, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.03em" }}>
        New Modes Unlocked
      </h2>
      <p style={{ color: B.t1, fontSize: 13, margin: "0 0 28px", lineHeight: 1.45 }}>
        You've qualified in both Hub modes. Relational training is now available.
      </p>
      <div style={{ display: "flex", gap: 9, marginBottom: 32, width: "100%" }}>
        {[
          { name: "Transitive", icon: "⇋" },
          { name: "Graph", icon: "◈" },
          { name: "Propositional", icon: "⊃" },
        ].map(m => (
          <div key={m.name} style={{
            flex: 1, borderRadius: B.radiusSm, padding: "14px 6px", textAlign: "center",
            border: `1px solid rgba(110,198,255,.22)`,
            background: `linear-gradient(180deg, rgba(78,160,232,.08), rgba(15,18,26,.96))`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
            <div style={{ color: B.t0, fontSize: 11, fontWeight: 700 }}>{m.name}</div>
          </div>
        ))}
      </div>
      <BtnInfo style={{ marginBottom: 10 }}>Try Relational Mode</BtnInfo>
      <BtnGhost>Return Home</BtnGhost>
    </div>
  );
}

// 11. HISTORY
function HistoryScreen() {
  const sessions = [
    { date: "Today", mode: "Hub (cat)", peak: 4, acc: 87, units: 12 },
    { date: "Yesterday", mode: "Hub (cat)", peak: 3, acc: 84, units: 10 },
    { date: "Feb 27", mode: "Hub (noncat)", peak: 3, acc: 79, units: 8 },
    { date: "Feb 26", mode: "Hub (cat)", peak: 3, acc: 86, units: 11 },
    { date: "Feb 25", mode: "Hub (cat)", peak: 2, acc: 81, units: 9 },
  ];
  return (
    <div style={{ minHeight: 760, background: B.p0, padding: "52px 20px 28px", display: "flex", flexDirection: "column", fontFamily: B.font }}>
      <h2 style={{ color: B.t0, fontSize: 22, fontWeight: 900, margin: "0 0 3px", letterSpacing: "-0.03em" }}>Progress</h2>
      <p style={{ color: B.t2, fontSize: 13, margin: "0 0 18px" }}>Your training history</p>

      <div style={{
        borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`, background: panelBg,
        padding: "14px 14px 8px", marginBottom: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ color: B.t3, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Peak level over sessions
          </span>
          <span style={{ color: B.info, fontSize: 11, fontWeight: 700 }}>Peak: 4</span>
        </div>
        <MiniGraph data={[2,2,3,3,4]} color={B.info} height={54} yMin={1} yMax={6} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 12px 0" }}>
          <span style={{ color: B.t3, fontSize: 9 }}>5 sessions ago</span>
          <span style={{ color: B.t3, fontSize: 9 }}>Today</span>
        </div>
      </div>

      <div style={{
        borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`, background: panelBg,
        padding: "14px 14px 8px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ color: B.t3, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Session accuracy trend
          </span>
          <span style={{ color: B.lime400, fontSize: 11, fontWeight: 700 }}>87% latest</span>
        </div>
        <MiniGraph data={[81,86,79,84,87]} color={B.lime400} height={54} yMin={60} yMax={100} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 12px 0" }}>
          <span style={{ color: B.t3, fontSize: 9 }}>5 sessions ago</span>
          <span style={{ color: B.t3, fontSize: 9 }}>Today</span>
        </div>
      </div>

      <Kicker style={{ marginBottom: 8 }}>Recent Sessions</Kicker>
      {sessions.map((s, i) => (
        <div key={i} style={{
          borderRadius: B.radiusSm, border: `1px solid ${B.borderSoft}`, background: panelBg,
          padding: "12px 14px", marginBottom: 6,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ color: B.t0, fontSize: 13, fontWeight: 700 }}>{s.mode}</div>
            <div style={{ color: B.t3, fontSize: 10, marginTop: 1 }}>{s.date} · 10 blocks</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: B.info, fontSize: 14, fontWeight: 800 }}>Peak {s.peak}</div>
            <div style={{ color: B.t3, fontSize: 10 }}>{s.acc}% avg · +{s.units} Ψ</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══ SCREEN REGISTRY ═══
const SCREENS = [
  { id: "splash", label: "Splash", C: SplashScreen },
  { id: "home-t0", label: "Home (T0)", C: () => <HomeScreen tier={0} unlocked={false} /> },
  { id: "home-t1", label: "Home (T1)", C: () => <HomeScreen tier={1} unlocked={true} /> },
  { id: "brief-1", label: "Briefing 1st", C: () => <BriefingScreen blockNum={1} n={2} speed="Slow" wrapper="Category" /> },
  { id: "brief-m", label: "Briefing Mid", C: () => <BriefingScreen blockNum={5} n={3} speed="Fast" wrapper="Category" interference="High" /> },
  { id: "cue", label: "Cue", C: CueScreen },
  { id: "play", label: "Gameplay", C: GameplayScreen },
  { id: "quiz", label: "Quiz", C: QuizScreen },
  { id: "res-hub", label: "Result Hub", C: () => <BlockResultHub showOverride={true} /> },
  { id: "res-rel", label: "Result Rel", C: BlockResultRelational },
  { id: "session", label: "Session Done", C: SessionCompleteScreen },
  { id: "unlock", label: "Unlock", C: UnlockScreen },
  { id: "history", label: "History", C: HistoryScreen },
];

// ═══ MAIN ═══
export default function CapacityGymBrand() {
  const [idx, setIdx] = useState(0);
  const Scr = SCREENS[idx].C;

  return (
    <div style={{
      minHeight: "100vh", background: B.pageLight,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "20px 12px", fontFamily: B.font,
    }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap",
        justifyContent: "center", maxWidth: 660,
      }}>
        {SCREENS.map((s, i) => (
          <button key={s.id} onClick={() => setIdx(i)} style={{
            padding: "6px 10px", borderRadius: B.radiusXs,
            border: `1px solid ${idx === i ? B.info : "#c0c8d4"}`,
            background: idx === i ? B.infoSoft : "rgba(255,255,255,.6)",
            color: idx === i ? B.infoStrong : "#5a6677",
            fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: B.font,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      <PhoneFrame><Scr /></PhoneFrame>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setIdx(Math.max(0, idx - 1))} style={{
          width: 36, height: 36, borderRadius: B.radiusXs, border: `1px solid #c0c8d4`,
          background: "rgba(255,255,255,.7)", color: "#5a6677", fontSize: 15, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>←</button>
        <span style={{ color: "#8a95a6", fontSize: 11, minWidth: 65, textAlign: "center" }}>
          {idx + 1} / {SCREENS.length}
        </span>
        <button onClick={() => setIdx(Math.min(SCREENS.length - 1, idx + 1))} style={{
          width: 36, height: 36, borderRadius: B.radiusXs, border: `1px solid #c0c8d4`,
          background: "rgba(255,255,255,.7)", color: "#5a6677", fontSize: 15, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>→</button>
      </div>
    </div>
  );
}
