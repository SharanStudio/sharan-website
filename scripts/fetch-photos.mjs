// Downloads the photo album from a public OneDrive folder and writes src/data/photos.json.
//   ONEDRIVE_SHARE_URL="https://1drv.ms/f/..." node scripts/fetch-photos.mjs
// Each sub-folder of the shared folder becomes one album; loose photos go to an album named "General".
// OneDrive thumbnail links expire within hours, so the images are copied into public/photos at build time.
// If anything fails the script keeps the existing manifest and exits cleanly, so the site build never breaks.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SHARE = process.env.ONEDRIVE_SHARE_URL;
if (!SHARE) { console.log('ONEDRIVE_SHARE_URL not set. Keeping the current photo manifest.'); process.exit(0); }

const id = 'u!' + Buffer.from(SHARE).toString('base64').replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
const API = `https://api.onedrive.com/v1.0/shares/${id}`;
const isImage = (it) => it.file && /^image\//.test(it.file.mimeType || '') && !/svg|heic/i.test(it.file.mimeType);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo';
const caption = (name) => name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/^\d{4}[-_ ]?\d{2}[-_ ]?\d{2}\s*/, '').trim();

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url.split('?')[0]}`);
  return r.json();
}
async function children(url) {
  const out = [];
  let next = `${url}?$expand=thumbnails&$top=200`;
  while (next) { const j = await json(next); out.push(...(j.value || [])); next = j['@odata.nextLink']; }
  return out;
}

async function album(title, items) {
  const dir = `public/photos/${slug(title)}`;
  await mkdir(dir, { recursive: true });
  const photos = [];
  for (const it of items.filter(isImage)) {
    const t = it.thumbnails && it.thumbnails[0] && it.thumbnails[0].large;
    if (!t) continue;
    const file = `${slug(it.name.replace(/\.[^.]+$/, ''))}.jpg`;
    const res = await fetch(t.url);
    if (!res.ok) { console.warn('skip', it.name, res.status); continue; }
    await writeFile(`${dir}/${file}`, Buffer.from(await res.arrayBuffer()));
    photos.push({ file: `photos/${slug(title)}/${file}`, caption: caption(it.name), w: t.width, h: t.height, taken: it.photo && it.photo.takenDateTime || it.createdDateTime || null });
  }
  photos.sort((a, b) => String(b.taken).localeCompare(String(a.taken)));
  return { slug: slug(title), title, photos: photos.map(({ taken, ...p }) => p) };
}

try {
  const root = await children(`${API}/root/children`);
  const albums = [];
  const loose = root.filter(isImage);
  if (loose.length) albums.push(await album('General', loose));
  for (const f of root.filter((x) => x.folder)) {
    const kids = await children(`${API}/items/${f.id}/children`);
    const a = await album(f.name, kids);
    if (a.photos.length) albums.push(a);
  }
  if (!albums.length) throw new Error('no photos found');
  await writeFile('src/data/photos.json', JSON.stringify({ albums, sample: false }, null, 2));
  console.log(`Wrote ${albums.length} albums, ${albums.reduce((n, a) => n + a.photos.length, 0)} photos.`);
} catch (e) {
  console.warn('Photo fetch failed, keeping the current manifest:', e.message);
}
