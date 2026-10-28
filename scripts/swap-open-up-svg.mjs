/**
 * Swaps the OPEN UP wordmark in the personal gallery from the PNG the Figma
 * import rendered to the vector export of the same node, so it can be inlined
 * and animated in like the other three artworks (see add-personal-svgs.mjs).
 *
 *   1:39977  Wordmark_5  1399.94 x 504.907  ratio 2.773  → full
 *
 * ./assets/personal/node-1-39977.svg holds the six letter paths lifted out of
 * the node's SVG export, in the node's own coordinates — the export wraps the
 * artwork in the page's background frames, which are left out. The item's
 * type becomes `svg` and its image points at the uploaded file; the PNG asset
 * is left in place, so the swap is reversible from the backup or from Sanity's
 * own history.
 *
 *   node scripts/swap-open-up-svg.mjs [--commit]
 *
 * Without --commit it reports what it would do and exits (dry run).
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const env = Object.fromEntries(
	fs
		.readFileSync('.env', 'utf8')
		.split('\n')
		.filter((line) => line.includes('=') && !line.trim().startsWith('#'))
		.map((line) => {
			const i = line.indexOf('=');
			return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, '')];
		})
);

const commit = process.argv.includes('--commit');

const client = createClient({
	projectId: env.PUBLIC_SANITY_PROJECT_ID,
	dataset: env.PUBLIC_SANITY_DATASET || 'production',
	apiVersion: '2026-01-01',
	token: env.SANITY_API_WRITE_TOKEN,
	useCdn: false
});

const KEY = 'ea919147-521c-475e-ae0c-dbc9244d55e7';
const FILE = path.join(here, 'assets/personal/node-1-39977.svg');

const doc = await client.fetch('*[_id=="personalGallery"][0]{_rev, galleryItems}');
const items = doc?.galleryItems ?? [];
const index = items.findIndex((it) => it._key === KEY);
const item = items[index];
console.log(`personalGallery rev ${doc?._rev}, ${items.length} items\n`);

if (!item) {
	console.error(`ABORT: no item with _key ${KEY} — the gallery has changed.`);
	process.exit(1);
}
if (item.type !== 'image' || !/-2800x1010-png$/.test(item.image?.asset?._ref ?? '')) {
	console.error(`ABORT: item ${index} is not the OPEN UP png (${item.type}, ${item.image?.asset?._ref}).`);
	process.exit(1);
}
console.log(`  slot ${index} (${item.layout}) ${item.image.asset._ref}\n    ← ${path.relative(process.cwd(), FILE)} [${fs.statSync(FILE).size}b]`);

if (!commit) {
	console.log('\nDry run — pass --commit to upload and patch.');
	process.exit(0);
}

const backupDir = path.join(process.cwd(), '.backups');
fs.mkdirSync(backupDir, { recursive: true });
const full = await client.fetch('*[_id=="personalGallery"][0]');
const backup = path.join(backupDir, `personalGallery-${Date.now()}.json`);
fs.writeFileSync(backup, JSON.stringify(full, null, 2));
console.log(`\nbacked up to ${path.relative(process.cwd(), backup)}`);

const asset = await client.assets.upload('image', fs.createReadStream(FILE), {
	filename: 'node-1-39977.svg',
	contentType: 'image/svg+xml'
});
console.log(`uploaded ${asset._id}`);

await client
	.patch('personalGallery')
	.ifRevisionId(doc._rev)
	.set({
		[`galleryItems[_key=="${KEY}"].type`]: 'svg',
		[`galleryItems[_key=="${KEY}"].image`]: {
			_type: 'image',
			asset: { _type: 'reference', _ref: asset._id }
		}
	})
	.commit();
console.log('patched personalGallery');
