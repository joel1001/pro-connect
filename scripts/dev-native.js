#!/usr/bin/env node
/**
 * npm run native[:ios|:android|:start] — development build (expo-dev-client). No usa Expo Go.
 */
const { spawn } = require('child_process');
const path = require('path');
const { writeLanEnv } = require('./lan-env');

const ROOT = path.join(__dirname, '..');
const METRO_PORT = process.env.EXPO_METRO_PORT || '8081';
const target = process.argv[2] || 'ios';

const { ip, apiUrl } = writeLanEnv(ROOT, 'npm run native');

console.log('\n[native] ProConnect development build');
console.log(`[native] API → ${apiUrl}`);
console.log(`[native] target → ${target}\n`);

const command =
  target === 'android'
    ? ['expo', 'run:android']
    : target === 'start'
      ? ['expo', 'start', '--dev-client', '--lan', '--port', String(METRO_PORT)]
      : ['expo', 'run:ios'];

const proc = spawn('npx', command, {
  cwd: ROOT,
  stdio: 'inherit',
  env: {
    ...process.env,
    RCT_METRO_PORT: String(METRO_PORT),
    REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REACT_NATIVE_PACKAGER_HOSTNAME || ip,
  },
});

proc.on('exit', (code) => process.exit(code ?? 0));
