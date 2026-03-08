import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { config } from './config.js';

let browser: Browser | null = null;
let context: BrowserContext | null = null;

/**
 * Launch a Playwright browser using the user's Chrome profile.
 * This automatically picks up cookies/sessions from the user's normal Chrome.
 * 
 * IMPORTANT: Chrome must be closed before running the agent,
 * or use a separate Chrome profile directory.
 */
export async function launchBrowser(): Promise<BrowserContext> {
  if (context) return context;

  console.log('🌐 Launching browser with your Chrome profile...');
  console.log(`   Profile: ${config.chromeProfilePath}`);

  // Launch Chromium using the user's Chrome profile for authenticated sessions
  browser = await chromium.launchPersistentContext(config.chromeProfilePath, {
    headless: config.headless,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }) as unknown as BrowserContext;

  // The persistent context IS the browser context
  context = browser as unknown as BrowserContext;

  return context;
}

export async function newPage(): Promise<Page> {
  const ctx = await launchBrowser();
  return ctx.newPage();
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    context = null;
  }
}
