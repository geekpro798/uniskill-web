#!/usr/bin/env node
// uniskill-proxy/index.js
// UniSkill 本地签名代理 — 让 Claude Desktop / Cursor 等本地 Agent
// 通过 secp256k1 Session Key 签名认证，替代静态 Bearer Key
//
// 用法：
//   npx uniskill-proxy                         # 默认读 ~/.uniskill/session.json
//   npx uniskill-proxy --session ./my_key.json # 指定 session 文件路径
//   npx uniskill-proxy --port 7524             # 自定义端口（默认 7523）
//
// Claude Desktop 配置：
//   { "mcpServers": { "uniskill": { "url": "http://localhost:7523/v1/mcp/sse" } } }

import http from "http";
import { Wallet } from "ethers";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

// ── 颜色输出 ─────────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  cyan:   "\x1b[36m",
  gray:   "\x1b[90m",
};

function log(level, msg) {
  const ts  = new Date().toISOString().slice(11, 23);
  const col = level === "OK" ? C.green : level === "WARN" ? C.yellow : level === "ERR" ? C.red : C.gray;
  console.log(`${C.gray}[${ts}]${C.reset} ${col}${C.bold}${level}${C.reset}  ${msg}`);
}

// ── CLI 参数解析 ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
${C.bold}UniSkill Local Signing Proxy${C.reset}  v0.1.0

${C.bold}USAGE${C.reset}
  npx uniskill-proxy [options]

${C.bold}OPTIONS${C.reset}
  --session <path>   Path to session.json  (default: ~/.uniskill/session.json)
  --port    <port>   Local port to listen on (default: 7523)
  --help, -h         Show this help

${C.bold}CLAUDE DESKTOP CONFIG${C.reset}
  {
    "mcpServers": {
      "uniskill": { "url": "http://localhost:7523/v1/mcp/sse" }
    }
  }
`);
  process.exit(0);
}

let PORT        = 7523;
let sessionPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--port"    && args[i + 1]) PORT        = parseInt(args[++i], 10);
  if (args[i] === "--session" && args[i + 1]) sessionPath = args[++i];
}

// ── session.json 加载 ─────────────────────────────────────────────────────
function loadSession() {
  const candidates = sessionPath
    ? [sessionPath]
    : [
        join(process.cwd(), "uniskill_session.json"),
        join(homedir(), ".uniskill", "session.json"),
      ];

  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, "utf-8");
        const cfg = JSON.parse(raw);
        if (!cfg.sessionPrivateKey) throw new Error("Missing sessionPrivateKey");
        if (!cfg.gatewayUrl)        throw new Error("Missing gatewayUrl");
        return cfg;
      } catch (err) {
        console.error(`${C.red}❌ Failed to parse session file at ${p}: ${err.message}${C.reset}`);
        process.exit(1);
      }
    }
  }

  console.error(`
${C.red}${C.bold}❌ session.json not found!${C.reset}

Looked in:
${candidates.map(p => `  ${p}`).join("\n")}

${C.bold}To get a session key:${C.reset}
  1. Log in to https://uniskill.ai
  2. Go to Settings → Account & Security → Local Agent Access
  3. Click "Generate Session Key" and download uniskill_session.json
  4. Move it to ~/.uniskill/session.json
`);
  process.exit(1);
}

const SESSION = loadSession();

// 检查是否已过期
if (SESSION.expiresAt && SESSION.expiresAt < Date.now()) {
  console.error(`${C.red}${C.bold}❌ Session key has expired! (expired: ${new Date(SESSION.expiresAt).toLocaleString()})${C.reset}`);
  console.error(`${C.yellow}Please generate a new session key from the UniSkill Dashboard.${C.reset}`);
  process.exit(1);
}

// 初始化签名钱包
const WALLET     = new Wallet(SESSION.sessionPrivateKey);
const GATEWAY    = SESSION.gatewayUrl.replace(/\/$/, "");
const PROXY_PORT = SESSION.proxyPort || PORT;

// ── 签名工具 ──────────────────────────────────────────────────────────────

/**
 * 构造规范请求字符串（必须与 Gateway 的 buildCanonical 完全一致）
 * 格式: "USK-v1:{METHOD}:{PATH}:{NONCE}:{TIMESTAMP}"
 */
function buildCanonical(method, path, nonce, timestamp) {
  return `USK-v1:${method.toUpperCase()}:${path}:${nonce}:${timestamp}`;
}

/**
 * 对请求进行 EIP-191 签名，返回附加了签名头的 Headers 对象
 */
async function signRequest(method, path) {
  const nonce     = randomUUID();
  const timestamp = Date.now().toString();
  const canonical = buildCanonical(method, path, nonce, timestamp);
  const signature = await WALLET.signMessage(canonical);

  return {
    "X-USK-Wallet":    WALLET.address.toLowerCase(),
    "X-USK-Signature": signature,
    "X-USK-Nonce":     nonce,
    "X-USK-Timestamp": timestamp,
  };
}

// ── HTTP 代理服务器 ───────────────────────────────────────────────────────

const server = http.createServer(async (clientReq, clientRes) => {
  const method  = clientReq.method || "GET";
  const path    = clientReq.url    || "/";

  log("→", `${method} ${path}`);

  // 读取请求体
  const bodyChunks = [];
  for await (const chunk of clientReq) {
    bodyChunks.push(chunk);
  }
  const body = Buffer.concat(bodyChunks);

  // 生成签名头
  const sigHeaders = await signRequest(method, path);

  // 合并原始请求头 + 签名头（签名头优先）
  const forwardHeaders = {
    ...Object.fromEntries(
      Object.entries(clientReq.headers).filter(([k]) =>
        !["host", "connection", "content-length"].includes(k.toLowerCase())
      )
    ),
    ...sigHeaders,
    "Content-Length": body.length > 0 ? body.length.toString() : undefined,
  };

  // 构造目标 URL
  const targetUrl = new URL(path, GATEWAY);

  // 转发到 Gateway
  try {
    const resp = await fetch(targetUrl.toString(), {
      method,
      headers: forwardHeaders,
      body: body.length > 0 ? body : undefined,
      // @ts-ignore
      duplex: "half",
    });

    log(resp.ok ? "OK" : "WARN", `${resp.status} ${method} ${path}`);

    // 回写响应头
    const resHeaders = {};
    resp.headers.forEach((val, key) => {
      if (!["content-encoding", "transfer-encoding"].includes(key.toLowerCase())) {
        resHeaders[key] = val;
      }
    });
    // SSE 需要保持连接
    if (resp.headers.get("content-type")?.includes("text/event-stream")) {
      resHeaders["cache-control"] = "no-cache";
      resHeaders["connection"] = "keep-alive";
    }
    // CORS passthrough
    resHeaders["access-control-allow-origin"] = "*";

    clientRes.writeHead(resp.status, resHeaders);

    // 流式透传响应体（支持 SSE）
    if (resp.body) {
      const reader = resp.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          clientRes.write(value);
        }
        clientRes.end();
      };
      await pump();
    } else {
      clientRes.end();
    }
  } catch (err) {
    log("ERR", `Proxy error: ${err.message}`);
    clientRes.writeHead(502, { "Content-Type": "application/json" });
    clientRes.end(JSON.stringify({ error: "Proxy error", detail: err.message }));
  }
});

// CORS preflight
server.on("request", (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    });
    res.end();
  }
});

// ── 启动 ──────────────────────────────────────────────────────────────────
const UNISKILL_DIR = join(homedir(), ".uniskill");
const ACTIVE_PORT_FILE = join(UNISKILL_DIR, "active_port");

function startServer(port) {
  server.listen(port, "127.0.0.1")
    .on('listening', () => {
      const expiryStr = SESSION.expiresAt
        ? new Date(SESSION.expiresAt).toLocaleDateString()
        : "unknown";

      // 写入 active_port，供 connect.sh/ps1 读取
      if (!existsSync(UNISKILL_DIR)) {
        mkdirSync(UNISKILL_DIR, { recursive: true });
      }
      writeFileSync(ACTIVE_PORT_FILE, port.toString(), "utf-8");

      console.log(`
${C.bold}${C.cyan}⚡ UniSkill Local Signing Proxy${C.reset}  v0.1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${C.bold}Proxy URL${C.reset}    http://localhost:${port}
  ${C.bold}Gateway${C.reset}      ${GATEWAY}
  ${C.bold}Wallet${C.reset}       ${WALLET.address}
  ${C.bold}Session${C.reset}      ${SESSION.label || "Local Agent"}
  ${C.bold}Expires${C.reset}      ${expiryStr}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${C.bold}Claude Desktop config (~/.claude/claude_desktop_config.json):${C.reset}
  {
    "mcpServers": {
      "uniskill": { "url": "http://localhost:${port}/v1/mcp/sse" }
    }
  }

${C.gray}Press Ctrl+C to stop.${C.reset}
`);
    })
    .on('error', (err) => {
      // @ts-ignore
      if (err.code === 'EADDRINUSE') {
        log("WARN", `Port ${port} is in use, trying ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error(`${C.red}❌ Proxy start failed: ${err.message}${C.reset}`);
        process.exit(1);
      }
    });
}

startServer(PROXY_PORT);

process.on("SIGINT",  () => { console.log("\n✋ Proxy stopped."); process.exit(0); });
process.on("SIGTERM", () => { console.log("\n✋ Proxy stopped."); process.exit(0); });
