import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { extractText, getDocumentProxy } from 'unpdf';

export type Result<TResult, TError = Error> = [TError, null] | [null, TResult];

async function tryCatch<TResult, TError = Error>(
  task: (() => TResult | Promise<TResult>) | Promise<TResult>,
): Promise<Result<TResult, TError>> {
  try {
    const data = await (task instanceof Function ? task() : task);
    return [null, data];
  } catch (err) {
    return [err as TError, null];
  }
}

function tryCatchSync<TResult, TError = Error>(
  callback: () => TResult,
): Result<TResult, TError> {
  try {
    return [null, callback()];
  } catch (err) {
    return [err as TError, null];
  }
}

const log = {
  info: (route: string, step: string, data?: Record<string, unknown>) => {
    console.log(`[INFO] [${route}] ${step}`, data ? JSON.stringify(data) : '');
  },
  error: (
    route: string,
    step: string,
    err: Error,
    data?: Record<string, unknown>,
  ) => {
    console.error(`[ERROR] [${route}] ${step}`, {
      message: err.message,
      stack: err.stack,
      ...data,
    });
  },
};

export const PROXY_PORT = 6969;

export function buildProxyApp(): Hono {
  const hono = new Hono();
  hono.use('*', logger());
  hono.use('*', cors());

  hono.get('/proxy/health', (c) => c.json({ status: 'ok' }));

  hono.get('/proxy/pdf-file', async (c) => {
    const route = 'pdf-file';
    const target = c.req.query('url');

    if (!target) {
      log.info(route, 'missing url param');
      return c.text('Missing url param', 400);
    }

    log.info(route, 'start', { target });

    const [parseErr, targetUrl] = tryCatchSync(() => new URL(target));
    if (parseErr) {
      log.error(route, 'invalid url', parseErr, { target });
      return c.text('Invalid url param', 400);
    }

    if (targetUrl.protocol !== 'https:') {
      log.info(route, 'protocol rejected', { protocol: targetUrl.protocol });
      return c.text('Only https allowed', 400);
    }

    log.info(route, 'fetching pdf', { target });

    const [fetchErr, response] = await tryCatch(
      fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      }),
    );

    if (fetchErr) {
      log.error(route, 'fetch failed', fetchErr, { target });
      return c.text(`Failed to fetch PDF: ${fetchErr.message}`, 502);
    }

    log.info(route, 'fetch complete', {
      status: response.status,
      contentType: response.headers.get('content-type'),
    });

    const [bufferErr, arrayBuffer] = await tryCatch(response.arrayBuffer());

    if (bufferErr) {
      log.error(route, 'buffer read failed', bufferErr);
      return c.text(`Failed to read PDF: ${bufferErr.message}`, 502);
    }

    log.info(route, 'complete', { size: arrayBuffer.byteLength });

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="file.pdf"',
      },
    });
  });

  hono.get('/proxy/parse-pdf', async (c) => {
    const route = 'parse-pdf';
    const target = c.req.query('url');

    if (!target) {
      log.info(route, 'missing url param');
      return c.text('Missing url param', 400);
    }

    log.info(route, 'start', { target });

    const [fetchErr, response] = await tryCatch(fetch(target));
    if (fetchErr) {
      log.error(route, 'fetch failed', fetchErr, { target });
      return c.text(`Failed to fetch PDF: ${fetchErr.message}`, 502);
    }

    log.info(route, 'fetch complete', { status: response.status });

    const [bufferErr, buffer] = await tryCatch(response.arrayBuffer());
    if (bufferErr) {
      log.error(route, 'buffer read failed', bufferErr);
      return c.text(`Failed to read PDF: ${bufferErr.message}`, 502);
    }

    log.info(route, 'parsing pdf', { size: buffer.byteLength });

    const [pdfErr, pdf] = await tryCatch(
      getDocumentProxy(new Uint8Array(buffer)),
    );
    if (pdfErr) {
      log.error(route, 'pdf parse failed', pdfErr);
      return c.text(`Failed to parse PDF: ${pdfErr.message}`, 502);
    }

    log.info(route, 'extracting text');

    const [extractErr, result] = await tryCatch(
      extractText(pdf, { mergePages: true }),
    );
    if (extractErr) {
      log.error(route, 'text extraction failed', extractErr);
      return c.text(`Failed to extract text: ${extractErr.message}`, 502);
    }

    log.info(route, 'complete', {
      totalPages: result.totalPages,
      textLength: result.text.length,
    });

    return c.json({ totalPages: result.totalPages, text: result.text });
  });

  return hono;
}
