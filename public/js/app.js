// Your Worker URL (no trailing slash)
const PROXY_BASE = 'https://ancient-wildflower-e432.segundoazjustin633.workers.dev';

// Helpers
const goBtn         = document.getElementById('goButton');
const urlInput      = document.getElementById('urlInput');
const loadStatus    = document.getElementById('loadStatus');
const iframe        = document.getElementById('browserFrame');
const toggleConsole = document.getElementById('toggleConsole');
const closeConsole  = document.getElementById('closeConsole');
const runBtn        = document.getElementById('runButton');
const consoleInput  = document.getElementById('consoleInput');
const consoleOutput = document.getElementById('consoleOutput');

function setConsoleVisible(yes) {
  document.getElementById('consolePanel')
          .classList.toggle('visible', yes);
}

// Load URL through proxy into iframe.srcdoc
goBtn.addEventListener('click', async () => {
  let url = urlInput.value.trim();
  if (!url) {
    alert('Please enter a URL.');
    return;
  }
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }
  loadStatus.textContent = 'Loading…';

  try {
    const res = await fetch(`${PROXY_BASE}?url=${encodeURIComponent(url)}`, {
      credentials: 'include', mode: 'cors'
    });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const html = await res.text();
    iframe.srcdoc = html;
    loadStatus.textContent = 'Loaded';
  } catch (e) {
    loadStatus.textContent = 'Error';
    alert('Load failed: ' + e);
  }
});

// Toggle console panel
toggleConsole.addEventListener('click', () => {
  const panel = document.getElementById('consolePanel');
  setConsoleVisible(!panel.classList.contains('visible'));
});
closeConsole.addEventListener('click', () => setConsoleVisible(false));

// Run JS in the iframe (same‑origin via srcdoc)
runBtn.addEventListener('click', () => {
  try {
    const result = iframe.contentWindow.eval(consoleInput.value);
    consoleOutput.textContent = result === undefined ? 'undefined' : result;
  } catch (e) {
    consoleOutput.textContent = 'Error: ' + e;
  }
});
