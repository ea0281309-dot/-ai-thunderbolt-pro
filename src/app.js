const apiBaseUrl =
  document.querySelector('meta[name="api-base-url"]')?.getAttribute('content') ||
  'http://localhost:3001';

const apiUrlNode = document.getElementById('api-url');
const statusNode = document.getElementById('status-text');
const timestampNode = document.getElementById('status-timestamp');
const refreshButton = document.getElementById('refresh-button');

apiUrlNode.textContent = apiBaseUrl;

async function checkBackend() {
  statusNode.textContent = 'Checking…';

  try {
    const response = await fetch(`${apiBaseUrl}/health`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Backend health check failed');
    }

    statusNode.textContent = `${payload.status} (${payload.service})`;
    timestampNode.textContent = payload.timestamp;
  } catch (error) {
    statusNode.textContent = `Unavailable: ${error.message}`;
    timestampNode.textContent = '—';
  }
}

refreshButton.addEventListener('click', checkBackend);

checkBackend();
