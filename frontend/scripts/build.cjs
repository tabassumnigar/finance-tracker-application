#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const root = path.resolve(__dirname, '..');
const esbuildPackage = os.platform() === 'win32' ? '@esbuild/win32-x64' : '@esbuild/linux-x64';
const esbuildBinary = os.platform() === 'win32' ? 'esbuild.exe' : path.join('bin', 'esbuild');
process.env.ESBUILD_BINARY_PATH = path.join(root, 'node_modules', esbuildPackage, esbuildBinary);

const node = process.execPath;
const tscPath = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const vitePath = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const run = (script, args = []) =>
  new Promise((resolve, reject) => {
    const child = spawn(node, [script, ...args], { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });

(async () => {
  try {
    await run(tscPath);
    await run(vitePath, ['build']);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
