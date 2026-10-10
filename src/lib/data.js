// Reads the public `site` views from Supabase at build time. Without credentials it uses src/data/sample.json,
// so the site always builds. Set SUPABASE_URL and SUPABASE_ANON_KEY (the publishable key) to use real data.
import sample from '../data/sample.json';

const URL = process.env.SUPABASE_URL || import.meta.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
export const usingSample = !(URL && KEY);

const TABLES = Object.keys(sample);
let cache;

export async function getData() {
  if (cache) return cache;
  if (usingSample) return (cache = sample);
  const out = {};
  // New-style publishable keys (sb_publishable_...) go in the apikey header only. Legacy JWT keys also need Authorization.
  const headers = { apikey: KEY, 'Accept-Profile': 'site' };
  if (!KEY.startsWith('sb_')) headers.Authorization = `Bearer ${KEY}`;
  // These two views must load. If they fail, stop the build so a good live site is never replaced by an empty one.
  const REQUIRED = ['site_settings', 'stats'];
  for (const t of TABLES) {
    const res = await fetch(`${URL}/rest/v1/${t}?select=*`, { headers });
    if (!res.ok && REQUIRED.includes(t)) throw new Error(`site.${t} failed to load (HTTP ${res.status}). Check that the "site" schema is exposed in Supabase and the migration ran.`);
    // Other views fall back to an empty list, so one missing view never breaks the build.
    out[t] = res.ok ? await res.json() : [];
    if (!res.ok) console.warn(`site.${t}: HTTP ${res.status}`);
  }
  if (!out.site_settings.length) throw new Error('site.site_settings returned no row. Check site_settings.owner_user_id.');
  return (cache = out);
}
