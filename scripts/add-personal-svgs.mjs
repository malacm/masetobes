/**
 * Fills the three empty slots in the personal gallery with the vector artworks
 * from the Figma design.
 *
 * Those three items existed already, typed as `video` with an aspect ratio but
 * no file — reserved slots waiting for content. The content turns out to be SVG
 * artwork, not footage, so each becomes an `svg` item pointing at the exported
 * asset. Ratios line up exactly with the Figma frames, which is how the slots
 * were matched to the nodes:
 *
 *   1:39971  452.981 x 452.981  ratio 1      → third
 *   1:39994  1399.94 x 750.962  ratio 1.864  → full
 *   1:40015  452.981 x 319.987  ratio 1.416  → third
 *
 * The SVGs in ./assets/personal are the exact bytes Figma exported — do not
 * hand-edit them; re-export from the node id in the filename instead.
 *
 *   node scripts/add-personal-svgs.mjs [--commit]
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
			return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
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

// _key of the reserved slot → the Figma node exported into it.
const SLOTS = [
	{ key: 'b81b5107-61e2-4cc3-8df3-fb11edf3c424', node: '1:39971', file: 'node-1-39971.svg' },
	{ key: 'de6aca3e-bbca-4392-bb6a-4bbc53a0ee77', node: '1:39994', file: 'node-1-39994.svg' },
	{ key: '5cb09626-1bab-4ee8-87fc-a2e6f16860bd', node: '1:40015', file: 'node-1-40015.svg' }
];

const doc = await client.fetch('*[_id=="personalGallery"][0]{_rev, galleryItems}');
const items = doc?.galleryItems ?? [];
console.log(`personalGallery rev ${doc?._rev}, ${items.length} items\n`);

const plan = SLOTS.map((slot) => {
	const index = items.findIndex((it) => it._key === slot.key);
	const item = items[index];
	const bytes = fs.statSync(path.join(here, 'assets/personal', slot.file)).size;
	return { ...slot, index, item, bytes };
});

for (const p of plan) {
	if (!p.item) {
		console.error(`ABORT: no item with _key ${p.key} — the gallery has changed.`);
		process.exit(1);
	}
	if (p.item.image?.asset) {
		console.error(`ABORT: item ${p.index} already has an image. Nothing to fill.`);
		process.exit(1);
	}
	console.log(
		`  slot ${p.index} (${p.item.layout}, ratio ${p.item.aspectRatio}) ← ${p.file} [${p.bytes}b, node ${p.node}]`
	);
}

if (!commit) {
	console.log('\ndry run — pass --commit to upload and patch.');
	process.exit(0);
}

for (const p of plan) {
	const filePath = path.join(here, 'assets/personal', p.file);
	const asset = await client.assets.upload('image', fs.createReadStream(filePath), {
		filename: p.file,
		contentType: 'image/svg+xml'
	});
	console.log(`\nuploaded ${p.file} → ${asset._id}`);

	await client
		.patch('personalGallery')
		.set({
			[`galleryItems[_key=="${p.key}"].type`]: 'svg',
			[`galleryItems[_key=="${p.key}"].image`]: {
				_type: 'image',
				asset: { _type: 'reference', _ref: asset._id }
			}
		})
		// aspectRatio only backs a video placeholder; the asset ref carries the
		// real dimensions now. video was never populated.
		.unset([
			`galleryItems[_key=="${p.key}"].aspectRatio`,
			`galleryItems[_key=="${p.key}"].video`
		])
		.commit({ returnDocuments: false });
	console.log(`  patched slot ${p.index}`);
}

const after = await client.fetch(
	`*[_id=="personalGallery"][0]{_rev, "empty": count(galleryItems[!defined(image.asset) && !defined(video.asset)]),
	  "svgs": galleryItems[type=="svg"]{layout, "ref": image.asset._ref}}`
);
console.log(`\ndone. rev ${after._rev}, empty slots remaining: ${after.empty}`);
console.log(after.svgs);
