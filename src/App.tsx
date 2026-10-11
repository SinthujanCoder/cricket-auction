import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Expand,
  Flag,
  LayoutDashboard,
  Layers,
  Plus,
  Radio,
  Settings2,
  Shuffle,
  Sparkles,
  Trophy,
  Undo2,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  initial,
  load,
  sell,
  selectRandom,
  spent,
  type State,
  type Player,
  type ShowEvent,
} from "./auction";
import Broadcast, { Brand } from "./Broadcast";
import FrameEditor from "./FrameEditor";
type View = "studio" | "players" | "teams" | "design";
const icons = {
  studio: LayoutDashboard,
  players: Users,
  teams: Flag,
  design: Layers,
};
const labels = {
  studio: "Auction studio",
  players: "Player pool",
  teams: "Teams & squads",
  design: "Frame studio",
};
const format = (n: number) => new Intl.NumberFormat("en").format(n);
function Avatar({ p, large = false }: { p: Player; large?: boolean }) {
  return p.photo ? (
    <img
      className={large ? "player-photo" : "avatar-photo"}
      src={p.photo}
      alt={p.name}
    />
  ) : (
    <div className={large ? "player-silhouette" : "avatar"}>
      {large ? (
        <>
          <div className="head" />
          <div className="torso" />
          <div className="jersey-number">XI</div>
        </>
      ) : (
        p.name
          .split(" ")
          .map((n) => n[0])
          .join("")
      )}
    </div>
  );
}
export default function App() {
  const [s, setS] = useState<State>(load),
    [view, setView] = useState<View>("studio"),
    [modal, setModal] = useState<"player" | "team" | "new" | null>(null),
    [saved, setSaved] = useState(true),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [shuffling, setShuffling] = useState(false),
    [showEvent, setShowEvent] = useState<ShowEvent | null>(() => {
      try {
        const e = JSON.parse(localStorage.getItem("bidxi-show") || "null");
        return e && Date.now() - e.at < e.duration ? e : null;
      } catch {
        return null;
      }
    }),
    [fullscreen, setFullscreen] = useState(false),
    [displayControls, setDisplayControls] = useState(false),
    [undo, setUndo] = useState<State | null>(() => {
      try {
        return JSON.parse(localStorage.getItem("bidxi-undo") || "null");
      } catch {
        return null;
      }
    }),
    [editing, setEditing] = useState<Player | null>(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const projector = new URLSearchParams(location.search).has("display");
  const reduced = useReducedMotion();
  const incoming = useRef(false);
  const p = s.players.find((p) => p.id === s.active),
    team = s.teams.find((t) => t.id === s.team);
  const sold = s.players.filter((p) => p.status === "sold"),
    waiting = s.players.filter((p) => p.status === "waiting");
  useEffect(() => {
    if (incoming.current) {
      incoming.current = false;
      return;
    }
    try {
      localStorage.setItem("bidxi-v1", JSON.stringify(s));
      setSaved(true);
    } catch {
      setSaved(false);
      setError(
        "Browser storage is full or unavailable. Export results now; reduce uploaded photo sizes before continuing.",
      );
    }
  }, [s]);
  useEffect(() => {
    const f = (e: StorageEvent) => {
      if (e.key === "bidxi-v1" && e.newValue) {
        try {
          const next = JSON.parse(e.newValue);
          incoming.current = true;
          setS(next);
        } catch {}
      }
      if (e.key === "bidxi-show" && e.newValue) {
        try {
          setShowEvent(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === "bidxi-undo") {
        try {
          setUndo(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {}
      }
    };
    window.addEventListener("storage", f);
    return () => window.removeEventListener("storage", f);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const update = (x: Partial<State>) => setS((v) => ({ ...v, ...x }));
  function emit(
    kind: ShowEvent["kind"],
    playerId = s.active,
    pool: string[] = [],
  ) {
    const duration = reduced
      ? 500
      : kind === "shuffle"
        ? s.settings.motion === "quick"
          ? 1600
          : 3400
        : kind === "sold" || kind === "unsold"
          ? s.settings.motion === "quick"
            ? 2500
            : 5500
          : 1000;
    const event = {
      id: crypto.randomUUID(),
      kind,
      at: Date.now(),
      duration,
      playerId,
      pool,
    };
    setShowEvent(event);
    try {
      localStorage.setItem("bidxi-show", JSON.stringify(event));
    } catch {
      setError(
        "Presentation synchronization is unavailable. Check browser storage.",
      );
    }
  }
  useEffect(() => {
    if (showEvent?.kind !== "shuffle") {
      setShuffling(false);
      return;
    }
    const remaining = showEvent.duration - (Date.now() - showEvent.at);
    if (remaining <= 0) return;
    setShuffling(true);
    const timer = setTimeout(() => setShuffling(false), remaining);
    return () => clearTimeout(timer);
  }, [showEvent?.id]);
  useEffect(() => {
    const listener = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  }, []);
  async function expand() {
    setFullscreen(true);
    setDisplayControls(true);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setToast("Expanded view is ready. Browser fullscreen is unavailable.");
    }
  }
  function remember() {
    setUndo(structuredClone(s));
    try {
      localStorage.setItem("bidxi-undo", JSON.stringify(s));
    } catch {}
  }
  function undoResult() {
    if (!undo || shuffling) return;
    setS(undo);
    setUndo(null);
    localStorage.removeItem("bidxi-undo");
    emit("clear");
    setToast("Last result undone.");
  }
  function shuffle() {
    if (shuffling) return;
    const pick = selectRandom(s.players);
    if (!pick) {
      setToast("No waiting players. Start an unsold round or add players.");
      return;
    }
    setError("");
    setShuffling(true);
    update({ active: pick.id, bid: pick.base });
    emit(
      "shuffle",
      pick.id,
      waiting.map((p) => p.id),
    );
  }
  function commit() {
    try {
      const next = sell(s);
      remember();
      setS(next);
      emit("sold");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function unsold() {
    if (!p || p.status === "sold" || shuffling) return;
    remember();
    emit("unsold");
    update({
      players: s.players.map((x) =>
        x.id === p.id ? { ...x, status: "unsold" } : x,
      ),
    });
    setToast("Player moved to the unsold round.");
  }
  function exportResults() {
    const rows = [
      ["Player", "Role", "Status", "Team", "Price"],
      ...s.players.map((p) => [
        p.name,
        p.role,
        p.status,
        s.teams.find((t) => t.id === p.team)?.name || "",
        String(p.price || ""),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => '"' + v.replaceAll('"', '""') + '"').join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "bid-xi-results.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  const card = <Broadcast s={s} event={showEvent} />;
  const dock = (
    <div className="display-dock">
      <div>
        <label htmlFor="display-team">Buying team</label>
        <select
          id="display-team"
          value={s.team}
          onChange={(e) => update({ team: e.target.value })}
        >
          {s.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="display-bid">Bid · {s.settings.currency}</label>
        <input
          id="display-bid"
          type="number"
          min={p?.base || 0}
          value={s.bid}
          onChange={(e) => update({ bid: Number(e.target.value) })}
        />
      </div>
      <button
        aria-label="Increase bid by 1000"
        onClick={() => update({ bid: s.bid + 1000 })}
      >
        +1,000
      </button>
      <button className="shuffle-button" disabled={shuffling} onClick={shuffle}>
        <Shuffle size={16} />
        {shuffling ? "Shuffling…" : "Shuffle next player"}
      </button>
      <button
        className="sold-button"
        disabled={shuffling || p?.status !== "waiting"}
        onClick={commit}
      >
        <Check size={16} />
        Mark as sold
      </button>
      <button disabled={shuffling || p?.status !== "waiting"} onClick={unsold}>
        Mark unsold
      </button>
      <button disabled={!undo || shuffling} onClick={undoResult}>
        <Undo2 size={16} />
        Undo
      </button>
    </div>
  );
  if (projector || fullscreen)
    return (
      <main className={`projector ${displayControls ? "with-controls" : ""}`}>
        <div className="display-toolbar">
          <Brand />
          <span>
            {fullscreen ? "Fullscreen auction" : "Projector display"} ·{" "}
            {s.settings.name}
          </span>
          <div>
            <button onClick={() => setDisplayControls((v) => !v)}>
              <Settings2 size={16} />
              {displayControls ? "Hide controls" : "Show controls"}
            </button>
            <button
              onClick={() => {
                if (fullscreen) {
                  setFullscreen(false);
                  if (document.fullscreenElement) document.exitFullscreen();
                } else if (!document.fullscreenElement)
                  document.documentElement
                    .requestFullscreen()
                    .catch(() => setToast("Use browser fullscreen instead."));
                else document.exitFullscreen();
              }}
            >
              <Expand size={16} />
              {fullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
            <a href="/">Back to studio</a>
          </div>
        </div>
        {card}
        {displayControls && dock}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <p className="projector-note">
          {displayControls
            ? "Operator controls are visible. Hide them for a clean audience screen."
            : "Control from the studio tab, or select Show controls to run the auction here."}{" "}
          · Same browser synchronization
        </p>
        {toast && (
          <div className="toast" role="status">
            {toast}
            <button onClick={() => setToast("")}>
              <X size={15} />
            </button>
          </div>
        )}
      </main>
    );
  return (
    <div
      className="app"
      style={{ "--accent": s.settings.accent } as React.CSSProperties}
    >
      <aside className="sidebar">
        <a className="wordmark" href="/" aria-label="Bid XI home">
          <Brand />
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <button className="workspace" onClick={() => setModal("new")}>
          <div className="workspace-icon">C</div>
          <div>
            <strong>{s.settings.name}</strong>
            <span>{s.settings.season} SEASON</span>
          </div>
          <ChevronDown size={15} />
        </button>
        <div className="nav-label">MANAGE AUCTION</div>
        <nav>
          {(Object.keys(labels) as View[]).map((v) => {
            const Icon = icons[v];
            return (
              <button
                key={v}
                className={view === v ? "active" : ""}
                onClick={() => {
                  setView(v);
                  setError("");
                }}
              >
                <Icon size={19} />
                {labels[v]}
                {v === "players" && <span>{s.players.length}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-badge">
            <span /> BROWSER WORKSPACE
          </div>
          <p>Your progress saves automatically on this device.</p>
          <button
            className="profile"
            onClick={() =>
              setToast(
                "This is a local demo workspace. Cloud accounts are not connected yet.",
              )
            }
          >
            <div className="profile-avatar">YO</div>
            <div>
              <strong>Your organizer</strong>
              <span>Local workspace</span>
            </div>
            <Settings2 size={17} />
          </button>
        </div>
      </aside>
      <main className="main">
        <header>
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} /> <strong>{labels[view]}</strong>
          </div>
          <div className="header-actions">
            <span className="save-status">
              <Check size={13} />{" "}
              {saved ? "Saved locally" : "Not saved — storage full"}
            </span>
            <button onClick={() => window.open("?display=1", "bid-xi-display")}>
              <Expand size={15} /> Projector view <ArrowUpRight size={13} />
            </button>
          </div>
        </header>
        <div className="content">
          <motion.div
            className="page-heading"
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <div className="eyebrow">
                {s.settings.season} SEASON <span />{" "}
                {s.settings.name.toUpperCase()}
              </div>
              <h1>
                {view === "studio"
                  ? "The stage is yours."
                  : view === "players"
                    ? "Meet the next XI."
                    : view === "teams"
                      ? "Built to win."
                      : "Make it your own."}
              </h1>
              <p>
                {view === "studio"
                  ? "Shuffle a player, choose the bidding team, then confirm the result."
                  : view === "players"
                    ? "Your player pool, ready for the spotlight."
                    : view === "teams"
                      ? "Every player. Every team. Every winning bid."
                      : "A signature look for your tournament’s biggest moments."}
              </p>
            </div>
            <button
              className="outline"
              onClick={() =>
                view === "studio"
                  ? exportResults()
                  : setModal(view === "teams" ? "team" : "player")
              }
            >
              {view === "studio" ? (
                <ArrowDownToLine size={16} />
              ) : (
                <Plus size={16} />
              )}{" "}
              {view === "studio"
                ? "Export results"
                : view === "teams"
                  ? "Add team"
                  : "Add player"}
            </button>
          </motion.div>
          <div className="stats">
            <Stat
              label="PLAYER POOL"
              value={String(s.players.length).padStart(2, "0")}
              sub={`${waiting.length} waiting for their moment`}
              icon={<Users />}
            />
            <Stat
              label="PLAYERS SOLD"
              value={String(sold.length).padStart(2, "0")}
              sub={`${s.players.filter((p) => p.status === "unsold").length} in the unsold pool`}
              icon={<Check />}
            />
            <Stat
              label="TEAMS IN PLAY"
              value={String(s.teams.length).padStart(2, "0")}
              sub="Building their winning XI"
              icon={<Flag />}
            />
            <Stat
              label="TOTAL SPENT"
              value={format(sold.reduce((v, p) => v + (p.price || 0), 0))}
              sub={`${s.settings.currency} across all teams`}
              icon={<Trophy />}
            />
          </div>
          {view === "studio" && (
            <>
              <div className="studio-layout">
                <section className="stage-panel">
                  <div className="section-title">
                    <div>
                      <Radio size={16} />
                      <h3>Live auction stage</h3>
                      <span className="badge">16:9 DISPLAY</span>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Expand auction screen"
                      onClick={expand}
                    >
                      <Expand size={17} />
                    </button>
                  </div>
                  {card}
                  <div className="stage-toolbar">
                    <span>
                      <span className="green-dot" />{" "}
                      {shuffling
                        ? "Finding the next player…"
                        : "Your spotlight is ready"}
                    </span>
                    <button onClick={() => setView("design")}>
                      <Settings2 size={14} /> Customize frame{" "}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </section>
                <section className="control-panel">
                  <div className="section-title">
                    <div>
                      <Zap size={16} />
                      <h3>Auction controls</h3>
                    </div>
                    <span className="shortcut">LIVE</span>
                  </div>
                  <div className="control-body">
                    <div className="control-heading">
                      1. Pick your next player
                    </div>
                    <p>
                      Only waiting players enter the shuffle. Sold players stay
                      out.
                    </p>
                    <button
                      className="shuffle-button"
                      disabled={shuffling}
                      onClick={shuffle}
                    >
                      <Shuffle
                        size={18}
                        className={shuffling ? "spinning" : ""}
                      />
                      {shuffling
                        ? "Shuffling the pool…"
                        : "Shuffle next player"}
                      <span>{waiting.length}</span>
                    </button>
                    <div className="control-divider" />
                    <label className="field-label" htmlFor="team">
                      2. CHOOSE THE BIDDING TEAM
                    </label>
                    <select
                      id="team"
                      value={s.team}
                      onChange={(e) => update({ team: e.target.value })}
                    >
                      {s.teams.map((t) => (
                        <option value={t.id} key={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <div className="budget-hint">
                      Available budget{" "}
                      <strong>
                        {s.settings.currency}{" "}
                        {format(team ? team.budget - spent(s, team.id) : 0)}
                      </strong>
                    </div>
                    <label className="field-label" htmlFor="bid">
                      3. SET THE FINAL BID <span>{s.settings.currency}</span>
                    </label>
                    <div className="bid-input">
                      <button
                        aria-label="Decrease bid"
                        onClick={() =>
                          update({ bid: Math.max(p?.base || 0, s.bid - 1000) })
                        }
                      >
                        −
                      </button>
                      <input
                        id="bid"
                        type="number"
                        min={p?.base || 0}
                        value={s.bid}
                        onChange={(e) =>
                          update({ bid: Number(e.target.value) })
                        }
                      />
                      <button
                        aria-label="Increase bid"
                        onClick={() => update({ bid: s.bid + 1000 })}
                      >
                        +
                      </button>
                    </div>
                    <div className="increments">
                      {[1000, 5000, 10000].map((n) => (
                        <button
                          key={n}
                          onClick={() => update({ bid: s.bid + n })}
                        >
                          + {format(n)}
                        </button>
                      ))}
                    </div>
                    {error && (
                      <p className="error" role="alert">
                        {error}
                      </p>
                    )}
                    <button
                      className="sold-button"
                      disabled={shuffling || !p || p.status !== "waiting"}
                      onClick={commit}
                    >
                      <Check size={18} /> Mark as sold <ArrowRight size={17} />
                    </button>
                    <div className="secondary-actions">
                      <button
                        disabled={shuffling || !p || p.status !== "waiting"}
                        onClick={unsold}
                      >
                        Mark unsold
                      </button>
                      <button
                        disabled={!undo || shuffling}
                        onClick={() => {
                          undoResult();
                        }}
                      >
                        <Undo2 size={14} /> Undo
                      </button>
                    </div>
                  </div>
                  <div className="tip">
                    <Sparkles size={16} />
                    <span>The best teams begin with a bold bid.</span>
                  </div>
                </section>
              </div>
              <section className="team-overview">
                <div className="section-title">
                  <div>
                    <h3>The teams at a glance</h3>
                    <span className="muted">A squad in the making.</span>
                  </div>
                  <button onClick={() => setView("teams")}>
                    View all teams <ArrowRight size={15} />
                  </button>
                </div>
                <div className="team-grid">
                  {s.teams.map((t) => (
                    <TeamCard
                      key={t.id}
                      s={s}
                      t={t}
                      onClick={() => {
                        setView("teams");
                        setFilter(t.id);
                      }}
                    />
                  ))}
                </div>
              </section>
              <div className="bottom-note">
                <span>
                  <span className="green-dot" />{" "}
                  {saved
                    ? "All auction changes saved on this device"
                    : "Changes are not saved. Export results now."}
                </span>
                <span>BUILT FOR THE LOVE OF THE GAME.</span>
              </div>
            </>
          )}
          {view === "players" && (
            <section className="list-panel">
              <div className="list-tools">
                <input
                  placeholder="Search player names or roles…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All players</option>
                  <option value="waiting">Waiting</option>
                  <option value="sold">Sold</option>
                  <option value="unsold">Unsold</option>
                </select>
                <button
                  className="outline"
                  onClick={() => {
                    if (!s.players.some((p) => p.status === "unsold")) {
                      setToast("There are no unsold players yet.");
                      return;
                    }
                    update({
                      players: s.players.map((p) =>
                        p.status === "unsold" ? { ...p, status: "waiting" } : p,
                      ),
                    });
                    setToast(
                      "Unsold round is ready. Sold players remain excluded.",
                    );
                  }}
                >
                  Start unsold round
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>PLAYER</th>
                      <th>ROLE</th>
                      <th>BASE PRICE</th>
                      <th>STATUS</th>
                      <th>TEAM / PRICE</th>
                      <th>EDIT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.players
                      .filter(
                        (p) =>
                          (filter === "all" ||
                            !["waiting", "sold", "unsold"].includes(filter) ||
                            p.status === filter) &&
                          (p.name + " " + p.role)
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                      )
                      .map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="table-player">
                              <Avatar p={p} />
                              <strong>{p.name}</strong>
                            </div>
                          </td>
                          <td>{p.role}</td>
                          <td>
                            {s.settings.currency} {format(p.base)}
                          </td>
                          <td>
                            <span className={`status ${p.status}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            {p.team
                              ? `${s.teams.find((t) => t.id === p.team)?.name} / ${format(p.price || 0)}`
                              : "—"}
                          </td>
                          <td>
                            <button
                              className="edit-player"
                              aria-label={`Edit ${p.name}`}
                              onClick={() => {
                                setEditing(p);
                                setError("");
                                setModal("player");
                              }}
                            >
                              <Settings2 size={15} />
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <p className="panel-note">
                Demo players are fictional. Add your own players and photos
                before your event.
              </p>
            </section>
          )}
          {view === "teams" && (
            <>
              <div className="team-grid full">
                {s.teams.map((t) => (
                  <TeamCard
                    key={t.id}
                    s={s}
                    t={t}
                    onClick={() => setFilter(t.id)}
                  />
                ))}
              </div>
              <section className="squad-panel">
                <div className="section-title">
                  <div>
                    <h3>Final squad board</h3>
                  </div>
                  <button onClick={() => window.print()}>
                    <ArrowDownToLine size={15} /> Print / save PDF
                  </button>
                </div>
                {s.teams
                  .filter(
                    (t) =>
                      filter === "all" ||
                      filter === t.id ||
                      !s.teams.some((x) => x.id === filter),
                  )
                  .map((t) => (
                    <div className="squad" key={t.id}>
                      <h2 style={{ color: t.color }}>
                        {t.name}{" "}
                        <small>
                          {s.players.filter((p) => p.team === t.id).length} /{" "}
                          {t.limit} players
                        </small>
                      </h2>
                      <div className="squad-players">
                        {s.players
                          .filter((p) => p.team === t.id && p.status === "sold")
                          .map((p) => (
                            <motion.div
                              layout
                              className="squad-player"
                              key={p.id}
                            >
                              <Avatar p={p} />
                              <strong>{p.name}</strong>
                              <span>{p.role}</span>
                              <b>
                                {s.settings.currency} {format(p.price || 0)}
                              </b>
                            </motion.div>
                          ))}
                        {!s.players.some((p) => p.team === t.id) && (
                          <p className="empty">
                            Their story is still waiting to be written. Sold
                            players appear here automatically.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                <button
                  className="text-button"
                  onClick={() => setFilter("all")}
                >
                  Show every team
                </button>
              </section>
            </>
          )}
          {view === "design" && (
            <div className="design-layout">
              <section className="design-preview">
                <div className="preview-label">
                  <span>LIVE FRAME PREVIEW</span>
                  <button onClick={expand}>
                    <Expand size={15} />
                    Expand preview
                  </button>
                </div>
                {card}
                <div className="design-preview-note">
                  <Sparkles size={18} />
                  <div>
                    <strong>Every change is live.</strong>
                    <p>
                      Your projector uses this same frame. Upload a background,
                      customize the layout, and test the animations.
                    </p>
                  </div>
                </div>
              </section>
              <FrameEditor
                settings={s.settings}
                onChange={(x) => update({ settings: { ...s.settings, ...x } })}
                onError={setToast}
                replay={(kind) => {
                  const e = {
                    id: crypto.randomUUID(),
                    kind,
                    at: Date.now(),
                    duration:
                      kind === "shuffle" ? 3400 : kind === "sold" ? 5500 : 1000,
                    playerId: s.active,
                    pool: waiting.map((p) => p.id),
                  };
                  setShowEvent(e);
                }}
              />
            </div>
          )}
        </div>
      </main>
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Check size={17} />
            {toast}
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal && (
          <motion.div
            key="dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="modal-backdrop"
            onClick={() => {
              setModal(null);
              setEditing(null);
              setError("");
            }}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                aria-label="Close dialog"
                onClick={() => {
                  setModal(null);
                  setEditing(null);
                  setError("");
                }}
              >
                <X />
              </button>
              <div className="eyebrow">YOUR NEXT CHAPTER</div>
              <h2>
                {modal === "player"
                  ? editing
                    ? "Edit player"
                    : "Add a player"
                  : modal === "team"
                    ? "Add a team"
                    : "New tournament"}
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const name = String(data.get("name")).trim();
                  if (!name) return;
                  try {
                    if (modal === "player") {
                      const f = data.get("photo") as File;
                      let photo = editing?.photo || "";
                      if (f?.size) {
                        if (
                          !["image/png", "image/jpeg", "image/webp"].includes(
                            f.type,
                          )
                        )
                          throw new Error("Choose a PNG, JPEG, or WebP photo.");
                        if (f.size > 2 * 1024 * 1024)
                          throw new Error("Choose a photo under 2 MB.");
                        photo = await new Promise<string>((resolve, reject) => {
                          const r = new FileReader();
                          r.onload = () => resolve(String(r.result));
                          r.onerror = reject;
                          r.readAsDataURL(f);
                        });
                      }
                      const details = {
                        name,
                        role: String(data.get("role")),
                        country: String(data.get("country")),
                        base:
                          editing?.status === "sold"
                            ? editing.base
                            : Number(data.get("base")),
                        photo,
                      };
                      update({
                        players: editing
                          ? s.players.map((x) =>
                              x.id === editing.id ? { ...x, ...details } : x,
                            )
                          : [
                              ...s.players,
                              {
                                ...details,
                                id: crypto.randomUUID(),
                                status: "waiting",
                              },
                            ],
                      });
                    } else if (modal === "team") {
                      update({
                        teams: [
                          ...s.teams,
                          {
                            id: crypto.randomUUID(),
                            name,
                            short: name
                              .split(" ")
                              .map((x) => x[0])
                              .join("")
                              .slice(0, 3),
                            color: String(data.get("color")),
                            budget: Number(data.get("budget")),
                            limit: Number(data.get("limit")),
                          },
                        ],
                      });
                    } else {
                      setUndo(structuredClone(s));
                      setS({
                        ...structuredClone(initial),
                        players: [],
                        teams: [],
                        active: null,
                        history: [],
                        settings: {
                          ...s.settings,
                          name,
                          season: String(data.get("season")),
                        },
                      });
                      emit("clear");
                    }
                    setModal(null);
                    setEditing(null);
                    setToast("Saved to your workspace.");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <label>
                  Name
                  <input
                    required
                    name="name"
                    defaultValue={modal === "player" ? editing?.name || "" : ""}
                    maxLength={80}
                    placeholder={
                      modal === "player"
                        ? "Player’s full name"
                        : modal === "team"
                          ? "Team name"
                          : "Tournament name"
                    }
                  />
                </label>
                {modal === "player" && (
                  <>
                    <div className="form-row">
                      <label>
                        Role
                        <select
                          name="role"
                          defaultValue={editing?.role || "Batter"}
                        >
                          {[
                            "Batter",
                            "Bowler",
                            "All-rounder",
                            "Wicketkeeper",
                          ].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Base price
                        <input
                          name="base"
                          type="number"
                          min="0"
                          defaultValue={editing?.base ?? 5000}
                          required
                        />
                      </label>
                    </div>
                    <label>
                      Country
                      <input
                        name="country"
                        defaultValue={editing?.country || "Sri Lanka"}
                        required
                      />
                    </label>
                    <label>
                      Photo · optional, up to 2 MB
                      <input
                        name="photo"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                      />
                    </label>
                  </>
                )}
                {modal === "team" && (
                  <>
                    <div className="form-row">
                      <label>
                        Budget
                        <input
                          name="budget"
                          type="number"
                          min="1"
                          defaultValue="150000"
                          required
                        />
                      </label>
                      <label>
                        Squad limit
                        <input
                          name="limit"
                          type="number"
                          min="1"
                          max="100"
                          defaultValue="11"
                          required
                        />
                      </label>
                    </div>
                    <label>
                      Team color
                      <input name="color" type="color" defaultValue="#dfb86c" />
                    </label>
                  </>
                )}
                {modal === "new" && (
                  <>
                    <label>
                      Season
                      <input name="season" defaultValue="2026" required />
                    </label>
                    <p className="panel-note">
                      This replaces the current local tournament with an empty
                      one. Export your results first. You can undo once from the
                      auction controls.
                    </p>
                  </>
                )}
                {error && <p className="error">{error}</p>}
                <button className="sold-button" type="submit">
                  {modal === "new" ? "Create tournament" : "Save " + modal}
                  <ArrowRight size={16} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat">
      <div className="stat-label">
        {label}
        <span>{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>{sub}</p>
    </div>
  );
}
function TeamCard({
  s,
  t,
  onClick,
}: {
  s: State;
  t: State["teams"][number];
  onClick: () => void;
}) {
  const count = s.players.filter(
    (p) => p.status === "sold" && p.team === t.id,
  ).length;
  const balance = t.budget - spent(s, t.id);
  return (
    <button className="team-card" onClick={onClick}>
      <div className="team-card-top">
        <span
          className="crest"
          style={{
            color: t.color,
            borderColor: t.color + "55",
            background: t.color + "10",
          }}
        >
          {t.short}
        </span>
        <div>
          <strong>{t.name}</strong>
          <span>
            {count} / {t.limit} players
          </span>
        </div>
        <ArrowUpRight size={15} />
      </div>
      <div className="team-budget">
        <span>REMAINING BUDGET</span>
        <strong>
          {s.settings.currency} {format(balance)}
        </strong>
      </div>
      <div className="budget-track">
        <motion.div
          initial={false}
          animate={{ width: `${(balance / t.budget) * 100}%` }}
          style={{ background: t.color }}
        />
      </div>
    </button>
  );
}
