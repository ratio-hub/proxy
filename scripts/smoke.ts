/**
 * Smoke test for the Hono proxy app — boots the server on a random port,
 * hits a couple of endpoints, verifies status codes, and tears down.
 *
 * Run from the repo root with any TS runner:
 *   ~/.bun/bin/bun run scripts/smoke.ts
 */
import { serve } from '@hono/node-server';
import { buildProxyApp } from '../src/proxy-app';

const PORT = 16969;

async function main() {
  const hono = buildProxyApp();
  const server = serve({ fetch: hono.fetch, port: PORT });

  await new Promise((r) => setTimeout(r, 200));

  const base = `http://localhost:${PORT}`;
  let failures = 0;

  // 1. /proxy/health returns { status: "ok" }
  {
    const res = await fetch(`${base}/proxy/health`);
    const body = await res.json();
    const ok = res.status === 200 && (body as { status: string }).status === 'ok';
    console.log(`health: ${ok ? 'OK' : 'FAIL'} (status=${res.status}, body=${JSON.stringify(body)})`);
    if (!ok) failures += 1;
  }

  // 2. /proxy/pdf-file without url → 400
  {
    const res = await fetch(`${base}/proxy/pdf-file`);
    const ok = res.status === 400;
    console.log(`pdf-file (no url): ${ok ? 'OK' : 'FAIL'} (status=${res.status})`);
    if (!ok) failures += 1;
  }

  // 3. /proxy/pdf-file with http (not https) → 400
  {
    const res = await fetch(`${base}/proxy/pdf-file?url=http://example.com/foo.pdf`);
    const ok = res.status === 400;
    console.log(`pdf-file (http url): ${ok ? 'OK' : 'FAIL'} (status=${res.status})`);
    if (!ok) failures += 1;
  }

  // 4. /proxy/parse-pdf without url → 400
  {
    const res = await fetch(`${base}/proxy/parse-pdf`);
    const ok = res.status === 400;
    console.log(`parse-pdf (no url): ${ok ? 'OK' : 'FAIL'} (status=${res.status})`);
    if (!ok) failures += 1;
  }

  await new Promise<void>((r) => server.close(() => r()));

  if (failures > 0) {
    console.error(`${failures} smoke-test check(s) failed`);
    process.exit(1);
  }
  console.log('\nall smoke checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
