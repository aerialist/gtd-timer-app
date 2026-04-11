import os from 'os';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let tauriDriver;
let exit = false;

export const config = {
  host: '127.0.0.1',
  port: 4444,
  specs: ['./test/specs/**/*.js'],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      'tauri:options': {
        application: path.resolve(__dirname, '../src-tauri/target/debug/app'),
        args: [],
      },
    },
  ],
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 30000,
  },

  // Build the debug binary before tests
  onPrepare: () => {
    console.log('Building app...');
    const result = spawnSync(
      'bash',
      ['-c', 'source ~/.cargo/env && cargo build --manifest-path src-tauri/Cargo.toml'],
      {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
        shell: false,
        env: { ...process.env, LIBGL_ALWAYS_SOFTWARE: '1' },
      }
    );
    if (result.status !== 0) {
      throw new Error('Build failed');
    }
  },

  // Start tauri-driver before session
  beforeSession: () => {
    tauriDriver = spawn(
      path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver'),
      [],
      {
        stdio: [null, process.stdout, process.stderr],
        env: {
          ...process.env,
          DISPLAY: ':0',
          LIBGL_ALWAYS_SOFTWARE: '1',
          WEBKIT_DISABLE_COMPOSITING_MODE: '1',
        },
      }
    );

    tauriDriver.on('error', (error) => {
      console.error('tauri-driver error:', error);
      process.exit(1);
    });

    tauriDriver.on('exit', (code) => {
      if (!exit) {
        console.error('tauri-driver exited unexpectedly with code:', code);
        process.exit(1);
      }
    });
  },

  afterSession: () => {
    closeTauriDriver();
  },
};

function closeTauriDriver() {
  exit = true;
  tauriDriver?.kill();
}

function onShutdown(fn) {
  const cleanup = () => {
    try { fn(); } finally { process.exit(); }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('SIGHUP', cleanup);
}

onShutdown(() => closeTauriDriver());
