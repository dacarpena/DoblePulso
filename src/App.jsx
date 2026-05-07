
import React, { useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS, TEST_MODES, getQuestionsForMode } from "./data/questions.js";
import { scoreSession, answerLabel } from "./lib/scoring.js";
import { buildFullExport, comparisonsCsv, download, downloadZip, exportPng, responsesCsv, shareJson, textReport } from "./lib/exporters.js";
import "./styles.css";

const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const makePin = () => String(Math.floor(1000 + Math.random() * 9000));

const ttlOptions = [
  { value: 2, label: "2 horas", hint: "para usarlo ahora y borrar pronto" },
  { value: 24, label: "24 horas", hint: "recomendado para una sesión normal" },
  { value: 168, label: "7 días", hint: "útil si no sabéis cuándo terminaréis" }
];

const flowOptions = [
  { value: "free", label: "Cada uno a su ritmo", hint: "más cómodo si no estáis juntos" },
  { value: "together", label: "Pregunta a pregunta juntos", hint: "más juego si estáis en persona" }
];

function questionIdsForMode(mode) {
  return getQuestionsForMode(mode).map(q => q.id);
}

function questionsForSession(session, fallbackMode) {
  if (session?.questionIds?.length) {
    const set = new Set(session.questionIds);
    return QUESTIONS.filter(q => set.has(q.id));
  }
  return getQuestionsForMode(session?.mode || fallbackMode || "balanced");
}

const blankSession = (mode = "balanced", ttlHours = 24, flowMode = "free", deleteAfterComplete = false) => ({
  id: "LOCAL",
  mode,
  flowMode,
  deleteAfterComplete,
  questionIds: questionIdsForMode(mode),
  currentIndex: 0,
  diagnosticsStarted: false,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString(),
  completedAt: null,
  participants: { A: { name: "Persona A", connected: false }, B: { name: "Persona B", connected: false } },
  answers: { A: {}, B: {} },
  completed: { A: false, B: false }
});

function wsUrl(roomId, role, name, pin) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/api/rooms/${roomId}/ws?participant=${role}&pin=${encodeURIComponent(pin || "")}&name=${encodeURIComponent(name || "")}`;
}

async function apiCreateRoom(config) {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error("No se pudo crear la sala");
  return res.json();
}

export default function App() {
  const params = new URLSearchParams(location.search);
  const initialRoom = params.get("room");
  const initialPin = params.get("pin") || "";
  const [roomId, setRoomId] = useState(initialRoom);
  const [role, setRole] = useState(params.get("role") === "B" ? "B" : params.get("role") === "A" ? "A" : null);
  const [name, setName] = useState(localStorage.getItem("dp_name") || "");
  const [mode, setMode] = useState(localStorage.getItem("dp_mode") || "balanced");
  const [pin, setPin] = useState(initialPin || makePin());
  const [ttlHours, setTtlHours] = useState(Number(localStorage.getItem("dp_ttl") || 24));
  const [flowMode, setFlowMode] = useState(localStorage.getItem("dp_flow") || "free");
  const [deleteAfterComplete, setDeleteAfterComplete] = useState(localStorage.getItem("dp_delete_after") === "true");
  const [session, setSession] = useState(null);
  const [local, setLocal] = useState(false);
  const [status, setStatus] = useState("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealDone, setRevealDone] = useState(false);
  const socketRef = useRef(null);

  const questions = useMemo(() => questionsForSession(session, mode), [session, mode]);
  const ownAnswers = session?.answers?.[role] || {};
  const answeredCount = questions.filter(q => ownAnswers[q.id]).length;
  const ownDone = role ? Boolean(session?.completed?.[role]) : false;
  const bothDone = Boolean(session?.completed?.A && session?.completed?.B);
  const isExpired = session?.expired || (session?.expiresAt && Date.now() > new Date(session.expiresAt).getTime());
  const isDeleted = session?.deleted || status === "deleted";
  const displayIndex = session?.flowMode === "together" ? (session.currentIndex || 0) : currentIndex;
  const currentQuestion = questions[displayIndex];
  const results = useMemo(() => bothDone && session ? scoreSession(session, session.mode) : null, [bothDone, session]);

  useEffect(() => {
    if (!bothDone) setRevealDone(false);
    if (bothDone) {
      const t = setTimeout(() => setRevealDone(true), 2200);
      return () => clearTimeout(t);
    }
  }, [bothDone]);

  useEffect(() => {
    if (!roomId || !role || local || !pin) return;
    setStatus("connecting");
    const ws = new WebSocket(wsUrl(roomId, role, name || `Persona ${role}`, pin));
    socketRef.current = ws;

    ws.onopen = () => setStatus("connected");
    ws.onmessage = event => {
      const msg = JSON.parse(event.data);
      if (msg.type === "state") {
        setSession(msg.session);
        setStatus("connected");
        const qs = questionsForSession(msg.session, msg.session.mode);
        if (msg.session.flowMode !== "together") {
          const mine = msg.session.answers?.[role] || {};
          const first = qs.findIndex(q => !mine[q.id]);
          setCurrentIndex(first >= 0 ? first : Math.max(0, qs.length - 1));
        }
      }
      if (msg.type === "expired") {
        setSession(msg.session || { id: roomId, expired: true });
        setStatus("expired");
      }
      if (msg.type === "deleted") {
        setSession(msg.session || { id: roomId, deleted: true });
        setStatus("deleted");
      }
      if (msg.type === "error") alert(msg.message);
    };
    ws.onclose = () => setStatus(current => ["expired","deleted"].includes(current) ? current : "disconnected");
    ws.onerror = () => setStatus("pin_error");
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, role, pin, local]);

  function send(type, payload = {}) {
    if (local) {
      setSession(prev => reduceLocal(prev, { type, ...payload }, role, name));
      return;
    }
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, ...payload }));
    }
  }

  async function createRoom() {
    const cleanPin = /^\d{4,8}$/.test(pin) ? pin : makePin();
    const config = {
      mode,
      pin: cleanPin,
      ttlHours,
      flowMode,
      deleteAfterComplete,
      questionIds: questionIdsForMode(mode)
    };
    localStorage.setItem("dp_mode", mode);
    localStorage.setItem("dp_ttl", String(ttlHours));
    localStorage.setItem("dp_flow", flowMode);
    localStorage.setItem("dp_delete_after", String(deleteAfterComplete));
    setPin(cleanPin);
    setStatus("creating");
    try {
      const data = await apiCreateRoom(config);
      setRoomId(data.roomId);
      setRole("A");
      setSession(null);
      const u = new URL(location.href);
      u.search = "";
      u.searchParams.set("room", data.roomId);
      u.searchParams.set("pin", data.pin || cleanPin);
      u.searchParams.set("role", "A");
      history.replaceState(null, "", u.toString());
    } catch {
      const fallback = blankSession(mode, ttlHours, flowMode, deleteAfterComplete);
      fallback.id = `LOCAL-${uid()}`;
      setLocal(true);
      setRoomId(fallback.id);
      setRole("A");
      setSession(fallback);
    }
  }

  function joinLocalAs(p) {
    const s = blankSession(mode, ttlHours, flowMode, deleteAfterComplete);
    s.id = "LOCAL";
    setLocal(true);
    setRoomId("LOCAL");
    setRole(p);
    setSession(s);
  }

  function chooseRole(p) {
    setRole(p);
    const u = new URL(location.href);
    u.searchParams.set("role", p);
    if (pin) u.searchParams.set("pin", pin);
    history.replaceState(null, "", u.toString());
  }

  function confirmPin() {
    const u = new URL(location.href);
    u.searchParams.set("pin", pin);
    if (role) u.searchParams.set("role", role);
    history.replaceState(null, "", u.toString());
    setSession(null);
    setStatus("connecting");
  }

  function updateName(value) {
    setName(value);
    localStorage.setItem("dp_name", value);
    if (role) send("name", { name: value || `Persona ${role}` });
  }

  function answer(value) {
    const q = currentQuestion;
    send("answer", { questionId: q.id, value, private: q.private });
  }

  function next() {
    if (session?.flowMode === "together") return;
    const idx = questions.findIndex((q, i) => i > currentIndex && !ownAnswers[q.id]);
    if (idx >= 0) setCurrentIndex(idx);
    else if (answeredCount >= questions.length) send("complete");
    else setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previous() {
    if (session?.flowMode === "together") return;
    setCurrentIndex(Math.max(0, currentIndex - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteRoom() {
    const msg = bothDone
      ? "Antes de borrar, asegúrate de haber exportado el ZIP si quieres conservar todo. ¿Eliminar sala y respuestas para ambas personas?"
      : "Esto borrará la sala y respuestas para ambas personas. ¿Seguro?";
    if (!confirm(msg)) return;
    if (local) {
      setSession({ id: roomId, deleted: true, deletedAt: new Date().toISOString() });
      setStatus("deleted");
    } else {
      send("delete_room");
    }
  }

  function startDiagnostics(ids) {
    if (!ids?.length) return;
    send("start_diagnostics", { questionIds: ids });
    setRevealDone(false);
    setCurrentIndex(questions.length);
  }

  const baseUrl = roomId ? `${location.origin}${location.pathname}?room=${roomId}` : "";
  const inviteUrl = roomId ? `${baseUrl}&pin=${encodeURIComponent(pin || "")}` : "";

  if (!roomId) {
    return <Shell>
      <section className="hero card">
        <div className="eyebrow">Doble Pulso v4 · definitivo</div>
        <h1>Test romántico-afectivo simultáneo para dos móviles</h1>
        <p>Una sala compartida, dos personas respondiendo a la vez, PIN, caducidad, borrado manual, revelado completo y export ZIP con todos los datos.</p>

        <Onboarding />

        <h2>Modo del test</h2>
        <div className="modeGrid">
          {Object.values(TEST_MODES).map(m => (
            <button key={m.id} className={`mode ${mode === m.id ? "selected" : ""}`} onClick={() => setMode(m.id)}>
              <b>{m.label}</b>
              <span>{m.description}</span>
            </button>
          ))}
        </div>

        <h2>Ritmo de respuesta</h2>
        <div className="modeGrid">
          {flowOptions.map(opt => (
            <button key={opt.value} className={`mode ${flowMode === opt.value ? "selected" : ""}`} onClick={() => setFlowMode(opt.value)}>
              <b>{opt.label}</b>
              <span>{opt.hint}</span>
            </button>
          ))}
        </div>

        <h2>Privacidad comprensible</h2>
        <p>La sala necesita PIN. Al finalizar, ambos veréis todas las respuestas y comparaciones. Al caducar, la sala deja de estar disponible.</p>
        <div className="pinRow">
          <label>
            <span>PIN de sala</span>
            <input className="input pinInput" inputMode="numeric" pattern="[0-9]*" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </label>
          <button className="secondary compact" onClick={() => setPin(makePin())}>Generar PIN</button>
        </div>

        <div className="modeGrid">
          {ttlOptions.map(opt => (
            <button key={opt.value} className={`mode ${Number(ttlHours) === opt.value ? "selected" : ""}`} onClick={() => setTtlHours(opt.value)}>
              <b>Caduca en {opt.label}</b>
              <span>{opt.hint}</span>
            </button>
          ))}
        </div>

        <label className="toggle">
          <input type="checkbox" checked={deleteAfterComplete} onChange={e => setDeleteAfterComplete(e.target.checked)} />
          Borrar automáticamente 30 minutos después de terminar ambos
        </label>

        <button className="primary" onClick={createRoom}>Crear sala online</button>
        <button className="secondary" onClick={() => joinLocalAs("A")}>Probar local en este navegador</button>
      </section>
    </Shell>;
  }

  if (!role) {
    return <Shell>
      <section className="card">
        <div className="eyebrow">Sala {roomId}</div>
        <h1>Elige tu lado</h1>
        <p>Entrarás en la misma sala que la otra persona. Las respuestas se sincronizan y los resultados se revelan cuando ambos terminan.</p>
        <button className="primary" onClick={() => chooseRole("A")}>Entrar como Persona A</button>
        <button className="secondary" onClick={() => chooseRole("B")}>Entrar como Persona B</button>
      </section>
    </Shell>;
  }

  if (!local && !pin) {
    return <Shell>
      <section className="card">
        <div className="eyebrow">Sala {roomId}</div>
        <h1>Introduce el PIN</h1>
        <p>El PIN evita que cualquiera que vea el ID de sala pueda entrar. Si te han pasado el enlace completo, debería aparecer ya rellenado.</p>
        <input className="input pinInput" inputMode="numeric" pattern="[0-9]*" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="PIN" />
        <button className="primary" onClick={confirmPin} disabled={pin.length < 4}>Entrar en la sala</button>
      </section>
    </Shell>;
  }

  if (status === "pin_error") {
    return <Shell>
      <section className="card">
        <div className="eyebrow">Sala {roomId}</div>
        <h1>No se pudo entrar</h1>
        <p>Puede ser un PIN incorrecto, una sala caducada o un problema temporal de conexión.</p>
        <input className="input pinInput" inputMode="numeric" pattern="[0-9]*" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="PIN" />
        <button className="primary" onClick={confirmPin} disabled={pin.length < 4}>Reintentar con este PIN</button>
      </section>
    </Shell>;
  }

  if (!session) {
    return <Shell><section className="card"><h1>Conectando sala…</h1><p>{status}</p></section></Shell>;
  }

  if (isDeleted) {
    return <EndState title="Sala eliminada" text="La sala y sus respuestas se han borrado manualmente." />;
  }

  if (isExpired) {
    return <EndState title="Sala caducada" text="Por privacidad, las salas caducan automáticamente. Crea una nueva sala para empezar otra sesión." />;
  }

  if (!name) {
    return <Shell>
      <section className="card">
        <div className="eyebrow">Sala {roomId} · Persona {role}</div>
        <h1>Nombre o alias</h1>
        <p>Usa un alias si quieres. El test no necesita datos reales.</p>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={`Persona ${role}`} />
        <button className="primary" onClick={() => updateName(name || `Persona ${role}`)}>Entrar</button>
      </section>
    </Shell>;
  }

  const progressA = progress(session, questions, "A");
  const progressB = progress(session, questions, "B");

  if (bothDone && results) {
    if (!revealDone) return <Shell><RevealAnimation /></Shell>;
    const fullExport = buildFullExport(session, results, session.mode);
    return <Shell>
      <ProgressHeader session={session} role={role} status={status} progressA={progressA} progressB={progressB} baseUrl={baseUrl} inviteUrl={inviteUrl} pin={pin} onDelete={deleteRoom} />
      <Results session={session} results={results} fullExport={fullExport} onDelete={deleteRoom} onStartDiagnostics={startDiagnostics} />
    </Shell>;
  }

  if (ownDone) {
    return <Shell>
      <ProgressHeader session={session} role={role} status={status} progressA={progressA} progressB={progressB} baseUrl={baseUrl} inviteUrl={inviteUrl} pin={pin} onDelete={deleteRoom} />
      <section className="card waiting">
        <div className="bigEmoji">🕯️</div>
        <h1>Esperando a la otra persona</h1>
        <p>Tus respuestas están guardadas. Los resultados y todas las respuestas se revelan cuando ambos terminéis.</p>
        <div className="listCards">
          <article>Piensa qué pregunta te ha costado más responder.</article>
          <article>Piensa qué tema te gustaría hablar sin presión.</article>
          <article>Piensa qué respuesta de la otra persona te daría más curiosidad.</article>
        </div>
      </section>
    </Shell>;
  }

  const selected = ownAnswers[currentQuestion?.id]?.value;
  const together = session.flowMode === "together";
  const currentAnswered = Boolean(selected);
  const otherRole = role === "A" ? "B" : "A";
  const otherAnsweredCurrent = Boolean(session.answers?.[otherRole]?.[currentQuestion?.id]);

  return <Shell>
    <ProgressHeader session={session} role={role} status={status} progressA={progressA} progressB={progressB} baseUrl={baseUrl} inviteUrl={inviteUrl} pin={pin} onDelete={deleteRoom} />
    <section className="card questionCard">
      <div className="questionMeta">
        <span>{currentQuestion.dimension}</span>
        <span>{displayIndex + 1}/{questions.length}</span>
      </div>
      <div className="bar"><i style={{ width: `${Math.round((answeredCount / questions.length) * 100)}%` }} /></div>
      {together && <div className="privateNote">Modo juntos: ambos respondéis la misma pregunta. La app avanza cuando los dos habéis contestado.</div>}
      {currentQuestion.private && <div className="privateNote">🔒 Pregunta sensible. Se revelará al final junto con todas las respuestas, para que el análisis sea completo y simétrico.</div>}
      <h1>{currentQuestion.text}</h1>
      <details className="why">
        <summary>Por qué importa</summary>
        <p>{currentQuestion.whyItMatters}</p>
      </details>
      <div className="answers">
        {currentQuestion.options.map(opt => (
          <button key={opt.value} className={`answer ${Number(selected) === opt.value ? "picked" : ""}`} onClick={() => answer(opt.value)}>
            <span className="emoji">{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      <div className="stickyNav">
        <button className="ghost" onClick={previous} disabled={currentIndex === 0 || together}>Atrás</button>
        {together ? (
          <button className="primary" disabled>
            {!currentAnswered ? "Elige una respuesta" : otherAnsweredCurrent ? "Avanzando…" : "Esperando a la otra persona"}
          </button>
        ) : (
          <button className="primary" onClick={next} disabled={!selected}>
            {answeredCount >= questions.length ? "Finalizar mi parte" : "Siguiente"}
          </button>
        )}
      </div>
    </section>
  </Shell>;
}

function reduceLocal(session, msg, role, name) {
  const next = structuredClone(session);
  if (msg.type === "delete_room") return { id: session.id, deleted: true, deletedAt: new Date().toISOString() };
  if (msg.type === "name") next.participants[role].name = msg.name || name || `Persona ${role}`;
  if (msg.type === "answer") {
    next.answers[role][msg.questionId] = {
      value: msg.value,
      private: Boolean(msg.private),
      answeredAt: new Date().toISOString()
    };
    next.completed[role] = false;
    next.completedAt = null;
    if (next.flowMode === "together") {
      const id = next.questionIds[next.currentIndex || 0];
      if (next.answers.A[id] && next.answers.B[id]) {
        if ((next.currentIndex || 0) < next.questionIds.length - 1) next.currentIndex = (next.currentIndex || 0) + 1;
        else {
          next.completed.A = true;
          next.completed.B = true;
          next.completedAt = new Date().toISOString();
        }
      }
    }
  }
  if (msg.type === "complete") {
    next.completed[role] = true;
    if (next.completed.A && next.completed.B) next.completedAt = new Date().toISOString();
  }
  if (msg.type === "start_diagnostics") {
    const set = new Set(next.questionIds);
    (msg.questionIds || []).forEach(id => set.add(id));
    next.questionIds = [...set];
    next.diagnosticsStarted = true;
    next.completed = { A: false, B: false };
    next.completedAt = null;
  }
  return next;
}

function Shell({ children }) {
  return <main className="app">
    <header className="top">
      <div className="brand">Doble Pulso</div>
      <div className="badge">v4</div>
    </header>
    {children}
  </main>;
}

function Onboarding() {
  return <div className="steps">
    <div><b>1</b><span>Crea sala</span></div>
    <div><b>2</b><span>Comparte enlace + PIN</span></div>
    <div><b>3</b><span>Respondéis desde dos móviles</span></div>
    <div><b>4</b><span>Se revelan respuestas y análisis</span></div>
    <div><b>5</b><span>Exportáis todo</span></div>
  </div>;
}

function ProgressHeader({ session, role, status, progressA, progressB, baseUrl, inviteUrl, pin, onDelete }) {
  return <section className="mini card">
    <div className="roomLine">
      <div>
        <b>Sala {session.id}</b>
        <span>{status === "connected" ? "online" : status} · PIN {pin || "—"} · caduca {formatExpiry(session.expiresAt)}</span>
      </div>
    </div>
    <div className="copyGrid">
      <button className="tiny" onClick={() => copyText(baseUrl)}>Copiar enlace</button>
      <button className="tiny" onClick={() => copyText(pin)}>Copiar PIN</button>
      <button className="tiny" onClick={() => copyText(inviteUrl)}>Copiar enlace+PIN</button>
      <button className="tiny danger" onClick={onDelete}>Eliminar sala</button>
    </div>
    <div className="people">
      <div className={role === "A" ? "me" : ""}><b>{session.participants.A?.name || "Persona A"}</b><Progress n={progressA} /></div>
      <div className={role === "B" ? "me" : ""}><b>{session.participants.B?.name || "Persona B"}</b><Progress n={progressB} /></div>
    </div>
  </section>;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text || "");
  } catch {
    alert(text || "");
  }
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return "sin fecha";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "caducada";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `en ${Math.floor(h/24)}d ${h%24}h`;
  if (h > 0) return `en ${h}h ${m}m`;
  return `en ${m}m`;
}

function Progress({ n }) {
  return <div className="progress"><i style={{ width: `${n}%` }} /><span>{n}%</span></div>;
}

function progress(session, questions, p) {
  const count = questions.filter(q => session.answers?.[p]?.[q.id]).length;
  return Math.round((count / questions.length) * 100);
}

function RevealAnimation() {
  const steps = ["Comparando ritmos…", "Detectando zonas sensibles…", "Buscando diferencias cuidables…", "Preparando conversaciones útiles…"];
  return <section className="card reveal">
    <div className="bigEmoji pulse">🧭</div>
    <h1>Ambos habéis terminado</h1>
    <div className="revealSteps">{steps.map(s => <span key={s}>{s}</span>)}</div>
  </section>;
}

function EndState({ title, text }) {
  return <Shell>
    <section className="card">
      <div className="eyebrow">Fin de sala</div>
      <h1>{title}</h1>
      <p>{text}</p>
      <button className="primary" onClick={() => { history.replaceState(null, "", location.pathname); location.reload(); }}>Crear otra sala</button>
    </section>
  </Shell>;
}

function Results({ session, results, fullExport, onDelete, onStartDiagnostics }) {
  const [tab, setTab] = useState("summary");
  const [filter, setFilter] = useState("all");
  const filteredRows = results.comparisonRows.filter(row => {
    if (filter === "all") return true;
    if (filter === "critical") return row.critical;
    if (filter === "low") return row.score < 65;
    if (filter === "private") return row.private;
    if (filter === "strength") return row.score >= 85;
    if (filter === "complementarity") return row.complementarity;
    return row.dimensionId === filter;
  });

  const canStartDiagnostics = session.mode === "adaptive" && !session.diagnosticsStarted && results.recommendedDiagnosticQuestionIds.length > 0;

  return <section className="card results">
    <div className="eyebrow">Resultados desbloqueados · todas las respuestas reveladas</div>
    <h1>{results.narrative.archetype}</h1>
    <p>{results.narrative.summary}</p>

    <div className="tabs">
      {[
        ["summary","Resumen"],
        ["dimensions","Dimensiones"],
        ["questions","Pregunta a pregunta"],
        ["answers","Respuestas separadas"],
        ["export","Exportar"]
      ].map(([id,label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}
    </div>

    {tab === "summary" && <>
      <Dashboard results={results} />
      {canStartDiagnostics && <div className="warning">
        <b>Modo adaptativo: hay {results.recommendedDiagnosticQuestionIds.length} preguntas extra recomendadas.</b>
        <p>Profundizan solo en las zonas sensibles detectadas. Ambos tendréis que responderlas.</p>
        <button className="primary" onClick={() => onStartDiagnostics(results.recommendedDiagnosticQuestionIds)}>Hacer bloque extra recomendado</button>
      </div>}
      <h2>Conversaciones que más pueden acercaros</h2>
      <div className="listCards">
        {results.conversationPriorities.slice(0,6).map(item => <ConversationCard key={item.questionId} item={item} />)}
      </div>
      <h2>No asumáis</h2>
      <div className="listCards">
        {results.narrative.doNotAssume.map(x => <article key={x}>{x}</article>)}
      </div>
    </>}

    {tab === "dimensions" && <>
      <h2>Dimensiones conjuntas</h2>
      <div className="dimensionList">
        {results.dimensionScores.map(d => <div key={d.dimensionId} className="dimensionRow">
          <span>{d.dimension}</span>
          <Progress n={d.score} />
        </div>)}
      </div>
      <h2>Bloqueadores estructurales</h2>
      <div className="listCards">
        {results.criticalFlags.length ? results.criticalFlags.map(row => <article key={row.questionId} className="criticalCard">
          <b>{row.dimension} · {row.score}/100</b>
          <p>{row.question}</p>
          <p>{row.criticalDetail?.conversationPrompt || row.conversationScript}</p>
        </article>) : <article>No hay bloqueadores fuertes detectados.</article>}
      </div>
      <h2>Encajes espejo</h2>
      <div className="listCards">
        {results.mirrorFits.length ? results.mirrorFits.map((m,i) => <article key={i}>
          <b>{m.direction.replaceAll("_"," ")} · {m.score}/100</b>
          <p><b>Necesidad:</b> {m.needLabel}</p>
          <p><b>Respuesta del otro:</b> {m.giveLabel}</p>
        </article>) : <article>No hay suficientes preguntas espejo en esta versión.</article>}
      </div>
    </>}

    {tab === "questions" && <>
      <h2>Comparación pregunta a pregunta</h2>
      <select className="input" value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="all">Todas</option>
        <option value="critical">Solo críticas</option>
        <option value="low">Solo score bajo</option>
        <option value="private">Solo sensibles</option>
        <option value="strength">Solo encajes fuertes</option>
        <option value="complementarity">Solo complementarias</option>
        {results.dimensionScores.map(d => <option key={d.dimensionId} value={d.dimensionId}>{d.dimension}</option>)}
      </select>
      <div className="comparisonList">
        {filteredRows.map(row => <QuestionComparison key={row.questionId} row={row} />)}
      </div>
    </>}

    {tab === "answers" && <>
      <h2>Respuestas completas separadas</h2>
      <SeparatedAnswers session={session} />
    </>}

    {tab === "export" && <>
      <h2>Exportar todo</h2>
      <p>El ZIP incluye JSON completo, CSV de respuestas, CSV de comparaciones, TXT de informe y metadata. Es la opción recomendada para guardar todo.</p>
      <div className="exportGrid">
        <button className="primary" onClick={() => downloadZip(session, results)}>Descargar ZIP completo</button>
        <button className="secondary" onClick={() => download("doble-pulso-export-completo.json", JSON.stringify(fullExport, null, 2), "application/json")}>JSON completo</button>
        <button className="secondary" onClick={() => download("doble-pulso-respuestas.csv", responsesCsv(session, session.mode), "text/csv;charset=utf-8")}>CSV respuestas</button>
        <button className="secondary" onClick={() => download("doble-pulso-comparaciones.csv", comparisonsCsv(results), "text/csv;charset=utf-8")}>CSV comparaciones</button>
        <button className="secondary" onClick={() => download("doble-pulso-informe.txt", textReport(session, results), "text/plain;charset=utf-8")}>TXT informe</button>
        <button className="secondary" onClick={() => exportPng(session, results)}>PNG resumen</button>
        <button className="ghost" onClick={async () => {
          const ok = await shareJson(fullExport);
          if (!ok) download("doble-pulso-export-completo.json", JSON.stringify(fullExport, null, 2), "application/json");
        }}>Compartir JSON en iOS</button>
        <button className="ghost danger" onClick={onDelete}>Eliminar sala y respuestas</button>
      </div>
    </>}
  </section>;
}

function Dashboard({ results }) {
  return <>
    <div className="scoreGrid">
      <div className="mainScore"><b>{results.overall}</b><span>/100</span><em>{results.label}</em></div>
      <Metric label="Química" value={results.indices.chemistry} />
      <Metric label="Sostenibilidad" value={results.indices.sustainability} />
      <Metric label="Seguridad" value={results.indices.security} />
      <Metric label="Proyecto" value={results.indices.project} />
      <Metric label="Cuidado" value={results.indices.care} />
      <Metric label="Malentendidos" value={results.indices.misunderstandingRisk} inverse />
      <Metric label="Diferencia cuidable" value={results.indices.workableDifference} />
      <Metric label="Confianza" value={results.indices.confidence} />
    </div>
    {results.criticalFlags.length > 0 && <div className="warning">
      <b>Hay {results.criticalFlags.length} diferencia(s) estructural(es).</b>
      <p>No significa “fracaso”, pero sí “habladlo pronto”.</p>
    </div>}
  </>;
}

function ConversationCard({ item }) {
  return <article>
    <b>{item.dimension} · {item.score}/100</b>
    <p>{item.prompt}</p>
    <details>
      <summary>Cómo hablar esto</summary>
      <p>{item.script}</p>
      <p><b>A:</b> {item.labelA}</p>
      <p><b>B:</b> {item.labelB}</p>
    </details>
  </article>;
}

function QuestionComparison({ row }) {
  return <article className={row.critical ? "critical" : row.complementarity ? "complementary" : ""}>
    <b>{row.questionId} · {row.dimension} · {row.score}/100</b>
    <p>{row.question}</p>
    <p><b>A:</b> {row.labelA}</p>
    <p><b>B:</b> {row.labelB}</p>
    <small>{row.reason}</small>
    <details>
      <summary>Cómo hablar esto</summary>
      <p>{row.conversationScript}</p>
    </details>
  </article>;
}

function SeparatedAnswers({ session }) {
  const questions = questionsForSession(session, session.mode);
  return <div className="splitAnswers">
    {["A","B"].map(p => <div key={p}>
      <h3>{session.participants?.[p]?.name || `Persona ${p}`}</h3>
      <div className="comparisonList">
        {questions.map(q => {
          const raw = session.answers?.[p]?.[q.id];
          return <article key={`${p}-${q.id}`}>
            <b>{q.id} · {q.dimension}</b>
            <p>{q.text}</p>
            <p>{raw ? answerLabel(q, raw.value) : "Sin respuesta"}</p>
          </article>;
        })}
      </div>
    </div>)}
  </div>;
}

function Metric({ label, value, inverse = false }) {
  return <div className="metric">
    <span>{label}</span>
    <b>{value}</b>
    <Progress n={inverse ? Math.max(0, 100 - value) : value} />
  </div>;
}
