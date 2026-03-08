import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { config } from './config.js';

let context: BrowserContext | null = null;

/**
 * Launch a Playwright browser using the user's Edge or Chrome profile.
 * This automatically picks up cookies/sessions from the user's normal browser.
 * 
 * IMPORTANT: The browser must be closed before running the agent,
 * as the browser locks the profile directory.
 */
export async function launchBrowser(): Promise<BrowserContext> {
  if (context) return context;

  const browserName = config.browserType === 'edge' ? 'Microsoft Edge' : 'Chrome';
  console.log(`🌐 Launching browser with your ${browserName} profile...`);
  console.log(`   Profile: ${config.browserProfilePath}`);

  // For Edge, we use the msedge channel; for Chrome, use chrome channel
  const channel = config.browserType === 'edge' ? 'msedge' : 'chrome';

  context = await chromium.launchPersistentContext(config.browserProfilePath, {
    headless: config.headless,
    channel,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  });

  return context;
}

export async function newPage(): Promise<Page> {
  const ctx = await launchBrowser();
  return ctx.newPage();
}

export async function closeBrowser() {
  if (context) {
    await context.close();
    context = null;
  }
}
