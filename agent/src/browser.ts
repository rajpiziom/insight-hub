import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { config } from './config.js';
import { execSync, spawn } from 'child_process';

let browser: Browser | null = null;
let context: BrowserContext | null = null;

const DEBUGGING_PORT = 9223;

/**
 * Ensure Edge is running with remote debugging enabled.
 * If Edge is already running without debugging, we restart it with the flag.
 */
function ensureEdgeWithDebugging(): void {
  // Check if Edge is already listening on the debugging port
  try {
    execSync(`powershell -Command "Get-NetTCPConnection -LocalPort ${DEBUGGING_PORT} -ErrorAction Stop"`, { stdio: 'pipe' });
    console.log(`  ✓ Edge already running with remote debugging on port ${DEBUGGING_PORT}`);
    return;
  } catch {
    // Port not in use, need to start/restart Edge
  }

  console.log(`  🔄 Starting Edge with remote debugging on port ${DEBUGGING_PORT}...`);

  // Find Edge executable
  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  let edgePath = '';
  for (const p of edgePaths) {
    try {
      execSync(`powershell -Command "Test-Path '${p}'"`, { stdio: 'pipe' });
      edgePath = p;
      break;
    } catch {}
  }

  if (!edgePath) {
    throw new Error('Could not find Microsoft Edge. Is it installed?');
  }

  // Launch Edge with remote debugging (detached so it stays open after agent exits)
  spawn(edgePath, [
    `--remote-debugging-port=${DEBUGGING_PORT}`,
    '--profile-directory=Default',
    '--no-first-run',
    '--no-default-browser-check',
  ], {
    detached: true,
    stdio: 'ignore',
  }).unref();

  // Wait for Edge to start
  console.log('  ⏳ Waiting for Edge to start...');
  const start = Date.now();
  while (Date.now() - start < 15000) {
    try {
      execSync(`powershell -Command "Get-NetTCPConnection -LocalPort ${DEBUGGING_PORT} -ErrorAction Stop"`, { stdio: 'pipe' });
      console.log('  ✓ Edge is ready');
      return;
    } catch {
      execSync('timeout /t 1 /nobreak >nul', { stdio: 'pipe' });
    }
  }

  throw new Error('Edge did not start with remote debugging in time. Try closing Edge and running again.');
}

/**
 * Connect to the running Edge browser via CDP.
 * This uses the user's actual browser session with all cookies/logins intact.
 */
export async function launchBrowser(): Promise<BrowserContext> {
  if (context) return context;

  const browserName = config.browserType === 'edge' ? 'Microsoft Edge' : 'Chrome';
  console.log(`🌐 Connecting to your running ${browserName}...`);

  ensureEdgeWithDebugging();

  browser = await chromium.connectOverCDP(`http://127.0.0.1:${DEBUGGING_PORT}`);
  
  // Use the default browser context (has all your cookies/sessions)
  const contexts = browser.contexts();
  if (contexts.length > 0) {
    context = contexts[0];
    console.log(`  ✓ Connected! Using your authenticated session.`);
  } else {
    // Fallback: create new context (shouldn't happen normally)
    context = await browser.newContext();
    console.log(`  ⚠ No existing context found, created new one.`);
  }

  return context;
}

export async function newPage(): Promise<Page> {
  const ctx = await launchBrowser();
  return ctx.newPage();
}

export async function closeBrowser() {
  if (browser) {
    // Disconnect from the browser WITHOUT closing it
    browser.disconnect();
    browser = null;
    context = null;
  }
}
