import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import confetti from "canvas-confetti";
import { ArrowUpRight, UserRound, Trophy } from "lucide-react";
import type { State, Player, ShowEvent } from "./auction";
export function Brand({ className = "" }: { className?: string }) {
  return (
    <img
      className={`brand-logo ${className}`}
      src="/bid-xi-logo.png"
      alt="Bid XI · Cricket auction"
    />
  );
}
function PlayerPhoto({ p }: { p: Player | undefined }) {
  return p?.photo ? (
    <img className="broadcast-photo" src={p.photo} alt={p.name} />
  ) : (
    <div className="photo-placeholder">
      <UserRound strokeWidth={0.8} />
      <span>
        {p?.name
          .split(" ")
          .map((x) => x[0])
          .join("") || "XI"}
      </span>
      <small>Add a player photo in Player pool</small>
    </div>
  );
}
export default function Broadcast({
  s,
  event,
}: {
  s: State;
  event: ShowEvent | null;
}) {
  const root = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"shuffle" | "sold" | "unsold" | "idle">(
      "idle",
    ),
    [candidate, setCandidate] = useState(0);
  const p = s.players.find((p) => p.id === s.active),
    t = s.teams.find((t) => t.id === (p?.status === "sold" ? p.team : s.team));
  const cfg = s.settings;
  useEffect(() => {
    if (!event || Date.now() - event.at > event.duration + 1500) {
      setPhase("idle");
      return;
    }
    const left = Math.max(0, event.duration - (Date.now() - event.at));
    setPhase(
      event.kind === "shuffle"
        ? "shuffle"
        : event.kind === "sold"
          ? "sold"
          : event.kind === "unsold"
            ? "unsold"
            : "idle",
    );
    const tick =
      event.kind === "shuffle"
        ? setInterval(() => setCandidate((n) => n + 1), 115)
        : undefined;
    const end = setTimeout(() => {
      setPhase("idle");
      if (tick) clearInterval(tick);
    }, left);
    return () => {
      clearTimeout(end);
      if (tick) clearInterval(tick);
    };
  }, [event?.id]);
  useEffect(() => {
    if (!root.current || reduced) return;
    const ctx = gsap.context(() => {
      if (phase === "shuffle") {
        gsap.fromTo(
          ".shuffle-heading",
          { y: 35, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
        );
        gsap.fromTo(
          ".shuffle-tile",
          { y: 90, rotateY: 35, opacity: 0 },
          {
            y: 0,
            rotateY: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.7,
            ease: "power3.out",
          },
        );
        gsap.to(".cricket-ball", {
          rotation: 720,
          y: -18,
          repeat: -1,
          yoyo: true,
          duration: 1.5,
          ease: "sine.inOut",
        });
      } else if (phase === "sold") {
        gsap.fromTo(
          ".result-panel",
          { scale: 0.8, y: 70, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.8, ease: "expo.out" },
        );
        gsap.fromTo(
          ".sold-stamp",
          { scale: 2.2, rotation: -12, opacity: 0 },
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.65,
            ease: "back.out(1.6)",
            delay: 0.2,
          },
        );
        gsap.fromTo(
          ".result-detail",
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.12,
            delay: 0.7,
            ease: "power3.out",
          },
        );
      } else if (phase === "unsold") {
        gsap.fromTo(
          ".result-panel",
          { y: 45, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, ease: "power3.out" },
        );
      } else {
        gsap
          .timeline()
          .fromTo(
            ".broadcast-portrait",
            { x: cfg.portraitSide === "right" ? 55 : -55, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          )
          .fromTo(
            ".reveal-line",
            { y: 35, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              stagger: 0.1,
              ease: "power3.out",
            },
            0.15,
          );
      }
    }, root);
    return () => ctx.revert();
  }, [phase, p?.id, reduced, cfg.portraitSide]);
  useEffect(() => {
    if (phase !== "sold" || !canvas.current || reduced) return;
    const burst = confetti.create(canvas.current, { resize: true });
    burst({
      particleCount: 100,
      spread: 95,
      origin: { y: 0.45 },
      colors: [cfg.accent, "#ffffff", t?.color || "#73a9ff"],
      disableForReducedMotion: true,
    });
    const timer = setTimeout(
      () =>
        burst({
          particleCount: 60,
          spread: 110,
          origin: { y: 0.6 },
          colors: [cfg.accent, "#ffffff"],
        }),
      500,
    );
    return () => {
      clearTimeout(timer);
      burst.reset();
    };
  }, [phase, event?.id, reduced]);
  const pool = (event?.pool || [])
    .map((id) => s.players.find((p) => p.id === id))
    .filter(Boolean) as Player[];
  return (
    <div
      ref={root}
      className={`broadcast-card frame-${cfg.template} portrait-${cfg.portraitSide} font-${cfg.font}`}
      style={
        {
          "--frame-bg": cfg.background,
          "--accent": cfg.accent,
          "--team-color": t?.color || cfg.accent,
          "--photo-fit": cfg.photoFit,
          "--photo-position": cfg.photoPosition,
          backgroundImage: cfg.backgroundImage
            ? `linear-gradient(90deg,${cfg.background}e6,${cfg.background}b3),url(${cfg.backgroundImage})`
            : undefined,
        } as React.CSSProperties
      }
    >
      <div className="broadcast-top">
        <div className="broadcast-brand">
          {cfg.logo ? <img src={cfg.logo} alt="Tournament logo" /> : <Brand />}
        </div>
        <div>
          <strong>{cfg.name}</strong>
          <span>{cfg.season} · PLAYER AUCTION</span>
        </div>
        <span className="live-indicator">
          <i /> LIVE
        </span>
      </div>
      <div className="broadcast-grid">
        <div className="broadcast-portrait">
          <span className="jersey-outline">
            {p
              ? String(s.players.findIndex((x) => x.id === p.id) + 1).padStart(
                  2,
                  "0",
                )
              : "XI"}
          </span>
          <PlayerPhoto p={p} />
          <div className="portrait-ribbon">
            <span>
              PLAYER{" "}
              {p
                ? "#" +
                  String(
                    s.players.findIndex((x) => x.id === p.id) + 1,
                  ).padStart(3, "0")
                : "POOL"}
            </span>
            <ArrowUpRight size={18} />
          </div>
        </div>
        <div className="broadcast-info">
          <div className="reveal-line on-block">
            <span />{" "}
            {p?.status === "sold"
              ? "WELCOME TO THE TEAM"
              : p?.status === "unsold"
                ? "AVAILABLE NEXT ROUND"
                : "NEXT UP. YOUR NEXT MATCH-WINNER."}
          </div>
          <h2 className="reveal-line">
            {p?.name.split(" ")[0] || "Your next"}
            <br />
            <em>{p?.name.split(" ").slice(1).join(" ") || "match-winner"}</em>
          </h2>
          <div className="reveal-line info-tags">
            {cfg.showRole && <span>{p?.role || "Ready for auction"}</span>}
            {cfg.showCountry && <span>{p?.country || "Your tournament"}</span>}
          </div>
          {cfg.showBase && (
            <div className="reveal-line base-line">
              BASE PRICE{" "}
              <strong>
                {cfg.currency} {(p?.base || 0).toLocaleString()}
              </strong>
            </div>
          )}
          <div className="reveal-line broadcast-bid">
            <span>{p?.status === "sold" ? "FINAL PRICE" : "CURRENT BID"}</span>
            <motion.strong
              key={s.bid}
              initial={reduced ? false : { y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <small>{cfg.currency}</small>{" "}
              {(p?.status === "sold" ? p.price || 0 : s.bid).toLocaleString()}
            </motion.strong>
            <div className="broadcast-team">
              <span style={{ background: t?.color }}>{t?.short || "XI"}</span>
              <div>
                <strong>{t?.name || "Choose a team"}</strong>
                <small>
                  {p?.status === "sold" ? "WINNING TEAM" : "LEADING TEAM"}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="broadcast-bottom">
        <span>
          {cfg.sponsor
            ? `PRESENTED BY ${cfg.sponsor}`
            : "BUILD YOUR WINNING XI."}
        </span>
        {cfg.sponsorLogo && <img src={cfg.sponsorLogo} alt="Sponsor" />}
        <span>CRICKET. COMMUNITY. COMPETITION.</span>
      </div>
      <AnimatePresence>
        {phase === "shuffle" && (
          <motion.div
            key="shuffle"
            className="shuffle-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="shuffle-heading">
              <div className="cricket-ball">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="32" cy="32" r="29" fill="#ed624a" />
                  <path
                    d="M22 5C48 22 15 42 42 59M27 3C54 22 20 43 47 57"
                    fill="none"
                    stroke="#fff4dd"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                </svg>
              </div>
              <span>FROM THE PLAYER POOL</span>
              <h3>Who’s next?</h3>
              <p>{pool.length} players. One big moment.</p>
            </div>
            <div className="shuffle-deck">
              {[-1, 0, 1].map((offset, i) => {
                const x = pool[(candidate + i) % Math.max(pool.length, 1)];
                return (
                  <motion.div
                    className={`shuffle-tile tile-${offset}`}
                    key={offset}
                    animate={reduced ? {} : { y: [0, -8, 0] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    <PlayerPhoto p={x} />
                    <div>
                      <span>{x?.role}</span>
                      <strong>{x?.name || "Selecting player"}</strong>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="selection-progress">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: Math.max(
                    0,
                    (event!.duration - (Date.now() - event!.at)) / 1000,
                  ),
                  ease: "linear",
                }}
              />
            </div>
          </motion.div>
        )}
        {(phase === "sold" || phase === "unsold") && (
          <motion.div
            key="result"
            className={`result-scene ${phase}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <canvas ref={canvas} className="confetti-canvas" />
            <div className="result-panel">
              <div className="result-photo">
                <PlayerPhoto p={p} />
              </div>
              <div className="result-copy">
                <span className="result-detail">
                  {phase === "sold"
                    ? "A NEW TEAM. A NEW CHAPTER."
                    : "THE STORY ISN’T OVER."}
                </span>
                <h3 className="sold-stamp">
                  {phase === "sold" ? "SOLD!" : "UNSOLD"}
                </h3>
                <h4 className="result-detail">{p?.name}</h4>
                <div className="result-detail result-team">
                  {phase === "sold" ? (
                    <>
                      <Trophy size={20} />
                      {t?.name}
                    </>
                  ) : (
                    "Returns in the unsold round"
                  )}
                </div>
                {phase === "sold" && (
                  <strong className="result-detail result-price">
                    {cfg.currency} {(p?.price || s.bid).toLocaleString()}
                  </strong>
                )}
              </div>
            </div>
            <div className="result-caption">
              {phase === "sold"
                ? "YOUR WINNING XI STARTS HERE."
                : "ANOTHER ROUND. ANOTHER OPPORTUNITY."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
