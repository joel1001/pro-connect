#!/usr/bin/env node
/** Arranca el backend Spring Boot (perfil local). */
const { spawn } = require('child_process');
const path = require('path');

const backendRoot = path.join(__dirname, '..', '..', 'backend');

const proc = spawn(
  'mvn',
  ['spring-boot:run', '-Dspring-boot.run.profiles=local'],
  { cwd: backendRoot, stdio: 'inherit' },
);

proc.on('exit', (code) => process.exit(code ?? 0));
