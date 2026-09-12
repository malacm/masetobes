/**
 * Uploads the homepage playlist to Sanity and points siteSettings.playlist at it.
 *
 * The player (MusicPlayer.svelte) reads `siteSettings.playlist`, an array of
 * `playlistTrack` objects, each holding a title, an artist and an uploaded
 * audio file. Until now that array was empty, so the pill read "no tracks yet".
 *
 * The MP3s live outside the repo (they are ~78 MB and belong in Sanity's asset
 * store, not git). Title and artist below were taken from each file's ID3 tags,
 * which is why the Vegyn track reads "Mystery or Misery?" — the filesystem-safe
 * filename swapped the "?" for a "-".
 *
 *   node scripts/set-playlist.mjs [--commit] [--dir <folder>] [--expect-rev <rev>]
 *
 * Without --commit it prints the plan and exits (dry run). With --commit it
 * backs up siteSettings to ./.backups, uploads any MP3 that Sanity doesn't
 * already hold (matched on original filename + byte size, so re-running never
 * duplicates assets), then overwrites the playlist array in order.
 *
 * Track order below is playback order. Edit it here or drag in /studio.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Values written by the Vercel CLI are double-quoted; strip those or the token
// is sent with literal quotes and Sanity answers "Session not found".
const env = Object.fromEntries(
	fs
		.readFileSync('.env', 'utf8')
		.split('\n')
		.filter((line) => line.includes('=') && !line.trim().startsWith('#'))
		.map((line) => {
			const i = line.indexOf('=');
			return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1')];
		})
);

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const expectRev = flag('--expect-rev');
const dir = flag('--dir') ?? path.join(os.homedir(), 'Downloads/Web_Music');

// `vercel env pull` rewrites .env and has left the Sanity tokens blank before;
// the dataset is public so reads still work, which hides the problem until
// the first upload 403s. Fail up front instead. A token in the shell wins,
// so `SANITY_API_WRITE_TOKEN=… node scripts/set-playlist.mjs` also works.
const token = process.env.SANITY_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN;
if (commit && !token) {
	console.error(
		'ABORT: SANITY_API_WRITE_TOKEN is empty. Create an Editor token at\n' +
			'https://www.sanity.io/manage/project/' +
			env.PUBLIC_SANITY_PROJECT_ID +
			'/api#tokens and put it in .env (or export it in the shell).'
	);
	process.exit(1);
}

const client = createClient({
	projectId: env.PUBLIC_SANITY_PROJECT_ID,
	dataset: env.PUBLIC_SANITY_DATASET || 'production',
	apiVersion: '2026-01-01',
	token,
	useCdn: false
});

const TRACKS = [
	{ file: 'K-LONE - someone else.mp3', artist: 'K-LONE', title: 'someone else' },
	{ file: 'Leifur James - I Ran With You.mp3', artist: 'Leifur James', title: 'I Ran With You' },
	{
		file: 'Lonnie Liston Smith, Adrian Younge, Ali Shaheed Muhammad - A New Spring.mp3',
		artist: 'Lonnie Liston Smith, Adrian Younge, Ali Shaheed Muhammad',
		title: 'A New Spring'
	},
	{ file: 'Moodymann - People.mp3', artist: 'Moodymann', title: 'People' },
	{ file: 'Operelly - My Bell Rings.mp3', artist: 'Operelly', title: 'My Bell Rings' },
	{ file: 'Pacific Coliseum - Sunset Melody.mp3', artist: 'Pacific Coliseum', title: 'Sunset Melody' },
	{ file: 'Paul Hardcastle - Cloud Watching.mp3', artist: 'Paul Hardcastle', title: 'Cloud Watching' },
	{ file: 'Roy Ayers - Liquid Love.mp3', artist: 'Roy Ayers', title: 'Liquid Love' },
	{ file: 'Vegyn - Mystery or Misery-.mp3', artist: 'Vegyn', title: 'Mystery or Misery?' }
];

// Stable keys so re-running rewrites the same array entries rather than
// producing fresh _keys the Studio would treat as brand-new items.
const keyFor = (t, i) =>
	`track-${String(i + 1).padStart(2, '0')}-${t.artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const missing = TRACKS.filter((t) => !fs.existsSync(path.join(dir, t.file)));
if (missing.length) {
	console.error(`ABORT: not found in ${dir}:\n${missing.map((t) => `  ${t.file}`).join('\n')}`);
	process.exit(1);
}

const current = await client.fetch('*[_id == "siteSettings"][0]{_rev, playlist}');
console.log(`current rev: ${current?._rev} (${current?.playlist?.length ?? 0} tracks)`);

if (expectRev && current?._rev !== expectRev) {
	console.error(`ABORT: rev is ${current?._rev}, expected ${expectRev}.`);
	process.exit(1);
}

const existing = await client.fetch(
	'*[_type == "sanity.fileAsset" && originalFilename in $names]{_id, originalFilename, size}',
	{ names: TRACKS.map((t) => t.file) }
);

const plan = TRACKS.map((t, i) => {
	const size = fs.statSync(path.join(dir, t.file)).size;
	const found = existing.find((a) => a.originalFilename === t.file && a.size === size);
	return { ...t, _key: keyFor(t, i), size, assetId: found?._id ?? null };
});

console.log(`\nwould write ${plan.length} tracks from ${dir}:`);
for (const p of plan) {
	console.log(
		`  ${p._key.slice(0, 8)} ${p.artist} — ${p.title}  (${mb(p.size)}, ${p.assetId ? `reuse ${p.assetId}` : 'upload'})`
	);
}

if (!commit) {
	console.log('\ndry run — pass --commit to write.');
	process.exit(0);
}

fs.mkdirSync(path.join(here, '../.backups'), { recursive: true });
const full = await client.fetch('*[_id == "siteSettings"][0]');
const backup = path.join(here, `../.backups/siteSettings.${full._rev}.json`);
fs.writeFileSync(backup, JSON.stringify(full, null, 2));
console.log(`\nbacked up → ${path.relative(process.cwd(), backup)}`);

for (const p of plan) {
	if (p.assetId) continue;
	process.stdout.write(`uploading ${p.file} (${mb(p.size)})… `);
	const asset = await client.assets.upload('file', fs.createReadStream(path.join(dir, p.file)), {
		filename: p.file,
		contentType: 'audio/mpeg'
	});
	p.assetId = asset._id;
	console.log(asset._id);
}

const playlist = plan.map((p) => ({
	_type: 'playlistTrack',
	_key: p._key,
	title: p.title,
	artist: p.artist,
	audio: { _type: 'file', asset: { _type: 'reference', _ref: p.assetId } }
}));

await client.patch('siteSettings').set({ playlist }).commit({ returnDocuments: false });

const after = await client.fetch(
	'*[_id == "siteSettings"][0]{_rev, playlist[]{title, artist, "file": audio.asset->originalFilename}}'
);
console.log(`\ncommitted. new rev: ${after._rev}`);
for (const t of after.playlist) console.log(`  ${t.artist} — ${t.title}  ← ${t.file}`);
