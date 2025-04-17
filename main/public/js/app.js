// Use the full origin so the proxy always targets your function
const PROXY_BASE = window.location.origin + '/api/proxy';

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

goBtn.addEventListener('click', async () => {
  let url = urlInput.value.trim();
  if (!url) { alert('Enter a URL.'); return; }
  if (!/^https?:\/\//i.test(url)) url = 'http://' + url;

  loadStatus.textContent = 'Loading…';
  try {
    const res = await fetch(`${PROXY_BASE}?url=${encodeURIComponent(url)}`, {
      credentials: 'include',
      mode: 'cors'
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    // Use srcdoc so <base> tags injected by the function work
    iframe.srcdoc = html;
    loadStatus.textContent = 'Loaded';
  } catch (err) {
    loadStatus.textContent = 'Error';
    alert('Error loading page: ' + err);
  }
});

toggleConsole.addEventListener('click', () =>
  setConsoleVisible(!document.getElementById('consolePanel')
                          .classList.contains('visible'))
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
