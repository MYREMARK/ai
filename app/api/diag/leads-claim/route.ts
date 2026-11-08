// TEMPORARY diagnostic endpoint (Preview only). Remove before merging to main.
//
// Focused experiment: does ONE extra GET (on a brand-new connection) resolve the redirect-GET stalls seen with
// method B (node:https, a new Agent({ keepAlive: false }) for every request => new TCP+TLS connection each time)?
// Three strictly sequential requests, all method B. Every request is a POST "claim" for a lead id that has a valid
// format but does not exist, so the script answers not_found: nothing is created, no status changes, nothing is
// written to the sheet and no email is sent.
//   POST: 7 s limit, never retried.
//   302 -> GET #1 of the redirect target: 6 s limit.
//   GET #1 timed out -> exactly ONE more GET (#2) to the SAME redirect URL, on a NEW connection, 3 s limit.
//   Any other GET #1 failure (network error) is not retried. GET #1 and GET #2 are recorded separately.
//
// Protection: POST only; answers 404 outside a Preview deployment (including Production); requires the
// header x-diag-token = HMAC-SHA256(LEADS_WEBAPP_SECRET, "leads-diag-v1") in hex, compared in constant
// time. The raw secret is never sent or returned. No new environment variable is needed.
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import https from "https";
import { newCallCtx, tuning } from "@/lib/leads-sheet";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const POST_TIMEOUT_MS = 7000;
const GET_RETRY_TIMEOUT_MS = 3000;
const REQUESTS = 3;
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

type Conn = {
  kind: "new";
  ms?: number; // time from the start of the hop until the connection was ready (TLS done for B)
  dnsMs?: number;
  tcpMs?: number;
  tlsMs?: number;
};
type HopOut = { status: number; location: string | null; text: string; conn: Conn };
type Init = { method: "POST" | "GET"; headers?: Record<string, string>; body?: string };

/** node:https with a NEW Agent({ keepAlive: false }) per hop => new TCP+TLS connection, Connection: close. */
function hop(urlStr: string, init: Init, budgetMs: number): Promise<HopOut> {
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

type Get = { sentAt: number; result: string; ms: number; conn?: Conn };
type Row = {
  i: number;
  method: "B";
  reqId: string;
  startIso: string;
  conn?: Conn; // connection used by the POST
  postSent: number; // ms from start until the POST was handed to the network (after the connection was ready)
  r302?: number;
  status?: number;
  get1?: Get;
  get2?: Get; // only present if get1 timed out
  json?: number;
  totalMs: number;
  outcome: string;
  viaGetRetry: boolean;
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
  const rows: Row[] = [];

  for (let i = 0; i < REQUESTS; i++) {
    // Strictly sequential: the next request starts only after this one has fully ended.
    const t0 = Date.now();
    const at = () => Date.now() - t0;
    const reqId = `${batch.rid}-b${i + 1}`;
    const row: Row = { i: i + 1, method: "B", reqId, startIso: new Date(t0).toISOString(), postSent: 0, totalMs: 0, outcome: "ok", viaGetRetry: false };
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
      const post = await hop(url, { method: "POST", headers: { "Content-Type": "application/json" }, body }, Math.min(POST_TIMEOUT_MS, remaining()));
      row.conn = post.conn;
      row.r302 = at();
      row.status = post.status;
      row.postSent = post.conn.ms ?? 0;

      let res = post;
      if (post.status >= 300 && post.status < 400) {
        phase = "get";
        const location = post.location;
        if (!location || !LOCATION_RE.test(location)) throw new Error("BAD_REDIRECT");
        const attemptGet = async (limit: number): Promise<{ g: Get; out?: HopOut; err?: HopError }> => {
          const g: Get = { sentAt: at(), result: "", ms: 0 };
          const g0 = Date.now();
          try {
            const out = await hop(location, { method: "GET" }, Math.min(limit, remaining()));
            g.result = "ok";
            g.conn = out.conn;
            return { g, out };
          } catch (e) {
            const err = e instanceof HopError ? e : new HopError("network");
            g.result = err.kind;
            return { g, err };
          } finally {
            g.ms = Date.now() - g0;
          }
        };
        const first = await attemptGet(tuning.getTimeoutMs);
        row.get1 = first.g;
        if (first.out) {
          res = first.out;
        } else if (first.err?.kind === "timeout") {
          // Exactly one more GET, same redirect URL, new connection (new Agent), shorter limit.
          const second = await attemptGet(GET_RETRY_TIMEOUT_MS);
          row.get2 = second.g;
          if (!second.out) throw second.err!;
          res = second.out;
          row.viaGetRetry = true;
        } else {
          throw first.err!;
        }
      }
      const parsed = JSON.parse(res.text) as { ok?: boolean; error?: string };
      row.json = at();
      row.outcome = parsed.ok ? "unexpected_ok" : `answered_${parsed.error ?? "unknown"}`;
    } catch (e) {
      row.outcome =
        e instanceof HopError ? `${e.kind}_${phase}${row.get2 ? "_after_retry" : ""}` : e instanceof Error ? `error_${e.message.slice(0, 40)}` : "error";
    }
    row.totalMs = at();
    rows.push(row);
    const gl = (n: string, g?: Get) => (g ? `${n}=${g.result}@${g.ms}(sent ${g.sentAt}, tls ${g.conn?.tlsMs ?? "-"})` : `${n}=-`);
    console.log(
      `LEADS_DIAG_GET2 rid=${reqId} start=${row.startIso} conn_tls=${row.conn?.tlsMs ?? "-"} post_sent=${row.postSent}` +
        ` r302=${row.r302 ?? "-"} status=${row.status ?? "-"} ${gl("get1", row.get1)} ${gl("get2", row.get2)}` +
        ` json=${row.json ?? "-"} total_ms=${row.totalMs} via_retry=${row.viaGetRetry} outcome=${row.outcome}`
    );
  }

  return Response.json({
    rid: batch.rid,
    startedAt: new Date(batch.startedAt).toISOString(),
    runtime: { node: process.version, region: process.env.VERCEL_REGION ?? null },
    experiment: "B-only, 3 POST, GET retry once on timeout",
    rows,
  });
}
