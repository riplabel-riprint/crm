"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 2600);
    const t3 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <>
      <style precedence="default">{`
        @keyframes splash-line {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        @keyframes splash-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes splash-glow-pulse {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50%       { opacity: 0.28; transform: scale(1.06); }
        }
        @keyframes splash-logo-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes grain {
          0%, 100% { transform: translate(0,0); }
          10%      { transform: translate(-2%,-3%); }
          30%      { transform: translate(3%,2%); }
          50%      { transform: translate(-1%,4%); }
          70%      { transform: translate(2%,-2%); }
          90%      { transform: translate(-3%,1%); }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-montserrat), sans-serif",
          transition: phase === "exit" ? "opacity 0.6s ease, transform 0.6s ease" : "none",
          opacity: phase === "exit" ? 0 : 1,
          transform: phase === "exit" ? "scale(1.04)" : "scale(1)",
          pointerEvents: phase === "exit" ? "none" : "all",
        }}
      >
        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.045,
        }} />

        {/* Orange radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(251,113,28,0.26) 0%, rgba(234,88,12,0.10) 50%, transparent 72%)",
          animation: "splash-glow-pulse 3s ease-in-out infinite",
        }} />

        {/* Grain overlay */}
        <div style={{
          position: "absolute", inset: "-50%", pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          animation: "grain 0.8s steps(1) infinite",
        }} />

        {/* Center content */}
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          transition: "opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)",
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "translateY(16px)" : "translateY(0)",
        }}>

          {/* Logo container */}
          <div style={{
            position: "relative",
            marginBottom: "32px",
            animation: phase === "hold" ? "splash-logo-float 4s ease-in-out infinite" : "none",
          }}>
            {/* Logo glow halo */}
            <div style={{
              position: "absolute",
              inset: "-24px",
              background: "radial-gradient(ellipse at center, rgba(251,113,28,0.20) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(16px)",
            }} />
            <img
              src="https://projektowanieprzemysl.pl/wp-content/uploads/2025/12/Projekt-bez-nazwy-3.png.webp"
              alt="Projektowanie Przemyśl"
              style={{
                height: "64px",
                width: "auto",
                objectFit: "contain",
                position: "relative",
                filter: "drop-shadow(0 0 20px rgba(251,113,28,0.35)) brightness(1.05)",
              }}
            />
          </div>

          {/* Divider line */}
          <div style={{
            width: "1px",
            height: "40px",
            background: "linear-gradient(to bottom, rgba(251,113,28,0.6), transparent)",
            marginBottom: "24px",
            transformOrigin: "top",
            animation: phase === "hold" ? "splash-line 0.6s ease forwards" : "none",
          }} />

          {/* Wordmark */}
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0px",
            marginBottom: "10px",
          }}>
            <span style={{
              fontSize: "32px",
              fontWeight: 800,
              letterSpacing: "0.10em",
              color: "#ffffff",
              lineHeight: 1,
              textTransform: "uppercase",
            }}>Projektowanie </span>
            <span style={{
              fontSize: "32px",
              fontWeight: 800,
              letterSpacing: "0.10em",
              color: "rgba(251,113,28,1)",
              lineHeight: 1,
              textTransform: "uppercase",
            }}>Przemyśl</span>
          </div>

          {/* Tagline */}
          <p style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.32em",
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            marginBottom: "48px",
          }}>
            Panel operacyjny drukarni
          </p>

          {/* Progress bar */}
          <div style={{
            width: "160px",
            height: "1px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "1px",
            overflow: "hidden",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, rgba(251,113,28,0.5), rgba(251,113,28,1))",
              transformOrigin: "left",
              animation: phase === "hold" ? "splash-progress 2.2s cubic-bezier(0.4,0,0.2,1) forwards" : "none",
            }} />
          </div>

        </div>

        {/* Bottom version tag */}
        <div style={{
          position: "absolute",
          bottom: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "9px",
          fontWeight: 500,
          letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.18)",
          textTransform: "uppercase",
          transition: "opacity 0.8s ease",
          opacity: phase === "enter" ? 0 : 1,
          fontFamily: "var(--font-montserrat), sans-serif",
          whiteSpace: "nowrap",
        }}>
          Projektowanie Przemyśl © 2025
        </div>
      </div>
    </>
  );
}
