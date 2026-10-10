// Reads the public `site` views from Supabase at build time. Without credentials it uses src/data/sample.json,
// so the site always builds. Set SUPABASE_URL and SUPABASE_ANON_KEY (the publishable key) to use real data.
import sample from '../data/sample.json';

const URL = import.meta.env.SUPABASE_URL;
const KEY = import.meta.env.SUPABASE_ANON_KEY;
export const usingSample = !(URL && KEY);

const TABLES = Object.keys(sample);
let cache;

export async function getData() {
  if (cache) return cache;
  if (usingSample) return (cache = sample);
  const out = {};
  for (const t of TABLES) {
    const res = await fetch(`${URL}/rest/v1/${t}?select=*`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Accept-Profile': 'site' } });
    // A missing view (for example before the database migration) falls back to an empty list, never to a failed build.
    out[t] = res.ok ? await res.json() : [];
    if (!res.ok) console.warn(`site.${t}: HTTP ${res.status}`);
  }
  return (cache = out);
}
