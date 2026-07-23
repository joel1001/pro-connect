#!/usr/bin/env node
/**
 * iPhone físico: Metro por túnel (QR en terminal) + API por túnel.
 * Escribe .env.development.local para que Expo no use localhost/LAN.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_LOCAL = path.join(ROOT, '.env.development.local');
const BACKEND_PORT = 8080;

function removeEnvLocal() {
  try {
    fs.unlinkSync(ENV_LOCAL);
  } catch {
    /* ok */
  }
}

function writeEnvLocal(apiUrl, wsUrl) {
  fs.writeFileSync(
    ENV_LOCAL,
    [
      '# Auto: npm run go — no editar',
      `EXPO_PUBLIC_API_URL=${apiUrl}`,
      `EXPO_PUBLIC_WS_URL=${wsUrl}`,
      '',
    ].join('\n'),
    'utf8',
  );
}

function waitForLtUrl(proc) {
  return new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('timeout')), 45000);
    const onData = (chunk) => {
      buf += chunk.toString();
      const m = buf.match(/https:\/\/[^\s]+/);
      if (m) {
        clearTimeout(timer);
        resolve(m[0].replace(/[.,]$/, ''));
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`localtunnel salió (${code})`));
    });
  });
}

async function main() {
  removeEnvLocal();

  console.log('\n[go] Túnel al backend (puerto 8080)…');
  const lt = spawn('npx', ['localtunnel', '--port', String(BACKEND_PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let origin;
  try {
    origin = await waitForLtUrl(lt);
    const health = await fetch(origin, { signal: AbortSignal.timeout(2500) });
    if (health.status >= 500) throw new Error(`health ${health.status}`);
  } catch (e) {
    console.error('[go] El backend no respondió como servicio HTTP en :8080.');
    console.error('[go] Inicia el backend: cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=local');
    console.error(e.message);
    lt.kill();
    process.exit(1);
  }

  const apiUrl = `${origin}/api/v1`;
  const wsUrl = `${origin.replace(/^https:/, 'wss:')}/api/v1/ws/chat`;
  writeEnvLocal(apiUrl, wsUrl);

  console.log('[go] API →', apiUrl);
  console.log('[go] Metro por túnel (escaneá el QR de abajo)\n');

  const expo = spawn('npx', ['expo', 'start', '--tunnel', '--go'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, EXPO_NO_REDIRECT_PAGE: '1' },
  });

  const stop = () => {
    removeEnvLocal();
    expo.kill('SIGTERM');
    lt.kill('SIGTERM');
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  expo.on('exit', (code) => {
    removeEnvLocal();
    lt.kill('SIGTERM');
    process.exit(code ?? 0);
  });
}

main().catch((e) => {
  removeEnvLocal();
  console.error(e);
  process.exit(1);
});
