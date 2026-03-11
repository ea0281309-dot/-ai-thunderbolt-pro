import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

import { createServer } from '../src/index.js';

test('health endpoint responds with ok status and CORS headers', async () => {
  const server = createServer();
  server.listen(0);
  await once(server, 'listening');

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal(payload.status, 'ok');
  assert.equal(payload.service, 'ai-thunderbolt-pro-backend');

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});
