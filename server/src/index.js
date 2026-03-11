import http from 'node:http';

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify(payload));
}

export function createServer() {
  return http.createServer((request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Origin': '*'
      });
      response.end();
      return;
    }

    if (request.url === '/health' && request.method === 'GET') {
      json(response, 200, {
        service: 'ai-thunderbolt-pro-backend',
        status: 'ok',
        timestamp: new Date().toISOString()
      });
      return;
    }

    json(response, 404, {
      error: 'Not Found'
    });
  });
}

const isMainModule = process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url;

if (isMainModule) {
  const port = Number.parseInt(process.env.PORT || '3001', 10);
  const server = createServer();

  server.listen(port, () => {
    console.log(`AI Thunderbolt Pro backend listening on ${port}`);
  });
}
