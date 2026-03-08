import 'dotenv/config';
import { homedir, platform } from 'os';
import { join } from 'path';

function defaultChromePath(): string {
  const p = platform();
  const home = homedir();
  if (p === 'darwin') return join(home, 'Library', 'Application Support', 'Google', 'Chrome', 'Default');
  if (p === 'win32') return join(home, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default');
  return join(home, '.config', 'google-chrome', 'Default');
}

export const config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  userEmail: process.env.USER_EMAIL || '',
  userPassword: process.env.USER_PASSWORD || '',
  chromeProfilePath: process.env.CHROME_PROFILE_PATH || defaultChromePath(),
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
