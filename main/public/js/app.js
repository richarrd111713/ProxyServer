// 1) Make PROXY_BASE absolute so it always points at your function
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
  let target = urlInput.value.trim();
  if (!target) { 
    alert('Enter a URL.'); 
    return; 
  }
  if (!/^https?:\/\//i.test(target)) {
    target = 'http://' + target;
  }
  
  loadStatus.textContent = 'Loading…';
  try {
    const res = await fetch(
      `${PROXY_BASE}?url=${encodeURIComponent(target)}`,
      { credentials: 'include', mode: 'cors' }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // 2) Use srcdoc to inject only into the iframe
    iframe.srcdoc = html;

    loadStatus.textContent = 'Loaded';
  } catch (err) {
    loadStatus.textContent = 'Error';
    alert('Load failed: ' + err);
  }
});

// Console toggles
toggleConsole.addEventListener('click', () =>
  setConsoleVisible(!iframe.classList.contains('visible'))
);
closeConsole.addEventListener('click', () => setConsoleVisible(false));

// Run JS inside the iframe
runBtn.addEventListener('click', () => {
  try {
    const result = iframe.contentWindow.eval(consoleInput.value);
    consoleOutput.textContent = result === undefined ? 'undefined' : result;
  } catch (e) {
    consoleOutput.textContent = 'Error: ' + e;
  }
});
