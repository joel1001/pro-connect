const fs = require('fs');
const os = require('os');
const path = require('path');

const BACKEND_PORT = 8080;

/** Prefer Wi‑Fi (en0) — avoids VPN/bridge IPs that phones cannot reach. */
function getLanIp() {
  const ifaces = os.networkInterfaces();
  const preferred = ['en0', 'en1', 'wlan0', 'eth0'];
  for (const name of preferred) {
    for (const addr of ifaces[name] ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  for (const name of Object.keys(ifaces)) {
    if (/^(utun|awdl|llw|bridge|lo)/i.test(name)) continue;
    for (const addr of ifaces[name] ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return 'localhost';
}

function lanApiUrl(ip = getLanIp()) {
  return `http://${ip}:${BACKEND_PORT}/api/v1`;
}

function lanWsUrl(ip = getLanIp()) {
  return `ws://${ip}:${BACKEND_PORT}/api/v1/ws/chat`;
}

function lanWebUrl(ip = getLanIp(), metroPort = process.env.EXPO_METRO_PORT || '8081') {
  return `http://${ip}:${metroPort}`;
}

function writeLanEnv(root, label = 'dev') {
  const ip = getLanIp();
  const envLocal = path.join(root, '.env.development.local');
  fs.writeFileSync(
    envLocal,
    [
      `# Auto: ${label} — LAN IP (simulador + iPhones en la misma WiFi)`,
      `EXPO_PUBLIC_API_URL=${lanApiUrl(ip)}`,
      `EXPO_PUBLIC_WS_URL=${lanWsUrl(ip)}`,
      `EXPO_PUBLIC_WEB_URL=${lanWebUrl(ip)}`,
      '',
    ].join('\n'),
    'utf8',
  );
  return { ip, apiUrl: lanApiUrl(ip), wsUrl: lanWsUrl(ip), envLocal };
}

async function assertBackendReachable(apiUrl) {
  const health = await fetch(apiUrl, { signal: AbortSignal.timeout(2500) });
  if (health.status >= 500) throw new Error(`health ${health.status}`);
}

module.exports = {
  BACKEND_PORT,
  getLanIp,
  lanApiUrl,
  lanWsUrl,
  lanWebUrl,
  writeLanEnv,
  assertBackendReachable,
};
