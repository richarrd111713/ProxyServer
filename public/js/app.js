// Point to your Worker domain
const PROXY_BASE = 'https://ancient-wildflower-e432.segundoazjustin633.workers.dev';

const goBtn         = document.getElementById('goButton');
const urlInput      = document.getElementById('urlInput');
const loadStatus    = document.getElementById('loadStatus');
const iframe        = document.getElementById('browserFrame');
const toggleConsole = document.getElementById('toggleConsole');
const closeConsole  = document.getElementById('closeConsole');
const runBtn        = document.getElementById('runButton');
const consoleInput  = document.getElementById('consoleInput');
const consoleOutput = document.getElementById('consoleOutput');

function setConsoleVisible(visible) {
  document.getElementById('consolePanel').classList.toggle('visible', visible);
}

goBtn.addEventListener('click', async () => {
  let url = urlInput.value.trim();
  if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
  loadStatus.textContent = 'Status: Loading…';
  try {
    const res = await fetch(`${PROXY_BASE}?url=${encodeURIComponent(url)}`, {
      mode: 'cors',
      credentials: 'include'
    });
    if (!res.ok) throw new Error(res.statusText);
    const html = await res.text();
    iframe.src = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    loadStatus.textContent = 'Status: Loaded';
  } catch (err) {
    loadStatus.textContent = 'Status: Error';
    alert(err);
  }
});

toggleConsole.addEventListener('click', () =>
  setConsoleVisible(!document.getElementById('consolePanel').classList.contains('visible'))
);
closeConsole.addEventListener('click', () => setConsoleVisible(false));

runBtn.addEventListener('click', () => {
  try {
    const result = iframe.contentWindow.eval(consoleInput.value);
    consoleOutput.textContent = result === undefined ? 'undefined' : result;
  } catch (e) {
    consoleOutput.textContent = 'Error: ' + e;
  }
});
