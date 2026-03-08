import 'dotenv/config';
import { homedir, platform } from 'os';
import { join } from 'path';

export type BrowserType = 'edge' | 'chrome';

function defaultBrowserPath(browser: BrowserType): string {
  const p = platform();
  const home = homedir();

  if (browser === 'edge') {
    if (p === 'darwin') return join(home, 'Library', 'Application Support', 'Microsoft Edge', 'Default');
    if (p === 'win32') return join(home, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default');
    return join(home, '.config', 'microsoft-edge', 'Default');
  }

  // Chrome
  if (p === 'darwin') return join(home, 'Library', 'Application Support', 'Google', 'Chrome', 'Default');
  if (p === 'win32') return join(home, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default');
  return join(home, '.config', 'google-chrome', 'Default');
}

const browserType = (process.env.BROWSER_TYPE || 'edge') as BrowserType;

export const config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  userEmail: process.env.USER_EMAIL || '',
  userPassword: process.env.USER_PASSWORD || '',
  browserType,
  browserProfilePath: process.env.BROWSER_PROFILE_PATH || defaultBrowserPath(browserType),
  syncIntervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '60', 10),
  headless: process.env.HEADLESS !== 'false',
};

export function validateConfig() {
  const required = ['supabaseUrl', 'supabaseAnonKey', 'userEmail', 'userPassword'] as const;
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required config: ${key}. Set it in .env`);
    }
  }
}
