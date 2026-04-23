import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { serve, type ServerType } from '@hono/node-server';
import { buildProxyApp, PROXY_PORT } from './proxy-app';

let server: ServerType | null = null;

function closeServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
    server = null;
  });
}

ipcMain.handle('proxy:start', async () => {
  if (server) return { ok: true, port: PROXY_PORT };

  return await new Promise<
    { ok: true; port: number } | { ok: false; error: string }
  >((resolve) => {
    try {
      const hono = buildProxyApp();
      server = serve({ fetch: hono.fetch, port: PROXY_PORT }, (info) => {
        console.log(`Proxy server running on http://localhost:${info.port}`);
        resolve({ ok: true, port: info.port });
      });
      server.on('error', (err: Error) => {
        server = null;
        resolve({ ok: false, error: err.message });
      });
    } catch (err) {
      server = null;
      resolve({ ok: false, error: (err as Error).message });
    }
  });
});

ipcMain.handle('proxy:stop', async () => {
  await closeServer();
  return { ok: true };
});

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 420,
    height: 320,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'Ratio Proxy',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    backgroundColor: '#09090b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.on('ready', createWindow);

app.on('window-all-closed', async () => {
  await closeServer();
  app.quit();
});

app.on('before-quit', async () => {
  await closeServer();
});
