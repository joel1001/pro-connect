#!/usr/bin/env node
/**
 * Expo Go — un solo entrypoint para dev local.
 *
 * Escribe `.env.development.local` y ejecuta `expo start`:
 *   - `npm run dev` / `npm run start`: API por LAN + Metro por LAN
 *   - `npm run dev:tunnel`: API por túnel + Metro por túnel
 *
 * `--go` + `EXPO_NO_REDIRECT_PAGE` evitan que Expo intente abrir un dev client.
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_LOCAL = path.join(ROOT, '.env.development.local');
const METRO_PORT = process.env.EXPO_METRO_PORT || '8081';
const BACKEND_PORT = 8080;
const useTunnel = process.argv.includes('--tunnel');

function removeEnvLocal() {
  try {
    fs.unlinkSync(ENV_LOCAL);
  } catch {
    /* ok */
  }
}

function writeEnvLocal(apiUrl, wsUrl, label, webUrl) {
  fs.writeFileSync(
    ENV_LOCAL,
    [
      `# Auto: ${label} — no editar`,
      `EXPO_PUBLIC_API_URL=${apiUrl}`,
      `EXPO_PUBLIC_WS_URL=${wsUrl}`,
      ...(webUrl ? [`EXPO_PUBLIC_WEB_URL=${webUrl}`] : []),
      '',
    ].join('\n'),
    'utf8',
  );
}

function writeLanEnvLocal(label) {
  const { getLanIp, lanApiUrl, lanWsUrl, lanWebUrl } = require('./lan-env');
  const ip = getLanIp();
  writeEnvLocal(lanApiUrl(ip), lanWsUrl(ip), label, lanWebUrl(ip, METRO_PORT));
  return { ip, apiUrl: lanApiUrl(ip), wsUrl: lanWsUrl(ip), webUrl: lanWebUrl(ip, METRO_PORT) };
}

function freePort(port) {
  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    if (pids) execSync(`kill -9 ${pids.split('\n').join(' ')}`);
  } catch {
    /* libre */
  }
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

async function startTunnelBackend() {
  const lt = spawn('npx', ['localtunnel', '--port', String(BACKEND_PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let origin;
  try {
    origin = await waitForLtUrl(lt);
    const health = await fetch(origin, { signal: AbortSignal.timeout(2500) });
    if (health.status >= 500) throw new Error(`health ${health.status}`);
  } catch (error) {
    lt.kill();
    throw error;
  }

  return {
    lt,
    apiUrl: `${origin}/api/v1`,
    wsUrl: `${origin.replace(/^https:/, 'wss:')}/api/v1/ws/chat`,
  };
}

async function main() {
  removeEnvLocal();
  freePort(METRO_PORT);

  if (useTunnel) {
    console.log('\n[dev] Túnel al backend (puerto 8080)…');
    let tunnelBackend;
    try {
      tunnelBackend = await startTunnelBackend();
    } catch (error) {
      removeEnvLocal();
      // eslint-disable-next-line no-console
      console.error('[dev] No se pudo levantar el túnel del backend. Expo Go necesita ese acceso para login.');
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    }

    writeEnvLocal(tunnelBackend.apiUrl, tunnelBackend.wsUrl, 'npm run dev:tunnel');
    console.log('[dev] API →', tunnelBackend.apiUrl);
    console.log('[dev:tunnel] Metro por túnel (escaneá el QR de abajo)\n');
    const expo = spawn('npx', ['expo', 'start', '--tunnel', '--go', '--port', String(METRO_PORT)], {
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        EXPO_NO_REDIRECT_PAGE: '1',
        RCT_METRO_PORT: String(METRO_PORT),
      },
    });

    const stop = () => {
      removeEnvLocal();
      expo.kill('SIGTERM');
      tunnelBackend.lt.kill('SIGTERM');
      process.exit(0);
    };

    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
    expo.on('exit', (code) => {
      removeEnvLocal();
      tunnelBackend.lt.kill('SIGTERM');
      process.exit(code ?? 0);
    });
    return;
  }

  const { apiUrl, webUrl } = writeLanEnvLocal('npm run dev');
  console.log('[dev] API →', apiUrl);
  console.log('\n┌─────────────────────────────────────────────┐');
  console.log('│  ProConnect — Expo Go                       │');
  console.log('└─────────────────────────────────────────────┘');
  console.log(`  API    ${apiUrl}`);
  console.log(`  Web    ${webUrl}`);
  console.log(`  Metro  ${webUrl.replace(/^http:/, 'exp:')}`);
  console.log('  i      simulador iOS');
  console.log('  a      emulador Android');
  console.log('  QR     escaneá con Expo Go (no Cámara iOS)\n');

  const expo = spawn('npx', ['expo', 'start', useTunnel ? '--tunnel' : '--lan', '--go', '--port', String(METRO_PORT)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_NO_REDIRECT_PAGE: '1',
      RCT_METRO_PORT: String(METRO_PORT),
    },
  });

  const stop = () => {
    removeEnvLocal();
    expo.kill('SIGTERM');
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  expo.on('exit', (code) => {
    removeEnvLocal();
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  removeEnvLocal();
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
