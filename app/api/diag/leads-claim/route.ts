// TEMPORARY diagnostic endpoint (Preview only). Remove before merging to main.
//
// Controlled A/B experiment: are the POST stalls related to Node fetch re-using pooled network connections?
//   A = the same fetch() the lead flow uses (global undici dispatcher, keep-alive connection pool)
//   B = node:https request with a brand-new Agent({ keepAlive: false }) for every request, so every request
//       (and every redirect GET) opens a NEW TCP+TLS connection and is sent with "Connection: close"
// Six strictly sequential requests in the order A, B, A, B, A, B. Every request is a POST "claim" for a lead id
// that has a valid format but does not exist, so the script answers not_found: nothing is created, no status
// changes, nothing is written to the sheet and no email is sent. 7 s limit for each POST, no retries at all.
// If a 302 arrives, the redirect target is fetched with GET using the SAME method as the POST (6 s limit,
// manual redirects) and is timed separately.
//
// Protection: POST only; answers 404 outside a Preview deployment (including Production); requires the
// header x-diag-token = HMAC-SHA256(LEADS_WEBAPP_SECRET, "leads-diag-v1") in hex, compared in constant
// time. The raw secret is never sent or returned. No new environment variable is needed.
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import dc from "diagnostics_channel";
import https from "https";
import { newCallCtx, tuning } from "@/lib/leads-sheet";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const POST_TIMEOUT_MS = 7000;
const ORDER = ["A", "B", "A", "B", "A", "B"] as const;
const LOCATION_RE = /^https:\/\/(script|script\.googleusercontent)\.(google|googleusercontent)\.com\//;

function expectedToken(secret: string) {
  return createHmac("sha256", secret).update("leads-diag-v1").digest("hex");
}

function tokenOk(given: string | null, secret: string | undefined) {
  if (!secret || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expectedToken(secret));
  return a.length === b.length && timingSafeEqual(a, b);
}

class HopError extends Error {
  constructor(public kind: "timeout" | "network" | "deadline") {
    super(kind);
  }
}

// ---- connection evidence for method A (fetch): undici announces every NEW connection it opens ----
let undiciConnects: number[] = []; // timestamps (Date.now) of "client connected" events
let diagAvailable = false;
try {
  dc.subscribe("undici:client:connected", () => undiciConnects.push(Date.now()));
  diagAvailable = true;
} catch {
  diagAvailable = false;
}

type Conn = {
  kind: "new" | "reused" | "unknown";
  ms?: number; // time from the start of the hop until the connection was ready (TLS done for B)
  dnsMs?: number;
  tcpMs?: number;
  tlsMs?: number;
};
type HopOut = { status: number; location: string | null; text: string; conn: Conn };
type Init = { method: "POST" | "GET"; headers?: Record<string, string>; body?: string };

/** Method A: fetch, exactly as lib/leads-sheet.ts (redirect manual, no-store, one AbortController per hop). */
async function hopFetch(url: string, init: Init, budgetMs: number): Promise<HopOut> {
  if (budgetMs <= 0) throw new HopError("deadline");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
  const t0 = Date.now();
  const connectsBefore = undiciConnects.length;
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store", redirect: "manual" });
    const text = await res.text();
    const fresh = undiciConnects.slice(connectsBefore);
    const conn: Conn = !diagAvailable
      ? { kind: "unknown" }
      : fresh.length
        ? { kind: "new", ms: fresh[0] - t0 }
        : { kind: "reused" };
    return { status: res.status, location: res.headers.get("location"), text, conn };
  } catch {
    throw new HopError(controller.signal.aborted ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }
}

/** Method B: node:https with a NEW Agent({ keepAlive: false }) per hop => new TCP+TLS connection, Connection: close. */
function hopHttps(urlStr: string, init: Init, budgetMs: number): Promise<HopOut> {
  if (budgetMs <= 0) return Promise.reject(new HopError("deadline"));
  return new Promise<HopOut>((resolve, reject) => {
    const u = new URL(urlStr);
    const agent = new https.Agent({ keepAlive: false });
    const t0 = Date.now();
    const conn: Conn = { kind: "new" };
    let settled = false;
    let timedOut = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      agent.destroy();
      fn();
    };
    const headers: Record<string, string> = { ...(init.headers ?? {}) };
    if (init.body !== undefined) headers["Content-Length"] = String(Buffer.byteLength(init.body));
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: init.method,
        headers,
        agent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          finish(() =>
            resolve({
              status: res.statusCode ?? 0,
              location: typeof res.headers.location === "string" ? res.headers.location : null,
              text: Buffer.concat(chunks).toString("utf8"),
              conn,
            })
          )
        );
        res.on("error", () => finish(() => reject(new HopError(timedOut ? "timeout" : "network"))));
      }
    );
    req.on("socket", (s) => {
      s.once("lookup", () => (conn.dnsMs = Date.now() - t0));
      s.once("connect", () => (conn.tcpMs = Date.now() - t0));
      s.once("secureConnect", () => {
        conn.tlsMs = Date.now() - t0;
        conn.ms = conn.tlsMs;
      });
    });
    req.on("error", () => finish(() => reject(new HopError(timedOut ? "timeout" : "network"))));
    const timer = setTimeout(() => {
      timedOut = true;
      req.destroy();
    }, budgetMs);
    if (init.body !== undefined) req.write(init.body);
    req.end();
  });
}

type Row = {
  i: number;
  method: "A" | "B";
  reqId: string;
  startIso: string;
  conn?: Conn; // connection used by the POST
  postSent: number; // ms from start until the POST was handed to the network (A: 0; B: after the connection was ready)
  r302?: number;
  status?: number;
  getSent?: number;
  getResult?: string; // ok | timeout | network | deadline | not_applicable
  getMs?: number;
  getConn?: Conn;
  json?: number;
  totalMs: number;
  outcome: string;
};

export async function POST(req: Request) {
  // Hidden unless this is a Preview deployment.
  if (process.env.VERCEL_ENV !== "preview") return new Response("Not found", { status: 404 });
  if (!tokenOk(req.headers.get("x-diag-token"), process.env.LEADS_WEBAPP_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const url = process.env.LEADS_WEBAPP_URL;
  const secret = process.env.LEADS_WEBAPP_SECRET;
  if (!url || !secret) return new Response("Not configured", { status: 500 });

  const batch = newCallCtx();
  const deadlineAt = batch.startedAt + tuning.requestBudgetMs;
  const remaining = () => deadlineAt - Date.now();
  undiciConnects = [];
  const rows: Row[] = [];

  for (let i = 0; i < ORDER.length; i++) {
    // Strictly sequential: the next request starts only after this one has fully ended.
    const method = ORDER[i];
    const hop = method === "A" ? hopFetch : hopHttps;
    const t0 = Date.now();
    const at = () => Date.now() - t0;
    const reqId = `${batch.rid}-${method.toLowerCase()}${i + 1}`;
    const row: Row = { i: i + 1, method, reqId, startIso: new Date(t0).toISOString(), postSent: 0, totalMs: 0, outcome: "ok" };
    let phase: "post" | "get" = "post";
    try {
      const body = JSON.stringify({
        action: "claim",
        leadId: randomUUID(), // valid format, not in the sheet
        kind: "admin",
        attemptId: randomUUID(),
        secret,
        reqId,
      });
      const post = await hop(
        url,
        { method: "POST", headers: { "Content-Type": "application/json" }, body },
        Math.min(POST_TIMEOUT_MS, remaining())
      );
      row.conn = post.conn;
      row.r302 = at();
      row.status = post.status;
      row.postSent = method === "B" && post.conn.ms !== undefined ? post.conn.ms : 0;

      let res = post;
      if (post.status >= 300 && post.status < 400) {
        phase = "get";
        const location = post.location;
        if (!location || !LOCATION_RE.test(location)) throw new Error("BAD_REDIRECT");
        row.getSent = at();
        const g0 = Date.now();
        try {
          res = await hop(location, { method: "GET" }, Math.min(tuning.getTimeoutMs, remaining()));
          row.getResult = "ok";
          row.getConn = res.conn;
        } catch (e) {
          row.getResult = e instanceof HopError ? e.kind : "error";
          throw e;
        } finally {
          row.getMs = Date.now() - g0;
        }
      } else {
        row.getResult = "not_applicable";
      }
      const parsed = JSON.parse(res.text) as { ok?: boolean; error?: string };
      row.json = at();
      row.outcome = parsed.ok ? "unexpected_ok" : `answered_${parsed.error ?? "unknown"}`;
    } catch (e) {
      row.outcome = e instanceof HopError ? `${e.kind}_${phase}` : e instanceof Error ? `error_${e.message.slice(0, 40)}` : "error";
    }
    row.totalMs = at();
    rows.push(row);
    console.log(
      `LEADS_DIAG_AB rid=${reqId} method=${method} start=${row.startIso} conn=${row.conn?.kind ?? "-"}@${row.conn?.ms ?? "-"}` +
        ` post_sent=${row.postSent} r302=${row.r302 ?? "-"} status=${row.status ?? "-"} get_sent=${row.getSent ?? "-"}` +
        ` get=${row.getResult ?? "-"}@${row.getMs ?? "-"} json=${row.json ?? "-"} total_ms=${row.totalMs} outcome=${row.outcome}`
    );
  }

  return Response.json({
    rid: batch.rid,
    startedAt: new Date(batch.startedAt).toISOString(),
    runtime: { node: process.version, region: process.env.VERCEL_REGION ?? null, undiciConnectEvents: diagAvailable },
    order: ORDER.join(""),
    rows,
  });
}
