import { app, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import net from 'node:net';

let serverProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

// Avoids depending on `get-port`, which is ESM-only from v7 and would fail
// to `require()` from this file's compiled CommonJS output.
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close(() => (port ? resolve(port) : reject(new Error('Could not determine a free port'))));
    });
  });
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        return;
      }
    } catch {
      // server not up yet, keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Next.js server did not respond at ${url} within ${timeoutMs}ms`);
}

async function startNextServer(): Promise<string> {
  const port = await getFreePort();
  const dataDir = app.getPath('userData');

  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: '127.0.0.1',
    VINTAGE_FINDER_DATA_DIR: dataDir,
    // The hosted deployment (see middleware.ts) sits behind a Basic Auth
    // password gate since it's reachable from the open internet; this local
    // desktop server never leaves 127.0.0.1, so there's nothing to gate.
    VINTAGE_FINDER_LOCAL: '1',
  };

  if (app.isPackaged) {
    const serverEntry = path.join(process.resourcesPath, 'standalone', 'server.js');
    serverProcess = spawn(process.execPath, [serverEntry], {
      env: { ...env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: 'inherit',
    });
  } else {
    const projectRoot = path.join(__dirname, '..');
    serverProcess = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'dev', '-p', String(port)], {
      cwd: projectRoot,
      env,
      stdio: 'inherit',
      shell: true,
    });
  }

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url);
  return url;
}

async function createWindow() {
  const url = await startNextServer();

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    title: 'Vintage Finder',
    backgroundColor: '#000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await mainWindow.loadURL(url);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  serverProcess?.kill();
});
