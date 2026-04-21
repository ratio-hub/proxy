import './index.css';

declare global {
  interface Window {
    proxy: {
      start: () => Promise<
        { ok: true; port: number } | { ok: false; error: string }
      >;
      stop: () => Promise<{ ok: true }>;
    };
  }
}

type State = 'stopped' | 'running' | 'pending' | 'error';

const toggle = document.getElementById('toggle') as HTMLButtonElement;
const statusLabel = document.getElementById('status-label') as HTMLElement;
const statusMeta = document.getElementById('status-meta') as HTMLElement;

let checked = false;
let busy = false;

function setMeta(kind: 'addr' | 'plain', port: number, plain?: string) {
  statusMeta.replaceChildren();
  if (kind === 'plain' && plain !== undefined) {
    statusMeta.textContent = plain;
    return;
  }
  const host = document.createTextNode('localhost');
  const sep = document.createElement('span');
  sep.className = 'status__sep';
  sep.textContent = ':';
  const portNode = document.createTextNode(String(port));
  statusMeta.append(host, sep, portNode);
}

function setState(
  state: State,
  label: string,
  meta: { kind: 'addr'; port: number } | { kind: 'plain'; text: string },
) {
  document.body.dataset.state = state;
  statusLabel.textContent = label;
  if (meta.kind === 'addr') setMeta('addr', meta.port);
  else setMeta('plain', 0, meta.text);
  toggle.setAttribute('aria-checked', String(state === 'running'));
}

toggle.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  toggle.disabled = true;

  if (!checked) {
    setState('pending', 'STARTING', { kind: 'addr', port: 6969 });
    const result = await window.proxy.start();
    if (result.ok) {
      checked = true;
      setState('running', 'RUNNING', { kind: 'addr', port: result.port });
    } else {
      checked = false;
      setState('error', result.error.toUpperCase(), {
        kind: 'plain',
        text: 'port 6969 — failed',
      });
    }
  } else {
    setState('pending', 'STOPPING', { kind: 'addr', port: 6969 });
    await window.proxy.stop();
    checked = false;
    setState('stopped', 'STOPPED', { kind: 'addr', port: 6969 });
  }

  toggle.disabled = false;
  busy = false;
});
