/**
 * Swaps the footer wordmark for a version without the year in it.
 *
 * The uploaded SVG had "@2025" drawn into the T as a path. Two problems: it
 * could never say 2026, and it scaled with the wordmark, so on a phone it was
 * ~10px of unreadable ink where the mobile frame wants the year at almost twice
 * that share of the T. Footer.svelte now sets the year as live type, sized per
 * breakpoint, which needs an MGT with nothing in the T.
 *
 * scripts/assets/footer-MGT-no-year.svg is the shipping asset with the year
 * path removed — the three letterforms are byte-identical.
 *
 *   node scripts/set-footer-wordmark.mjs [--commit]
 *
 * Without --commit it prints the plan and exits. Backs up siteSettings to
 * ./.backups before writing; the previous asset is left in the media library.
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
			return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1')];
		})
);

const commit = process.argv.includes('--commit');
const token = process.env.SANITY_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN;
if (commit && !token) {
	console.error('ABORT: SANITY_API_WRITE_TOKEN is empty — see scripts/set-playlist.mjs.');
	process.exit(1);
}

const client = createClient({
	projectId: env.PUBLIC_SANITY_PROJECT_ID,
	dataset: env.PUBLIC_SANITY_DATASET || 'production',
	apiVersion: '2026-01-01',
	token,
	useCdn: false
});

const FILE = 'footer-MGT-no-year.svg';
const filePath = path.join(here, 'assets', FILE);

const current = await client.fetch(
	'*[_id == "siteSettings"][0]{_rev, "asset": footerWordmarkAsset.asset->{_id, originalFilename}}'
);
console.log(`current rev: ${current?._rev}; wordmark asset: ${current?.asset?.originalFilename ?? 'none'} (${current?.asset?._id ?? '-'})`);

const existing = await client.fetch(
	'*[_type == "sanity.imageAsset" && originalFilename == $name][0]{_id}',
	{ name: FILE }
);
console.log(existing ? `would reuse ${existing._id}` : `would upload ${FILE} (${fs.statSync(filePath).size} bytes)`);

if (!commit) {
	console.log('\ndry run — pass --commit to write.');
	process.exit(0);
}

fs.mkdirSync(path.join(here, '../.backups'), { recursive: true });
const full = await client.fetch('*[_id == "siteSettings"][0]');
const backup = path.join(here, `../.backups/siteSettings.${full._rev}.json`);
fs.writeFileSync(backup, JSON.stringify(full, null, 2));
console.log(`backed up → ${path.relative(process.cwd(), backup)}`);

let assetId = existing?._id;
if (!assetId) {
	const asset = await client.assets.upload('image', fs.createReadStream(filePath), {
		filename: FILE,
		contentType: 'image/svg+xml'
	});
	assetId = asset._id;
	console.log(`uploaded → ${assetId}`);
}

await client
	.patch('siteSettings')
	.set({ footerWordmarkAsset: { _type: 'image', asset: { _type: 'reference', _ref: assetId } } })
	.commit({ returnDocuments: false });

const after = await client.fetch(
	'*[_id == "siteSettings"][0]{_rev, "asset": footerWordmarkAsset.asset->{_id, originalFilename, url}}'
);
console.log(`committed. new rev: ${after._rev}; wordmark: ${after.asset.originalFilename} ${after.asset.url}`);
