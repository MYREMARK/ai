// Local, loopback-only check of how Node's global fetch and https/http.request with a fresh keepAlive:false
// Agent use TCP connections. A plain-HTTP loopback server counts the connections it accepts.
// (Agent semantics are identical for https; only TLS is added.) No external network is used.
import http from "http";
import dc from "diagnostics_channel";

const server = http.createServer((req, res) => { req.resume(); req.on("end", () => { res.setHeader("content-type", "application/json"); res.end('{"ok":true}'); }); });
let conns = 0; const ids = new Set();
server.on("connection", (s) => { conns++; ids.add(s.remotePort); });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port, base = `http://127.0.0.1:${port}/x`;

const events = [];
for (const name of ["undici:client:connected", "undici:client:connectError", "undici:client:beforeConnect"]) {
  try { dc.subscribe(name, () => events.push(name)); } catch {}
}

const viaFetch = async () => { const r = await fetch(base, { method: "POST", body: "{}", cache: "no-store" }); await r.text(); };
const viaHttp = () => new Promise((resolve, reject) => {
  const agent = new http.Agent({ keepAlive: false });
  const req = http.request(base, { method: "POST", agent, headers: { "Content-Length": 2 } }, (res) => { res.resume(); res.on("end", () => { agent.destroy(); resolve(res.headers.connection ?? null); }); });
  req.on("error", reject); req.end("{}");
});

const out = [];
const before = () => conns;
let b = before(); for (let i = 0; i < 3; i++) await viaFetch(); out.push(["fetch x3 (global dispatcher, keep-alive)", conns - b]);
const ev1 = events.length;
b = before(); const hdrs = []; for (let i = 0; i < 3; i++) hdrs.push(await viaHttp()); out.push(["http.request x3, new Agent keepAlive:false each", conns - b]);
b = before(); for (let i = 0; i < 3; i++) await viaFetch(); out.push(["fetch x3 again (same process, pooled)", conns - b]);
for (const [n, c] of out) console.log(`${n}: ${c} new TCP connection(s)`);
console.log("server response Connection header seen by B:", JSON.stringify(hdrs));
console.log("undici diagnostics events seen:", JSON.stringify(Object.entries(events.reduce((a, e) => ((a[e] = (a[e] || 0) + 1), a), {}))));
console.log("node", process.version, "undici in node:", process.versions.undici);
server.close();
