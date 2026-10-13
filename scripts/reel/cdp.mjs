/**
 * A thin DevTools-protocol client over headless Chrome, with no dependencies:
 * Node's own fetch and WebSocket, and the Chrome already on the machine.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

const CANDIDATES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

export function findChrome() {
  const found = CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error('No Chrome found; set CHROME to the browser binary.');
  return found;
}

/** Launches a headless Chrome and attaches to its one page. */
export async function launch({ port = 9333, width = 1920, height = 1080, profile, chrome = findChrome() }) {
  mkdirSync(profile, { recursive: true });
  const proc = spawn(
    chrome,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--disable-extensions',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--force-device-scale-factor=1',
      '--font-render-hinting=none',
      '--disable-lcd-text',
      `--window-size=${width},${height}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  let targets = [];
  for (let i = 0; i < 100; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      if (targets.some((t) => t.type === 'page')) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  const page = targets.find((t) => t.type === 'page');
  if (!page) {
    proc.kill();
    throw new Error('Chrome did not open a page target');
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(msg.error.message));
      else res(msg.result);
    } else if (msg.method && listeners.has(msg.method)) {
      for (const fn of listeners.get(msg.method)) fn(msg.params);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const i = ++id;
      pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const on = (method, fn) => {
    if (!listeners.has(method)) listeners.set(method, new Set());
    listeners.get(method).add(fn);
    return () => listeners.get(method).delete(fn);
  };
  /** Runs an expression in the page and returns its value; a returned promise is awaited. */
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const close = () => {
    try {
      ws.close();
    } catch {
      /* already gone */
    }
    proc.kill();
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  return { send, on, evaluate, close };
}
