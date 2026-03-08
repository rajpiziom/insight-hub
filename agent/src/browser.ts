import { chromium, type BrowserContext, type Page } from 'playwright';
import { config } from './config.js';

let context: BrowserContext | null = null;

/**
 * Launch a Playwright browser using the user's Edge or Chrome profile directly.
 * 
 * IMPORTANT: The browser must be closed before running the agent,
 * as the browser locks the profile directory.
 * Use sync.bat to automate close → sync → reopen.
 */
export async function launchBrowser(): Promise<BrowserContext> {
  if (context) return context;

  const browserName = config.browserType === 'edge' ? 'Microsoft Edge' : 'Chrome';
  console.log(`🌐 Launching browser with your ${browserName} profile...`);
  console.log(`   Profile: ${config.browserProfilePath}`);

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
