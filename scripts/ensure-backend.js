#!/usr/bin/env node
/** Arranca el backend Spring Boot si el puerto 8080 no responde. */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const { BACKEND_PORT } = require('./lan-env');

const backendRoot = path.join(__dirname, '..', '..', 'backend');
const LOG_PATH = '/tmp/proconnect-backend.log';
const HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/api/v1`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isBackendUp() {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(2500) });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function waitForBackend(maxAttempts = 45) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isBackendUp()) return true;
    await sleep(2000);
  }
  return false;
}

async function startBackendDetached() {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  const logFd = fs.openSync(LOG_PATH, 'a');
  const proc = spawn(
    'mvn',
    ['-q', 'spring-boot:run', '-Dspring-boot.run.profiles=local'],
    {
      cwd: backendRoot,
      detached: true,
      stdio: ['ignore', logFd, logFd],
    },
  );
  proc.unref();
  console.log(`[ProConnect] Backend arrancando (pid ${proc.pid}) → log ${LOG_PATH}`);
}

async function ensureBackend({ startIfDown = true } = {}) {
  if (await isBackendUp()) {
    console.log(`[ProConnect] Backend OK → http://127.0.0.1:${BACKEND_PORT}/api/v1`);
    return true;
  }
  if (!startIfDown) {
    return false;
  }
  await startBackendDetached();
  const ready = await waitForBackend();
  if (!ready) {
    console.error('[ProConnect] El backend no respondió a tiempo. Revisa:', LOG_PATH);
    return false;
  }
  console.log(`[ProConnect] Backend listo → http://127.0.0.1:${BACKEND_PORT}/api/v1`);
  return true;
}

if (require.main === module) {
  ensureBackend()
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { ensureBackend, isBackendUp };
