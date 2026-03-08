import { chromium, type BrowserContext, type Page } from 'playwright';
import { config } from './config.js';
import { cpSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let context: BrowserContext | null = null;

/**
 * Copy the user's browser profile to a temp directory so the original
 * browser can stay open (Playwright needs exclusive access to the profile dir).
 * 
 * We only copy the essential files needed for cookies/sessions, not the entire
 * profile (which can be many GB).
 */
function copyProfileToTemp(): string {
  const tempProfile = join(tmpdir(), 'newsintel-agent-profile');

  // Clean and recreate
  if (existsSync(tempProfile)) {
    // Remove old copy
    const { rmSync } = require('fs');
    rmSync(tempProfile, { recursive: true, force: true });
  }
  mkdirSync(tempProfile, { recursive: true });

  const src = config.browserProfilePath;

  // Essential files for authenticated sessions
  const essentialFiles = [
    'Cookies',
    'Cookies-journal',
    'Login Data',
    'Login Data-journal',
    'Web Data',
    'Web Data-journal',
    'Local State',
    'Preferences',
    'Secure Preferences',
  ];

  // Also need the parent-level Local State for cookie decryption on Windows
  const parentDir = join(src, '..');
  const parentLocalState = join(parentDir, 'Local State');
  const tempParentLocalState = join(tempProfile, '..', 'Local State');
  if (existsSync(parentLocalState)) {
    try {
      cpSync(parentLocalState, tempParentLocalState, { force: true });
    } catch {
      // Non-critical
    }
  }

  for (const file of essentialFiles) {
    const fileSrc = join(src, file);
    if (existsSync(fileSrc)) {
      try {
        cpSync(fileSrc, join(tempProfile, file), { force: true });
      } catch (err: any) {
        // Some files may be locked, that's ok
        console.warn(`  ⚠ Could not copy ${file}: ${err.message}`);
      }
    }
  }

  // Copy Network directory (session cookies)
  const networkDir = join(src, 'Network');
  if (existsSync(networkDir)) {
    try {
      cpSync(networkDir, join(tempProfile, 'Network'), { recursive: true, force: true });
    } catch {
      // Non-critical
    }
  }

  console.log(`  📁 Copied session files to temp profile`);
  return tempProfile;
}

/**
 * Launch a Playwright browser using a COPY of the user's Edge/Chrome profile.
 * This allows the user to keep their normal browser open.
 */
export async function launchBrowser(): Promise<BrowserContext> {
  if (context) return context;

  const browserName = config.browserType === 'edge' ? 'Microsoft Edge' : 'Chrome';
  console.log(`🌐 Launching browser with copied ${browserName} session...`);
  console.log(`   Source profile: ${config.browserProfilePath}`);

  const tempProfile = copyProfileToTemp();

  const channel = config.browserType === 'edge' ? 'msedge' : 'chrome';

  context = await chromium.launchPersistentContext(tempProfile, {
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
