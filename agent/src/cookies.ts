import { join } from 'path';
import { existsSync } from 'fs';
import Database from 'better-sqlite3';
import { config } from './config.js';

/**
 * Read cookies for a specific domain from Chrome's SQLite cookie store.
 * 
 * NOTE: Chrome encrypts cookies on macOS (Keychain) and Windows (DPAPI).
 * This simple reader works when:
 * - Chrome is NOT running (it locks the DB), OR you copy the Cookies file first
 * - On Linux where cookies are often unencrypted or use a simpler scheme
 * 
 * For macOS/Windows with encrypted cookies, use the Playwright approach instead
 * (launch browser with your profile, cookies are loaded automatically).
 */
export function readChromeCookies(domain: string): { name: string; value: string }[] {
  const cookiePath = join(config.chromeProfilePath, 'Cookies');

  if (!existsSync(cookiePath)) {
    console.warn(`⚠ Chrome Cookies DB not found at ${cookiePath}`);
    console.warn('  Using Playwright with your Chrome profile instead (recommended).');
    return [];
  }

  try {
    // Copy cookies file to avoid lock issues
    const tempPath = join(config.chromeProfilePath, '..', 'Cookies_agent_copy');
    const fs = await import('fs');
    fs.copyFileSync(cookiePath, tempPath);

    const db = new Database(tempPath, { readonly: true });
    const rows = db.prepare(
      `SELECT name, value, encrypted_value FROM cookies WHERE host_key LIKE ?`
    ).all(`%${domain}%`) as { name: string; value: string; encrypted_value: Buffer }[];

    db.close();

    // Return unencrypted cookies (encrypted ones need platform-specific decryption)
    return rows
      .filter(r => r.value && r.value.length > 0)
      .map(r => ({ name: r.name, value: r.value }));
  } catch (err: any) {
    console.warn(`⚠ Could not read Chrome cookies: ${err.message}`);
    return [];
  }
}

// Workaround for top-level await in the import
async function copyFile(src: string, dest: string) {
  const fs = await import('fs');
  fs.copyFileSync(src, dest);
}
