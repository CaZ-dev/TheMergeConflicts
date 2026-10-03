import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { runAudit, AuditError, DEFAULT_MODEL } from './server/audit.js';

const MAX_BODY_BYTES = 12 * 1024 * 1024;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new AuditError('Image too large. Keep it under 12 MB.', 413));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new AuditError('Request body was not valid JSON.', 400));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Serves POST /api/audit from the dev server so there is only ever one
 * process to run. The API key is read here, server side, and never reaches
 * the client bundle. runAudit() is a plain function, so this handler lifts
 * into a serverless function unchanged after the event.
 */
function gemmaApiPlugin(env) {
  return {
    name: 'gemma-audit-api',
    configureServer(server) {
      server.middlewares.use('/api/audit', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Use POST.' }));
          return;
        }

        try {
          const body = await readJsonBody(req);
          const result = await runAudit({
            image: body.image,
            notes: body.notes,
            apiKey: env.GEMINI_API_KEY,
            model: env.GEMMA_MODEL || DEFAULT_MODEL,
          });
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (err) {
          const status = err instanceof AuditError ? err.status : 500;
          res.statusCode = status;
          res.end(JSON.stringify({
            error: err.message || 'Audit failed.',
            detail: err.detail ?? null,
          }));
          // Expected failures (no key, bad upload, model misbehaving) get one
          // readable line. Only genuine faults get a stack trace.
          if (err instanceof AuditError) {
            if (status >= 500) server.config.logger.warn(`[audit] ${err.message}`);
          } else {
            server.config.logger.error(`[audit] ${err.stack || err.message}`);
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), gemmaApiPlugin(env)],
    server: { port: 5173 },
  };
});
