import { contextBridge, ipcRenderer } from 'electron';

type StartResult =
  | { ok: true; port: number }
  | { ok: false; error: string };

contextBridge.exposeInMainWorld('proxy', {
  start: (): Promise<StartResult> => ipcRenderer.invoke('proxy:start'),
  stop: (): Promise<{ ok: true }> => ipcRenderer.invoke('proxy:stop'),
});
