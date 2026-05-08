
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/rooms") {
      const body = await safeJson(request);
      const roomId = randomRoomId();
      const pin = normalizePin(body.pin) || randomPin();
      const ttlHours = normalizeTtl(body.ttlHours);
      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);
      const init = await stub.fetch(new Request("https://room/init", {
        method: "POST",
        body: JSON.stringify({
          roomId,
          mode: body.mode || "balanced",
          pin,
          ttlHours,
          flowMode: body.flowMode === "together" ? "together" : "free",
          deleteAfterComplete: Boolean(body.deleteAfterComplete),
          questionIds: Array.isArray(body.questionIds) ? body.questionIds : []
        })
      }));
      if (!init.ok) return init;
      const created = await init.json();
      return json({
        roomId,
        pin,
        expiresAt: created.expiresAt,
        url: `${url.origin}${url.pathname.replace("/api/rooms","")}?room=${roomId}`
      });
    }

    const match = url.pathname.match(/^\/api\/rooms\/([^/]+)(\/ws|\/state)?$/);
    if (match) {
      const roomId = match[1];
      const action = match[2] || "/state";
      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);

      if (request.method === "DELETE") {
        const nextUrl = new URL(request.url);
        nextUrl.pathname = "/delete";
        return stub.fetch(new Request(nextUrl, request));
      }

      const nextUrl = new URL(request.url);
      nextUrl.pathname = action;
      return stub.fetch(new Request(nextUrl, request));
    }

    return env.ASSETS.fetch(request);
  }
};

export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/init" && request.method === "POST") {
      const body = await safeJson(request);
      const existing = await this.state.storage.get("session");
      if (existing && !isExpired(existing)) return json(publicSession(existing));
      if (existing && isExpired(existing)) await this.expireNow(existing);

      const ttlHours = normalizeTtl(body.ttlHours);
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + ttlHours * 60 * 60 * 1000).toISOString();
      const session = {
        id: body.roomId,
        mode: body.mode || "balanced",
        flowMode: body.flowMode === "together" ? "together" : "free",
        deleteAfterComplete: Boolean(body.deleteAfterComplete),
        questionIds: Array.isArray(body.questionIds) ? body.questionIds : [],
        currentIndex: 0,
        diagnosticsStarted: false,
        createdAt: createdAt.toISOString(),
        expiresAt,
        ttlHours,
        completedAt: null,
        expired: false,
        deleted: false,
        participants: {
          A: { name: "Persona A", connected: false, lastSeen: null },
          B: { name: "Persona B", connected: false, lastSeen: null }
        },
        clients: body.clientId ? { [body.clientId]: "A" } : {},
        answers: { A: {}, B: {} },
        completed: { A: false, B: false },
        eventLog: [],
        security: {
          pinHash: await hashPin(normalizePin(body.pin) || randomPin())
        }
      };
      await this.state.storage.put("session", session);
      await this.state.storage.setAlarm(Date.parse(expiresAt));
      return json(publicSession(session));
    }

    if (url.pathname === "/delete") {
      const session = await this.getSession();
      if (!session) return json({ ok: true, deleted: true });
      const pin = normalizePin(url.searchParams.get("pin"));
      if (!pin || !(await this.validPin(session, pin))) return json({ error: "PIN incorrecto" }, { status: 403 });
      await this.deleteNow(session, "manual_delete_api");
      return json({ ok: true, deleted: true });
    }

    if (url.pathname === "/state") {
      const session = await this.getSession();
      if (!session || isExpired(session)) {
        if (session) await this.expireNow(session);
        return json({ expired: true, id: session?.id || "unknown" }, { status: 410 });
      }
      const pin = normalizePin(url.searchParams.get("pin"));
      if (!pin || !(await this.validPin(session, pin))) return json({ error: "PIN incorrecto" }, { status: 403 });
      return json(publicSession(session));
    }

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }

      const session = await this.getSession();
      if (!session || isExpired(session)) {
        if (session) await this.expireNow(session);
        return new Response("Room expired", { status: 410 });
      }

      const pin = normalizePin(url.searchParams.get("pin"));
      if (!pin || !(await this.validPin(session, pin))) {
        return new Response("Invalid PIN", { status: 403 });
      }

      const clientId = url.searchParams.get("clientId") || "";
      if (!clientId) {
        return new Response("Missing clientId", { status: 400 });
      }
      session.clients ||= {};
      let participant = session.clients[clientId];
      if (!participant) {
        const taken = new Set(Object.values(session.clients));
        if (!taken.has("A")) participant = "A";
        else if (!taken.has("B")) participant = "B";
        else return new Response("Sala llena", { status: 409 });
        session.clients[clientId] = participant;
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();

      const urlName = url.searchParams.get("name") || "";
      const conn = { ws: server, participant };
      this.sessions.add(conn);

      session.participants[participant] ||= {};
      if (urlName) session.participants[participant].name = urlName;
      session.participants[participant].connected = true;
      session.participants[participant].lastSeen = new Date().toISOString();
      await this.save(session);
      try { server.send(JSON.stringify({ type: "assigned", role: participant })); } catch {}
      this.broadcast();

      server.addEventListener("message", async event => {
        try {
          const msg = JSON.parse(event.data);
          await this.handleMessage(participant, msg);
        } catch (err) {
          server.send(JSON.stringify({ type: "error", message: err.message || "Mensaje inválido" }));
        }
      });

      server.addEventListener("close", async () => {
        this.sessions.delete(conn);
        const current = await this.getSession();
        if (current && current.participants?.[participant]) {
          current.participants[participant].connected = false;
          current.participants[participant].lastSeen = new Date().toISOString();
          await this.save(current);
          this.broadcast();
        }
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Not found", { status: 404 });
  }

  async alarm() {
    const session = await this.getSession();
    if (session && isExpired(session)) await this.expireNow(session);
  }

  async expireNow(session) {
    const marker = {
      id: session.id,
      expired: true,
      expiredAt: new Date().toISOString(),
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    };
    await this.state.storage.put("expiredMarker", marker);
    await this.state.storage.delete("session");
    this.broadcastExpired(marker);
  }

  async deleteNow(session, reason = "manual_delete") {
    const marker = {
      id: session.id,
      deleted: true,
      deletedAt: new Date().toISOString(),
      reason
    };
    await this.state.storage.put("deletedMarker", marker);
    await this.state.storage.delete("session");
    this.broadcastDeleted(marker);
  }

  async getSession() {
    return await this.state.storage.get("session");
  }

  async save(session) {
    if (isExpired(session)) {
      await this.expireNow(session);
      return;
    }
    session.updatedAt = new Date().toISOString();
    await this.state.storage.put("session", session);
  }

  async validPin(session, pin) {
    return session.security?.pinHash === await hashPin(pin);
  }

  async handleMessage(participant, msg) {
    const session = await this.getSession();
    if (!session || isExpired(session)) {
      if (session) await this.expireNow(session);
      return;
    }

    session.eventLog ||= [];
    session.eventLog.push({
      at: new Date().toISOString(),
      participant,
      type: msg.type,
      questionId: msg.questionId || null
    });
    session.eventLog = session.eventLog.slice(-250);

    if (msg.type === "delete_room") {
      await this.deleteNow(session, "manual_delete_ws");
      return;
    }

    if (msg.type === "name") {
      session.participants[participant].name = msg.name || `Persona ${participant}`;
    }

    if (msg.type === "answer") {
      session.answers[participant] ||= {};
      session.answers[participant][msg.questionId] = {
        value: Number(msg.value),
        private: Boolean(msg.private),
        answeredAt: new Date().toISOString()
      };
      session.completed[participant] = false;
      session.completedAt = null;

      if (session.flowMode === "together") {
        this.advanceTogetherIfReady(session, msg.questionId);
      }
    }

    if (msg.type === "complete") {
      session.completed[participant] = true;
      if (session.completed.A && session.completed.B) {
        this.markCompleted(session);
      }
    }

    if (msg.type === "start_diagnostics") {
      const ids = Array.isArray(msg.questionIds) ? msg.questionIds.filter(Boolean) : [];
      const existing = new Set(session.questionIds || []);
      ids.forEach(id => existing.add(id));
      session.questionIds = [...existing];
      session.diagnosticsStarted = true;
      session.completed = { A: false, B: false };
      session.completedAt = null;
      if (session.flowMode === "together") {
        session.currentIndex = Math.max(0, session.questionIds.findIndex(id => !session.answers.A[id] || !session.answers.B[id]));
        if (session.currentIndex < 0) session.currentIndex = session.questionIds.length - 1;
      }
    }

    await this.save(session);
    this.broadcast(session);
  }

  advanceTogetherIfReady(session, questionId) {
    if (!session.questionIds?.length) return;
    const idx = session.currentIndex || 0;
    const expectedId = session.questionIds[idx];
    if (questionId !== expectedId) return;
    const aDone = Boolean(session.answers.A?.[expectedId]);
    const bDone = Boolean(session.answers.B?.[expectedId]);
    if (!aDone || !bDone) return;
    if (idx < session.questionIds.length - 1) {
      session.currentIndex = idx + 1;
    } else {
      session.completed.A = true;
      session.completed.B = true;
      this.markCompleted(session);
    }
  }

  markCompleted(session) {
    session.completedAt = new Date().toISOString();
    if (session.deleteAfterComplete) {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      session.expiresAt = expiresAt;
      session.ttlAfterCompleteMinutes = 30;
      this.state.storage.setAlarm(Date.parse(expiresAt));
    }
  }

  async broadcast(sessionArg) {
    const session = sessionArg || await this.getSession();
    if (!session) return;
    const payload = JSON.stringify({ type: "state", session: publicSession(session) });
    for (const conn of [...this.sessions]) {
      try { conn.ws.send(payload); }
      catch { this.sessions.delete(conn); }
    }
  }

  broadcastExpired(marker) {
    const payload = JSON.stringify({ type: "expired", session: marker });
    for (const conn of [...this.sessions]) {
      try { conn.ws.send(payload); conn.ws.close(1000, "expired"); }
      catch { this.sessions.delete(conn); }
    }
  }

  broadcastDeleted(marker) {
    const payload = JSON.stringify({ type: "deleted", session: marker });
    for (const conn of [...this.sessions]) {
      try { conn.ws.send(payload); conn.ws.close(1000, "deleted"); }
      catch { this.sessions.delete(conn); }
    }
  }
}

function publicSession(session) {
  const { security, clients, ...safe } = session || {};
  return safe;
}

function randomRoomId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i=0;i<6;i++) s += alphabet[Math.floor(Math.random()*alphabet.length)];
  return s;
}

function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function normalizePin(pin) {
  const clean = String(pin || "").replace(/\D/g, "").slice(0, 8);
  return clean.length >= 4 ? clean : "";
}

function normalizeTtl(ttlHours) {
  const allowed = [2, 24, 168];
  const n = Number(ttlHours);
  return allowed.includes(n) ? n : 24;
}

async function hashPin(pin) {
  const data = new TextEncoder().encode(String(pin || ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function isExpired(session) {
  return Boolean(session?.expiresAt && Date.now() > Date.parse(session.expiresAt));
}

async function safeJson(request) {
  try { return await request.json(); }
  catch { return {}; }
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json;charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}
